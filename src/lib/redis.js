var debug = require('debug')('Albion:Lib:Redis');
var redis = require("redis");
var client = redis.createClient(process.env.REDIS_URL || 'redis://h:p4807552d35f49c7d00a04ddef9d350a40ccea8e94ce9df1ef0e1ba608e450e92@ec2-34-251-131-150.eu-west-1.compute.amazonaws.com:20719', {no_ready_check: true});

client.on("error", function (err) {
    debug("Redis :: " + err);
});
client.on("connect", function (err) {
    debug("Redis connected");
});

module.exports = client;
