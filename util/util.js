/**
 * Created by zzy on 08/05/2017.
 */
var schedule = require("node-schedule");
// var jwt = require("jsonwebtoken");
var redisClient = require("./redisClient");
var config = require('./config');
var db = require("./db");
var async=require("asyncawait/async");
var await=require("asyncawait/await");
const deleteUserTask = () => {

    let rule = new schedule.RecurrenceRule();

    rule.dayOfWeek = [0, new schedule.Range(1, 6)];

    rule.hour = 1;

    rule.minute = 0;

    schedule.scheduleJob(rule, function(){

        db.query(db.pool,"delete from tb_user where TO_DAYS(NOW()) - TO_DAYS(register_date) > 7");
    });
}

const updateDataFromRedisToSqlTask = () => {

    let rule = new schedule.RecurrenceRule();

    rule.minute = [0,5,10,15,20,25,30,35,40,45,50,55];

    schedule.scheduleJob(rule, function(){

        redisClient.smembers(config.redis.listKey,function (err,array) {

            if (!err) {

                try {
                    for (let data of array) {

                        redisClient.hgetall(data,function(err, object) {
                            if (object) {

                                let username = data.substring(config.redis.userLocationKeyPrefix.length);
                                let sqlStr = `update tb_user set latitude=${object.latitude},longitude=${object.longitude} where username=${username}`;
                                db.pool.query(sqlStr,function(error,results,fields) {
                                                    if (!err) {
                                                        if (results.affectedRows>0){
                                                            redisClient.srem(config.redis.listKey,data,function (err) {
                                                                if (err){
                                                                    console.log(err);
                                                                }
                                            });
                                        }
                                    }
                                 });

                            }
                        });
                    }
                }
                catch (err){

                    console.log(err);
                }
            }
        });
    });
}

// function createToken(username) {
//
//     return jwt.sign({name: username}, config.secret,{
//         expiresIn: 60*60**24  // 24小时过期
//     });
// }
//
// function verifyToken(token) {
//
//     // var token = rq.body.token || rq.query.token || rq.headers["x-access-token"]; // 从body或query或者header中获取token
//     jwt.verify(token, config.secret, (err, obj) => {
//         if (!err) {
//             return obj.name;
//         }
//     })
// }

const isValidMobileNum = (mobile) => {

    const regex = /^1[3|4|5|7|8]+\d{9}$/
    return regex.test(mobile);
}

const createVerificationCode = (randLength) => {

    let code = '';
    for(let i = 0; i < randLength; i++){
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

const getClientIp = (req) => {
    let ipAddress;
    let forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        let forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
}

exports.deleteUserTask = deleteUserTask;
exports.updateDataFromRedisToSqlTask = updateDataFromRedisToSqlTask;
exports.isValidMobileNum = isValidMobileNum;
exports.createVerificationCode = createVerificationCode;
exports.getClientIp = getClientIp;