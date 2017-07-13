/**
 * Created by zzy on 05/06/2017.
 */
const express = require('express');
const router = express.Router();
const async = require("asyncawait/async")
const await = require("asyncawait/await")
const db = require("../util/db");
const util = require("../util/util");

const getAllBackGround = (req, res) => {

    try {

        let sqlStr = "select id,password from tb_background_setting";
        let data = await(db.query(db.pool,sqlStr));
        res.json({
            flag: 1,
            msg: "操作成功",
            result: data
        })
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

const setBackGroundPassword = (req, res) => {

    try {

        let bgId = db.pool.escape(req.body.bgId);
        let password = db.pool.escape(req.body.password);
        let sqlStr = `select count(1) as count from tb_background_setting where id = ${bgId}`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0].count>0){

            let sqlStr = `update tb_background_setting set password = ${password} where id = ${bgId}`;
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

            let sqlStr = `insert into tb_background_setting(password) values (${password})`;
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

    const checkBackGroundPwd = (req, res) => {

    try {

        let bgId = db.pool.escape(req.body.bgId);
        let password = db.pool.escape(req.body.password);
        let sqlStr = `select count(1) as count from tb_background_setting where id = ${bgId} and password = ${password}`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0].count > 0) {

            res.json({
                flag: 1,
                msg: "成功"
            })
        } else {

            res.json({
                flag:2,
                msg:"密码错误"
            })
            return;
        }

    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

const getNotification = (req, res) => {

    try {

        let sqlStr = "select notification from tb_system_notification";
        let data = await(db.query(db.pool,sqlStr));
        res.json({
            flag: 1,
            msg: "操作成功",
            result: data.length>0?data[0]:{"notification":""}
        })
    }
    catch (err) {

        res.json({
            flag: 0,
            msg: req.app.get('env') === 'development'?err.message:"失败"
        })
    }
}

const setNotification = (req, res) => {

    try {

        let notification = db.pool.escape(req.body.notification);
            let sqlStr = `select count(1) as count from tb_system_notification`;
            let data = await(db.query(db.pool,sqlStr));
            if (data[0].count>0){

            let sqlStr = `update tb_system_notification set notification = ${notification}`;
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

            let sqlStr = `insert into tb_system_notification(notification) values (${notification})`;
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


router.get('/getAllBackGround', async(getAllBackGround));
router.post('/setBackGroundPassword', async(setBackGroundPassword));
router.post('/checkBackGroundPwd', async(checkBackGroundPwd));
router.get('/getNotification', async(getNotification));
router.post('/setNotification', async(setNotification));
module.exports = router;