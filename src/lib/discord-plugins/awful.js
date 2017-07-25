var debug = require('debug')('Albion:Plugin:Awful');
var Plugin = require('./base-plugin');

var async = require('async');
var albionAPI = require('albion-api');

var REDIS_PLUGIN_KEY = 'awful-players'
var AWFUL_PLAYERS = [];
class Awful extends Plugin {

  onInit() {
    redis.get(REDIS_PLUGIN_KEY, (err, val) => {
      if(err) {
        debug(`Error: ${err}`);
        return;
      }

      var data = (val !== null) ? val : JSON.parse(val);

      rawChannels.forEach(ch => {
        var guild = this.bot.client.guilds.find('name', ch.guild);
        if(!guild) {
          debug("Unable to find guild", ch.guild, guild);
          return;
        }

        var channel = guild.channels.find('name', ch.channel);
        if(!channel) {
          debug("Unable to find channel", ch.channel, channel);
          return;
        }

        outputChannels[ch.id] = channel;
      });
    });
  }

  addAwful(message, match) {
    var parts = match[1].split('#');
    var playerName = parts[0].trim();
    var channel = message.mentions.channels.first() || message.channel;

    async.waterfall([
      function search(cb) {
        albionAPI.search(playerName, cb);
      },
      function checkSearch(results, cb) {
        if (!results.players) {
          return message.reply('no results.');
        }

        var player = results.players[0];
        if(!player || player.toLowerCase() !== playerName.toLowerCase() ) {
          return message.reply('Player not found.');
        }

        cb(null, player);
      },
      function savePlayer(player, cb) {
        redis.get(REDIS_PLUGIN_KEY, (err, val) => {
          if(err) {
            debug("Error reading redis", err);
            return;
          }

          var data = (val === null) ? JSON.parse(val) : [];

          // Remove old key if it exists
          data = data.filter((item) => {
            return item.id !== player.Id;
          });

          data.push({
              id: player.Id,
              guild: message.guild.name,
              channel: channel.name,
          });
          redis.set(REDIS_CHANNEL_KEY, JSON.stringify(data), cb);
        });
      }
    ], (err) => {
      if(err) {
        debug('Error handling the request', err);
      }
    });
  }

  removeAwful(message, match) {
    var parts = match[1].split('#');
    var playerName = parts[0].trim();
    var channel = message.mentions.channels.first() || message.channel;

    async.waterfall([
      function search(cb) {
        albionAPI.search(playerName, cb);
      },
      function checkSearch(results, cb) {
        if (!results.players) {
          return message.reply('no results.');
        }

        var player = results.players[0];
        if(!player || player.toLowerCase() !== playerName.toLowerCase() ) {
          return message.reply('Player not found.');
        }

        cb(null, player);
      },
      function removePlayer(player, cb) {
        redis.get(REDIS_PLUGIN_KEY, (err, val) => {
          if(err) {
            debug("Error reading redis", err);
            return;
          }

          var data = (val === null) ? JSON.parse(val) : [];

          // Remove old key if it exists
          data = data.filter((item) => {
            return item.id !== player.Id;
          });

          redis.set(REDIS_CHANNEL_KEY, JSON.stringify(data), cb);
        });
      }
    ], (err) => {
      if(err) {
        debug('Error handling the request', err);
      }
    });
  }

  onMessage(message) {
    if (!message) {
      return;
    }

    var msg = message.cleanContent;
    var match = msg.match(/^\!albion awful (.*)$/i);
    if(match) {
      this.addAwful(message, match);
      return;
    }
    match1 = msg.match(/^\!albion notawful (.*)$/i);
    if(match1) {
      this.removeAwful(message, match1);
      return;
    }
  }
}

module.exports = PlayerInfo;
