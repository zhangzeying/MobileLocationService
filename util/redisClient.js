/**
 * Created by zzy on 16/05/2017.
 */
var redis = require("redis");
var config = require('./config');

var client = redis.createClient(config.redis.port || 6379, config.redis.host || 'localhost');
client.on('error', function (err) {
    console.error('Redis连接错误: ' + err);
});

module.exports = client;
