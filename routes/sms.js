/**
 * Created by zzy on 23/05/2017.
 */
const express = require('express');
const router = express.Router();
const http = require('http');
const querystring = require('querystring');
const util = require("../util/util");
const async=require("asyncawait/async");
const await=require("asyncawait/await");
const redisClient = require("../util/redisClient");
// 修改为您的短信账号
const account="Vipyrr168";
// 修改为您的短信密码
const pswd="T1x2b3456";
// 短信域名地址
const sms_host = 'sapi.253.com';
// 发送短信地址
const send_sms_uri = '/msg/HttpBatchSendSM';
// 查询余额地址
const query_balance_uri = '/msg/QueryBalance';

//保存数据到redis
const saveDataToRedis = (mobile,verifyCode,clientIp) => {

    let mobileKey = `MbLVerifyCode${mobile}`;
    let clientIpKey =  `MbLClientIp${clientIp}`;
    return new Promise((resolve, reject) => redisClient.multi().set(mobileKey,verifyCode).expire(mobileKey,60*5).set(clientIpKey,clientIp).expire(clientIpKey,60).exec(function(err, object) {
        if (!err){
            if (err){
                reject(err);
            }else {
                resolve();
            }
        } else {
            reject(err);
        }
    }));
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


//发送短信验证码
const send = (req, res) => {

    try {

        if (!req.body.mobile){

            res.json({
                flag: 0,
                msg: "手机号不能为空"
            })
            return;
        }

        if (!(util.isValidMobileNum(req.body.mobile))){
            res.json({
                flag:0,
                msg:"手机号格式不正确"
            })
            return;
        }

        let isExist = await(checkRedisKeyIsExist(`MbLClientIp${util.getClientIp(req)}`));
        if (isExist) {//如果存在，说明没过60s，先检测ip

            res.json({
                flag:0,
                msg:"请稍后再试"
            })
            return;
        }

        isExist = await(checkRedisKeyIsExist(`MbLVerifyCode${req.body.mobile}`));
        if (isExist) {//如果存在，说明没过60s，再检测手机

            res.json({
                flag:0,
                msg:"请稍后再试"
            })
            return;
        }

        let verifyCode = util.createVerificationCode(4);
        let mobile = req.body.mobile;
        let postData = { // 这是需要提交的数据
            'account': account,
            'pswd': pswd,
            'mobile':mobile,
            'msg':`您的验证码是${verifyCode}，五分钟内有效，如非本人操作，请忽略。［号码定位系统］`,
            'needstatus':'true',
        };

       post(req,res,send_sms_uri,postData,sms_host,verifyCode);

        // query_blance(query_balance_uri,account,pswd);
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }


}

// // 查询余额方法
// const query_blance = (uri,content,host) => {
//
//     let post_data = { // 这是需要提交的数据
//         'account': account,
//         'pswd': pswd,
//     };
//     let content = querystring.stringify(post_data);
//     post(uri,content,sms_host);
// }

const post = (req,res,uri,postData,host,verifyCode) => {

    try {

        let content = querystring.stringify(postData);
        let options = {
            hostname: host,
            port: 80,
            path: uri,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': content.length
            }
        };
        let httpReq = http.request(options, function (httpRes) {

            if (httpRes.statusCode==200){

                httpRes.setEncoding('utf8');
                httpRes.on('data', function (data) {

                    let dataArr = data.split(',');
                    let status = dataArr[1].substring(0, 1);
                    if (status=='0'){//获取验证码成功

                        saveDataToRedis(postData.mobile,verifyCode,util.getClientIp(req));
                        res.json({
                            flag:1,
                            msg:"操作成功"
                        })
                    } else {
                        res.json({
                            flag:0,
                            msg:"操作失败"
                        })
                    }
                });
            } else {
                res.json({
                    flag:0,
                    msg:"操作失败"
                })
            }
        });
        httpReq.write(content);
        httpReq.end();
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

router.post('/send', async(send));
module.exports = router;