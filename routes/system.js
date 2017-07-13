/**
 * Created by zzy on 22/05/2017.
 */
var express = require('express');
var router = express.Router();
const async = require("asyncawait/async")
const await = require("asyncawait/await")
const db = require("../util/db");
const util = require("../util/util");
//根据手机号查询短信内容
const control = (req, res) => {

    res.json({
        flag:0
    })
}

const getUserAgreement = (req, res) => {

    try {

        let sqlStr = "select user_agreement as userAgreement from tb_user_agreement";
        let data = await(db.query(db.pool,sqlStr));
        res.json({
            flag: 1,
            msg: "操作成功",
            result: data.length>0?data[0]:{"userAgreement":""}
        })
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

const updateUserAgreement = (req, res) => {

    try {

        let userAgreement = db.pool.escape(req.body.userAgreement);
        let sqlStr = `select count(1) as count from tb_user_agreement`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0].count>0){

            let sqlStr = `update tb_user_agreement set user_agreement = ${userAgreement}`;
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

            let sqlStr = `insert into tb_user_agreement(user_agreement) values (${userAgreement})`;
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

router.get('/control', control);
router.get('/getUserAgreement', async(getUserAgreement));
router.post('/updateUserAgreement', async(updateUserAgreement));
module.exports = router;