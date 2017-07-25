var debug = require('debug')('Albion:Plugin:ServerStatus');
var Plugin = require('./base-plugin');

var albionAPI = require('albion-api');
var redis = require('../redis');

// TEMP
var request = require('request');
var async = require('async');

// globals
var REDIS_PLUGIN_KEY = 'server-status';
var outputChannels = {};
var current = {
  live: {
    status: null
  },
  staging: {
    status: null
  }
};

class Killboard extends Plugin {

  onInit() {
    redis.get(REDIS_PLUGIN_KEY, (err, val) => {
      if(err || val === null) {
        return debug(`Error: ${err} val: ${val}`);
      }
      debug("Setting channels from redis", val);
      var outputChannels = JSON.parse(val);
    });
  }

  checkStatus(message) {
    var match = message.cleanContent.match(/^\!albion status$/i);
    if(!match) {
      return;
    }

    albionAPI.getServerStatus((err, status) => {
      debug("Server status", status);
      message.reply(`\n\`\`\`Live: ${status.live.status} - ${status.live.message}\nStaging: ${status.staging.status} - ${status.staging.message}\`\`\``);
    });
  }

  setChannel(message) {
    var match = message.cleanContent.match(/^\!albion statusalert(.*)$/i);
    if(!match) {
      return;
    }
    if(!this.hasAdmin(message)) {
      debug(`setChannel: Blocked admin request from ${message.author.name}`);
      return;
    }

    var channel = message.mentions.channels.first() || message.channel; // default to current channel
    var guild = message.guild.name;

    outputChannels[message.guild.name] = message.channel.name;
    redis.set(REDIS_PLUGIN_KEY, JSON.stringify(outputChannels));
    this.reply(message, `status alert channel set to #${message.channel.name}`);
  }

  onMessage(message) {
    // Requires you to be in a discord, not supporting individuals.
    if(!message.guild || !message.channel) {
      return;
    }
    this.checkStatus(message);
    this.setChannel(message);
  }

  getServerStatus(cb) {
    async.parallel({
      live: (cb) => {
        request('http://live.albiononline.com/status.txt', (e,r,b) => {
          cb(null, JSON.parse(b.trim()));
        });
      },
      staging: (cb) => {
        request('http://staging.albiononline.com/status.txt', (e,r,b) => {
          cb(null, JSON.parse(b.trim()));
        });
      }
    }, (e, rs) => {
      if(e) {
        return cb(e);
      }

      cb(null, {
        live: {
          status: rs.live.status,
          message: rs.live.message,
        },
        staging: {
          status: rs.staging.status,
          message: rs.staging.message,
        }
      });
    });
  }

  onTick() {
    albionAPI.getServerStatus((err, results) => {
      if(current.live.status === null) {
        debug("Updating empty defaults");
        current.live.status = results.live.status;
        current.staging.status = results.staging.status;
      }

      if(results.live.status !== current.live.status) {
        debug("Live Server status changed", results.live);
        for(let guild in outputChannels) {
          let channel = this.getChannel(guild, outputChannels[guild]);
          channel.send(`Server status changed to ${results.live.status}\nMessage: \`${results.live.message}\``);
        }
        current.live.status = results.live.status;
      }
      if(results.staging.status !== current.staging.status) {
        debug("Staging Server status changed", results.staging);
        for(let guild in outputChannels) {
          let channel = this.getChannel(guild, outputChannels[guild]);
          channel.send(`Staging server status changed to ${results.staging.status}\nMessage: \`${results.staging.message}\``);
        }
        current.staging.status = results.staging.status;
      }
    });
  }

}

module.exports = Killboard;
