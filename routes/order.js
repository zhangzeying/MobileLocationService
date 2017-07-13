/**
 * Created by zzy on 08/07/2017.
 */
const express = require('express');
const router = express.Router();
const async = require("asyncawait/async")
const await = require("asyncawait/await")
const db = require("../util/db");
const util = require("../util/util");
const crypto = require('crypto');
const fs = require('fs');
var request = require('superagent');

const buyGoods = (req, res) => {

    try {

        if(!req.body.productId) {

            res.json({
                flag:0,
                msg:"商品id不能为空！"
            })
            return;
        }

        let productId = db.pool.escape(req.body.productId);
        let sqlStr = `select product_name as productName, price from tb_product where id = ${productId}`;
        let data = await(db.query(db.pool,sqlStr));

        let sqlStr1 = "select question from tb_system_notification";
        let data1 = await(db.query(db.pool,sqlStr1));

        if (data.length>0){

            res.json({
                flag:1,
                result:{

                    "productId":req.body.productId,
                    "productName":data[0].productName,
                    "price":data[0].price,
                    "question":data1.length>0?data1[0].question:""
                }
            })

        } else {

            res.json({
                flag:2,
                msg:"不存在该商品！",
            })
        }
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

const payProduct = (req, res) => {

    try {

        if (!req.body.productId || !req.body.price || !req.body.payType || !req.body.productName || !req.body.username){

            res.json({
                flag:0,
                msg:"操作失败！"
            })
            return;
        }

        let username = req.body.username;
        let productId = req.body.productId;
        let productName = req.body.productName;
        let payType = req.body.payType;
        let timestamp = (Date.parse(new Date()))/1000;
        let mchNo = '10037544';
        let mchOrderNo = `${timestamp}${util.createVerificationCode(4)}`;
        let notifyUrl = 'http://139.199.8.67:3000/order/payResultCallBack';
        let returnUrl = 'http://139.199.8.67:3000/order/payResultCallBack';
        let mark = 'mobile';
        let signType = 'RSA';
        let price = req.body.price;
        let data = `${mchNo}|${mchOrderNo}|${req.body.productId}|${req.body.productName}|${req.body.price}|${req.body.payType}|${returnUrl}|${notifyUrl}|${mark}`
        let privatePem = fs.readFileSync('./routes/rsa_private_key.pem');
        let key = privatePem.toString();
        let sig = crypto.createSign("RSA-MD5");
        sig.update(data);
        let sign = sig.sign(key,'base64');
        request
            .post('http://p.weixinxiu.cn/Pay.do')
            .set('Content-Type','application/x-www-form-urlencoded')
            .set('Accept', 'application/json')
            .send({
                'mchNo': mchNo,
                'mchOrderNo': mchOrderNo,
                'productId': productId,
                'productName': productName,
                'price': price,
                'payType': payType,
                'notifyUrl': notifyUrl,
                'returnUrl': returnUrl,
                'mark': mark,
                'sign': sign,
                'signType': signType
            })
            .end(async(function(err, response){
                try {

                    let resultText = JSON.parse(response.text);
                    if (resultText.Result == 'SUCCESS'){

                        let sqlStr = `insert into tb_order (order_no,product_id,username,order_state) values (${mchOrderNo},${productId},${db.pool.escape(username)},0)`;
                        let result = await(db.query(db.pool,sqlStr));
                        if (result.affectedRows>0){

                            res.json({
                                flag:1,
                                result:{
                                    "payUrl":resultText.Data.length>0?resultText.Data:''
                                }
                            })

                        } else {

                            res.json({
                                flag: 0,
                                msg: "失败"
                            })
                        }

                    } else {

                        res.json({
                            flag: 0,
                            msg: "失败"
                        })
                    }
                }
                catch (err) {

                    res.json({
                        flag: 0,
                        msg: req.app.get('env') === 'development'?err.message:"失败"
                    })
                }
            }))
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

const payResultCallBack = (req, res) => {

    try {

        let mchOrderNo  = req.body.mchOrderNo;
        let order_no = req.body.order_no;
        let price = req.body.price;
        let payEndTime = req.body.payEndTime;
        let mark = req.body.mark;
        let result = req.body.result;
        let sign = req.body.sign;
        let payType = req.body.payType;
        let data = `${payType}|${mchOrderNo}|${order_no}|${price}|${payEndTime}|${mark}|${result}`;
        let publicPem = fs.readFileSync('./routes/rsa_public_key.pem');
        let key = publicPem.toString();
        let verify = crypto.createVerify('RSA-MD5');
        verify.update(data);
        let ret = verify.verify(key, sign, 'base64');
        if (ret) {

            let sqlStr1 = `select username,order_state as orderState from tb_order where order_no = ${mchOrderNo}`;
            let data = await(db.query(db.pool,sqlStr1));
            if (data.length>0){

                if (data[0].orderState == 0) {

                    let sqlStr2 = `update tb_order set order_state = 1 where order_no = ${mchOrderNo}`;
                    let result = await(db.query(db.pool,sqlStr2));
                    if (result.affectedRows>0){

                        let sqlStr3 = 'select authorization_code as authCode from tb_global_param';
                        let data3 = await(db.query(db.pool,sqlStr3));
                        let authCode = data3[0].authCode;
                        if (authCode.length>0){

                            // 修改为您的短信账号
                            const account="Vipyrr168";
                            // 修改为您的短信密码
                            const pswd="T1x2b3456";
                            request
                                .post('https://sapi.253.com/msg/HttpBatchSendSM')
                                .set('Content-Type','application/x-www-form-urlencoded')
                                .set('Accept', 'application/json')
                                .send({
                                    'account': account,
                                    'pswd': pswd,
                                    'mobile':data[0].username,
                                    'msg':`您的授权码为  ${authCode}  请牢记切勿告知他人！（定位系统）`,
                                    'needstatus':'true'
                                })
                                .end(function(err, response){

                                })
                        }


                    }
                }

            }

            res.send('SUCCESS');


        } else {

            res.send('FAIL');
        }
    }
    catch (err) {

        res.send('FAIL');
    }
}

router.post('/buyGoods', async(buyGoods));
router.post('/payProduct', async(payProduct));
router.post('/payResultCallBack', async(payResultCallBack));
module.exports = router;