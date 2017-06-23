/**
 * Created by zzy on 07/05/2017.
 */
const mysql = require("mysql");
var async=require("asyncawait/async");
var await=require("asyncawait/await");
const pool = mysql.createPool({
    host:"localhost",
    user:"root",
    password: "qazwsx123",
    database: "mobilelocation",
    connectionLimit: 50,
    dataStrings:true
});

const query = (pool,sqlStr) => {

    return new Promise((resolve, reject) => pool.query(sqlStr,function(error,results,fields) {
        if (!error){
            resolve(results);
        } else {

            reject(error);
        }
    }));
}

exports.query = query;
exports.pool = pool;