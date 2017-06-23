/**
 * Created by zzy on 10/05/2017.
 */
const express = require('express');
const router = express.Router();
const async = require("asyncawait/async")
const await = require("asyncawait/await")
const db = require("../util/db");
const moment = require("moment");
const util = require("../util/util");

//短信拦截上传短信
const saveMsgContent = (req, res) => {

    try {

        if (!req.body.msgContent || !req.body.mobile) {

            res.json({
                flag: 0,
                msg: "短信内容或手机号不能为空"
            })
            return;
        }

        let mobile = db.pool.escape(req.body.mobile);
        let sqlStr = `select id from tb_user where username=${mobile}`;
        let data = await(db.query(db.pool,sqlStr));
        if (data.length>0) {

            let userId = db.pool.escape(data[0].id);
            let msgContent = db.pool.escape(req.body.msgContent);
            let sqlStr = `insert into tb_message (user_id,message_content,message_date,mobile) values(${userId},${msgContent},NOW(),${mobile})`;
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

            res.json({
                flag: 0,
                msg: "该手机号不存在对应的用户"
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

//根据手机号查询短信内容
const getMsgContentByMobile = (req, res) => {

    try {

        if (!req.query.mobile) {

            res.json({
                flag: 0,
                msg: "手机号不能为空"
            })
            return;
        }

        let mobile = db.pool.escape(req.query.mobile);
        let sqlStr = `call check_user_pro(${mobile})`;
        let data = await(db.query(db.pool,sqlStr));
        if (data[0][0].count>0){
            let sqlStr = `select message_content,message_date from tb_message where mobile=${mobile}`;
            let data = await(db.query(db.pool,sqlStr));
            for (var rowData of data) {
                    rowData.message_date = moment(rowData.message_date).format("YYYY-MM-D h:mm:ss");
            }
            res.json({
                flag: 1,
                msg: "操作成功",
                result: data
            })
        } else {
            res.json({
                flag: 0,
                msg: "该手机号未注册"
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

router.post('/saveMsgContent', async(saveMsgContent));
router.get('/getMsgContentByMobile', async(getMsgContentByMobile));
module.exports = router;