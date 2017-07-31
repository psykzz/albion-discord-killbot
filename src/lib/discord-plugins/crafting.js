var debug = require('debug')('Albion:Plugin:PlayerInfo');
var Plugin = require('./base-plugin');

var async = require('async');
var redis = require('../redis');
var albionAPI = require('albion-api');
var REDIS_PLUGIN_KEY = 'albion-crafters';

class PlayerInfo extends Plugin {

  removeCrafter(message, match) {
    message.channel.startTyping();
    var player = message.mentions.users.first();
    if(!player) {
      return;
    }

    var guildId = message.guild.id;

    async.waterfall([
      (cb) => {
        redis.get(REDIS_PLUGIN_KEY, cb);
      },
      (results, cb) => {
        cb(null, JSON.parse(results));
      },
      (data, cb) => {
        var _data = data[guildId] || {};
        Object.keys(_data).forEach(tier => {
          Object.keys(_data[tier]).forEach(item => {
            var idx = data[guildId][tier][item].indexOf(player.id);
            if(idx !== -1) {
              data[guildId][tier][item].splice(idx, 1);
            }
          });
        });
        cb(null, data);
      },
      (data, cb) => {
        redis.set(REDIS_PLUGIN_KEY, JSON.stringify(data), cb);
      },
      (data, cb) => {
        message.reply(`removed <@${player.id}> as a crafter.`);
      }
    ], (err) => {
      message.channel.stopTyping();
      if(err) {
        debug('Error handling the request', err);
      }
    });

  }
  addCrafter(message, match) {
    message.channel.startTyping();

    var item = match[1];
    var tier = match[2];

    var player = message.mentions.users.first();
    if(!player) {
      return;
    }

    var guildId = message.guild.id;

    async.waterfall([
      (cb) => {
        redis.get(REDIS_PLUGIN_KEY, cb);
      },
      (results, cb) => {
        cb(null, JSON.parse(results));
      },
      (results, cb) => {
        var data = results[guildId] || {};
        for (var i = 1; i <= tier; i++) { // Add all tiers from 1 -> tier
          data[i] = data[i] || {};
          data[i][item] = data[i][item] || [];
          if(data[i][item].indexOf(player.id) === -1) {
            data[i][item].push(player.id);
          }
        }
        results[guildId] = data;
        cb(null, results);
      },
      (data, cb) => {
        redis.set(REDIS_PLUGIN_KEY, JSON.stringify(data), cb);
      },
      (data, cb) => {
        message.reply(`added <@${player.id}> as a crafter of tier ${tier} ${item}.`);
      }
    ], (err) => {
      message.channel.stopTyping();
      if(err) {
        debug('Error handling the request', err);
      }
    });
  }

  handleSearch(message, match) {
    message.channel.startTyping();

    var item = match[1];
    var tier = match[2];

    var guildId = message.guild.id;

    async.waterfall([
      (cb) => {
        redis.get(REDIS_PLUGIN_KEY, cb);
      },
      (results, cb) => {
        cb(null, JSON.parse(results));
      },
      (results, cb) => {
        results = results[guildId] || {};
        var tierCrafters = results[tier];
        if(!tierCrafters) {
          message.reply(`no one is able to craft **T${tier}** yet.`);
          return message.channel.stopTyping();
        }

        var crafters = tierCrafters[item];
        if(!crafters || crafters.length === 0) {
          message.reply(`no one is able to craft **${item}** yet.`);
          return message.channel.stopTyping();
        }
        cb(null, crafters);
      },
      (crafters, cb) => {
        message.channel.send({embed: {
            color: 3447003,
            fields: [
              {
                name: "Item",
                value: `${item}`,
                inline: true
              },
              {
                name: "Tier",
                value: `${tier}`,
                inline: true
              },
              {
                name: "Crafters",
                value: `<@${crafters.join('>, <@')}>`,
                inline: false
              }
            ],
            timestamp: new Date(),
            footer: {
              icon_url: this.bot.client.user.avatarURL,
              text: `PsyKzz#4695`
            }
          }
        });

        cb();
      }
    ], (err) => {
      message.channel.stopTyping();
      if(err) {
        debug('Error handling the request', err);
      }
    });
  }

  onMessage(message) {
    if (!message) {
      return;
    }

    var match = message.cleanContent.match(/^\!crafting (.+) (?:t|tier)(\d)$/i);
    if(match) {
      return this.handleSearch(message, match);
    }
    match = message.cleanContent.match(/^\!crafting (.+) (?:t|tier)(\d) /i);
    if(match) {
      return this.addCrafter(message, match);
    }
    match = message.cleanContent.match(/^\!crafting remove /i);
    if(match) {
      return this.removeCrafter(message, match);
    }
  }
}

module.exports = PlayerInfo;
