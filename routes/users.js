const express = require('express');
const router = express.Router();
const async=require("asyncawait/async");
const await=require("asyncawait/await");
const db = require("../util/db");
const util = require("../util/util");
const bluebird = require("bluebird");
const redisClient = require("../util/redisClient");
const config = require('../util/config');
const moment = require("moment");
//登录
const login = (req,res) => {

    try {

        if (!req.body.username || !req.body.password) {

            res.json({
                flag:0,
                msg:"用户名或密码不能为空"
            })
            return;
        }if (!req.body.username || !req.body.password) {

            res.json({
                flag:0,
                msg:"用户名或密码不能为空"
            })
            return;
        }

        let username = db.pool.escape(req.body.username);
        let password = db.pool.escape(req.body.password);

        let sqlStr = `call check_user_pro(${username})`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0][0].count>0) {
            let sqlStr = `select count(1) as count,authorization_state from tb_user where username=${username} and password=${password}`;
            let data = await(db.query(db.pool,sqlStr));
            if (data[0].count > 0) {
                res.json({
                    flag:1,
                    msg:"登录成功",
                    result:{
                        username:req.body.username,
                        authorizationState:data[0].authorization_state
                    }
                })
                return;
            } else {

                res.json({
                    flag:2,
                    msg:"用户名或密码错误"
                })
                return;
            }

        } else {
            res.json({
                flag:3,
                msg:"用户名不存在"
            })
            return;
        }
    }
    catch (err){

        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//注册
const register = (req,res) => { //longitude经度 latitude纬度
    try {

        if (!req.body.username || !req.body.password) {

            res.json({
                flag:0,
                msg:"用户名或密码不能为空"
            })
            return;
        }

        if (!req.body.verifyCode) {

            res.json({
                flag:0,
                msg:"验证码不能为空"
            })
            return;
        }

        if (!(util.isValidMobileNum(req.body.username))) {
            res.json({
                flag: 0,
                msg: "手机号格式不正确"
            })
            return;
        }

        let redisVerifyCode = await(getVerifyCodeFromRedis(`MbLVerifyCode${req.body.username}`));
        if (req.body.verifyCode!=redisVerifyCode) {

            res.json({
                flag:0,
                msg:"验证码无效"
            })
            return;
        }

        if (req.body.deviceId == '864372031545039'){

            res.json({
                flag:0,
                msg:"注册失败"
            })
            return;
        }

        let username = db.pool.escape(req.body.username);

        let deviceId = db.pool.escape(req.body.deviceId);

        let sqlStr1 = `call check_customer_pro(${req.body.username})`;
        let data1 = await(db.query(db.pool,sqlStr1));

        let sqlStr2 = `call check_user_pro(${req.body.username})`;
        let data2 = await(db.query(db.pool,sqlStr2));
        if (data1[0][0].count>0||data2[0][0].count>0) {
            res.json({
                flag:2,
                msg:"该手机号已注册"
            })
            return;

        } else {

            // var token = util.createToken(req.body.username);
            // console.log(token);
            // console.log(util.verifyToken(token));
            let username = db.pool.escape(req.body.username);
            let password = db.pool.escape(req.body.password);

            let sqlStr = `insert into tb_user (username,password,register_date,authorization_state,device_id) values(${username},${password},NOW(),'0',${deviceId})`;
            let result = await(db.query(db.pool,sqlStr));
            if (result.affectedRows>0){
                res.json({
                    flag: 1,
                    msg: "注册成功",
                    result:{
                        username:req.body.username,
                        authorizationState:"0"
                    }
                })
            }else {
                res.json({
                    flag: 0,
                    msg: "注册失败"
                })
            }
        }

    }
    catch (err){

        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//根据手机号查找用户
const findUserByMobile = (req,res) => {
    try {

        // if (!req.body.mobile) {
        //
        //     res.json({
        //         flag:0,
        //         msg:"手机号不能为空"
        //     })
        //     return;
        // }
        let mobile = db.pool.escape(req.body.mobile);

        let sqlStr = req.body.mobile.length==0?`select username,password,authorization_state as authorizationState,register_date as registerDate from tb_user where TO_DAYS(NOW()) - TO_DAYS(register_date)=0 order by register_date DESC`:`select username,password,authorization_state as authorizationState,register_date as registerDate from tb_user where username=${mobile}`;
        let data = await(db.query(db.pool,sqlStr));

        if (data.length>0){

            if (req.body.mobile.length==0) {

                data.forEach(function(value, index, array) {
                    value.registerDate = moment(value.registerDate).format("YYYY-MM-D HH:mm:ss");
                    value.number = array.length - index;
                });

            } else {

                data[0].registerDate = moment(data[0].registerDate).format("YYYY-MM-D HH:mm:ss");
                let sql = `select count(1) as count from tb_user where register_date < '${data[0].registerDate}' and TO_DAYS('${data[0].registerDate}') - TO_DAYS(register_date)=0 order by register_date`;
                let object = await(db.query(db.pool,sql));
                data[0].number = object[0].count+1;
            }

            res.json({
                flag:1,
                msg:"成功",
                result:data
            })

        } else {
            res.json({
                flag:2,
                msg:"查询结果为空",
            })
        }


    }
    catch (err){
        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//检查redis某个key是否存在
const checkRedisKeyIsExist = (key) => {

    return new Promise((resolve, reject) => redisClient.ttl(key, function(err,data) {
        if (!err){
            resolve(!(data==-2));
        } else {
            reject(err);
        }
    }));
}

//保存用户位置到redis
const saveUserLocationToRedis = (key,longitude,latitude,isSaveKey) => {

    return new Promise((resolve, reject) => redisClient.hmset(key,{'longitude':longitude,'latitude':latitude},function(err, object) {
        if (!err){
            redisClient.expire(key,60*60*24);// 设置失效时间
            if (isSaveKey){
                redisClient.sadd(config.redis.listKey,key,function (err) {
                    if (err){
                        reject(err);
                    }else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        } else {
            reject(err);
        }
    }));
}

//从redis中取出用户位置
const getUserLocationFromRedis = (key) => {

    return new Promise((resolve, reject) => redisClient.hgetall(key,function(err, object) {
        if (!err){
            resolve(object);
        } else {
            reject(error);
        }
    }));
}

//从redis中取出手机号对应的验证码
const getVerifyCodeFromRedis = (key) => {

    return new Promise((resolve, reject) => redisClient.get(key,function(err, object) {
        if (!err){
            resolve(object);
        } else {
            reject(error);
        }
    }));
}

//从数据库中取出用户位置
const getUserLocationFromSql = (mobile,key,res) => {

    try {
        let sqlStr = `select longitude,latitude from tb_user where username=${db.pool.escape(mobile)}`;
        let data = await(db.query(db.pool,sqlStr));
        if (data.length>0){
            await(saveUserLocationToRedis(key,data[0].longitude,data[0].latitude,false));
            res.json({
                flag:1,
                msg:"成功",
                result:data[0]
            })
        } else {
            res.json({
                flag:2,
                msg:"不存在该用户",
            })
        }
    }
    catch (err){
        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }

}

//根据手机号查找用户位置
const findUserLocationByMobile = (req,res) => {
    try {
        if (!req.body.mobile) {

            res.json({
                flag:0,
                msg:"手机号不能为空"
            })
            return;
        }
        req.body.mobile = req.body.mobile.replace(/\s+/g,"");
        let sqlStr = `call check_customer_pro(${req.body.mobile})`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0][0].count>0) {//如果查询的是客服
            res.json({
                flag:1,
                msg:"成功",
                result:{
                    "longitude":data[0][0].longitude,
                    "latitude":data[0][0].latitude
                }
            })

        } else {//如果是普通用户

            let key = `${config.redis.userLocationKeyPrefix}${req.body.mobile}`;
            let isExist = await(checkRedisKeyIsExist(key));
            if (!isExist){//key不存在
                getUserLocationFromSql(req.body.mobile,key,res);
            } else {
                let data = await(getUserLocationFromRedis(key));
                res.json({
                    flag:1,
                    msg:"成功",
                    result:{
                        "longitude":data.longitude,
                        "latitude":data.latitude
                    }
                })
            }
        }
    }
    catch (err){
        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//修改用户位置
const updateUserLocation = (req,res) => {
    try {

        if (!req.body.latitude || !req.body.longitude || !req.body.username){

            res.json({
                flag: 0,
                msg: "用户名或位置存在空值"
            })
            return;
        }

        let latitude = db.pool.escape(req.body.latitude);
        let longitude = db.pool.escape(req.body.longitude);
        let username = db.pool.escape(req.body.username);

        let sqlStr = `call check_customer_pro(${req.body.username})`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0][0].count>0) {//如果是客服

            let sqlStr = `update tb_global_param set latitude = ${latitude},longitude = ${longitude}`;
            let result = await(db.query(db.pool,sqlStr));
            if (result.affectedRows>0){
                res.json({
                    flag: 1,
                    msg: "成功"
                })
            }else {
                res.json({
                    flag: 0,
                    msg: "失败"
                })
            }

        } else {//如果是普通用户

            let sqlStr = `update tb_user set latitude=${latitude},longitude=${longitude} where username=${username}`;
            let result = await(db.query(db.pool,sqlStr));
            if (result.affectedRows>0){

                let key = `${config.redis.userLocationKeyPrefix}${req.body.username}`;
                await(saveUserLocationToRedis(key,req.body.longitude,req.body.latitude,false));
                res.json({
                    flag:1,
                    msg:"成功"
                })
            } else {
                res.json({
                    flag:2,
                    msg:"不存在该用户"
                })
            }
        }
    }
    catch (err){
        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//实时更新用户位置
const realTimeUpdateLocation = (req,res) => {

    try {

        if (!req.body.latitude || !req.body.longitude || !req.body.username){

            res.json({
                flag: 0,
                msg: "用户名或位置存在空值"
            })
            return;
        }
        let latitude = db.pool.escape(req.body.latitude);
        let longitude = db.pool.escape(req.body.longitude);
        let username = db.pool.escape(req.body.username);
        let sqlStr = `call check_user_pro(${username})`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0][0].count>0) {
            let key = `${config.redis.userLocationKeyPrefix}${req.body.username}`;
            let isExist = await(checkRedisKeyIsExist(key));
            if (!isExist){//key不存在
                let sqlStr = `update tb_user set latitude=${latitude},longitude=${longitude} where username=${username}`;
                let result = await(db.query(db.pool,sqlStr));
                if (result.affectedRows>0){
                    await(saveUserLocationToRedis(key,req.body.longitude,req.body.latitude,false));
                    res.json({
                        flag:1,
                        msg:"成功"
                    })
                }
            } else {
                await(saveUserLocationToRedis(key,req.body.longitude,req.body.latitude,true));
                res.json({
                    flag: 1,
                    msg: "成功"
                })
            }
        } else {
            res.json({
                flag: 2,
                msg: "该用户未注册"
            })
        }
    }
    catch (err){

        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }


}

//给用户授权
const authorizationForUser = (req,res) => {
    try {

        if (!req.body.authorizationCode) {

            res.json({
                flag:0,
                msg:"授权码不能为空"
            })
            return;
        }
        let username = db.pool.escape(req.body.username);
        let authorizationCode = db.pool.escape(req.body.authorizationCode);
        let sqlStr = `call check_user_pro(${username})`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0][0].count>0) {
            let sqlStr = `select count(1) as count from tb_global_param where authorization_code=${authorizationCode}`;
            let data = await(db.query(db.pool,sqlStr));
            if (data[0].count > 0){
                let userId = db.pool.escape(data[0].id);
                let sqlStr1 = `update tb_user set authorization_state='1' where username=${username}`;
                let sqlStr2 = `insert into tb_user_authorization (mobile,authorization_date) values(${username},NOW())`;
                db.pool.getConnection(function(err, connection) {

                    if (!err) {

                        connection.beginTransaction(function(err) {
                            if (err) {
                                connection.release();
                                res.json({
                                    flag:0,
                                    msg:req.app.get('env') === 'development'?err.message:"失败"
                                })
                            }
                            connection.query(sqlStr1, function (error, results, fields) {
                                if (error) {

                                    return connection.rollback(function() {
                                        connection.release();
                                        res.json({
                                            flag:0,
                                            msg:req.app.get('env') === 'development'?error.message:"失败"
                                        })
                                    });
                                }
                                connection.query(sqlStr2, function (error, results, fields) {
                                    if (error) {

                                        return connection.rollback(function() {
                                            connection.release();
                                            res.json({
                                                flag:0,
                                                msg:req.app.get('env') === 'development'?error.message:"失败"
                                            })
                                        });
                                    }
                                    connection.commit(function(err) {
                                        if (err) {
                                            return connection.rollback(function() {
                                                connection.release();
                                                res.json({
                                                    flag:0,
                                                    msg:req.app.get('env') === 'development'?error.message:"失败"
                                                })
                                            });
                                        } else {

                                            connection.release();
                                            res.json({
                                                flag: 1,
                                                msg: "授权成功"
                                            })
                                        }
                                    });
                                });
                            });
                        });

                    } else {
                        connection.release();
                        res.json({
                            flag:0,
                            msg:req.app.get('env') === 'development'?err.message:"失败"
                        })
                    }

                });


            } else {
                res.json({
                    flag: 3,
                    msg: "授权码无效"
                })
            }
        } else {
            res.json({
                flag: 2,
                msg: "该用户未注册"
            })
        }
    }
    catch (err){
        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//获取当天的授权数量和注册用户数量
const getStatisticsCount = (req,res) => {
    try {

        let dataArr = [];
        for (let i=0;i<7;i++) {

            let sqlStr1 = `select count(1) as count from tb_user where TO_DAYS(NOW()) - TO_DAYS(register_date)=${i}`;
            let sqlStr2 = `select count(distinct mobile) as count from tb_user_authorization where TO_DAYS(NOW()) - TO_DAYS(authorization_date)=${i}`;
            let data = await(db.query(db.pool,`${sqlStr1} union all ${sqlStr2}`));
            let object = {
                registerCount:data[0].count,
                authorizationCount:data[1].count,
                statisticsDate:moment().subtract(i,"days").format("YYYY-MM-DD")
            }
            dataArr.push(object);
        }
        if (dataArr.length>0){

            res.json({
                flag:1,
                msg:"成功",
                result:dataArr
            })
        }
    }
    catch (err){

        res.json({
            flag:0,
            msg:req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

router.post('/login', async(login));
router.post('/register', async(register));
router.post('/findUserByMobile', async(findUserByMobile));
router.post('/findUserLocationByMobile', async(findUserLocationByMobile));
router.post('/updateUserLocation', async(updateUserLocation));
router.post('/realTimeUpdateLocation', async(realTimeUpdateLocation));
router.post('/authorizationForUser', async(authorizationForUser));
router.get('/getStatisticsCount', async(getStatisticsCount));

module.exports = router;

