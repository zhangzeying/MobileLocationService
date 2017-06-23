/**
 * Created by zzy on 10/05/2017.
 */
const express = require('express');
const router = express.Router();
const async = require("asyncawait/async")
const await = require("asyncawait/await")
const db = require("../util/db");
const util = require("../util/util");

//获取客服信息
const getInfoFromBg = (req, res) => {

    try {

        let sqlStr = "select mobile,qq,url1,authorization_code,url2 from tb_global_param";
        let data = await(db.query(db.pool,sqlStr));
        res.json({
            flag: 1,
            msg: "操作成功",
            result:data.length>0?data[0]:{"mobile":"","qq":"","url1":"","url2":"","authorization_code":""}
        })
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//获取客服信息
const getInfo = (req, res) => {

    try {

        let sqlStr = "select mobile,qq,url1 as url,url2 from tb_global_param";
        let data = await(db.query(db.pool,sqlStr));
        res.json({
            flag: 1,
            msg: "操作成功",
            result: data.length>0?data[0]:{"mobile":"","qq":"","url":"","url2":""}
        })
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

//设置客服信息
const setInfo = (req, res) => {

    try {

        let mobile = db.pool.escape(req.body.mobile);
        let qq = db.pool.escape(req.body.qq);
        let url1 = db.pool.escape(req.body.url1);
        let url2 = db.pool.escape(req.body.url2);
        let authorizationCode = db.pool.escape(req.body.authorizationCode);
        let sqlStr = `select count(1) as count from tb_global_param`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0].count>0){

            let sqlStr = `update tb_global_param set mobile = ${mobile},qq = ${qq},url1=${url1},url2=${url2},authorization_code=${authorizationCode} `;
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
        } else {

            let sqlStr = `insert into tb_global_param(mobile,qq,url1,url2,authorization_code) values (${mobile},${qq},${url1},${url2},${authorizationCode})`;
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
        }
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}


router.get('/getInfo', async(getInfo));
router.get('/backGround/getInfoFromBg', async(getInfoFromBg));
router.post('/setInfo', async(setInfo));
module.exports = router;