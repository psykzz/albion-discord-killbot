var debug = require('debug')('Albion:Plugin:Awful');
var Plugin = require('./base-plugin');

var async = require('async');
var redis = require('../redis');
var albionAPI = require('albion-api');

var REDIS_PLUGIN_KEY = 'awful-players';
var AWFUL_PLAYERS = {};
var announcedDeath = [];
class Awful extends Plugin {

  onInit() {
    redis.get(REDIS_PLUGIN_KEY, (err, val) => {
      if(err || val === null) {
        debug(`Error getting values from redis: ${err} val: ${val}`);
        return;
      }

      debug("Setting channels from redis", val);
      AWFUL_PLAYERS = JSON.parse(val);
    });
  }

  addAwful(message, match) {
    var parts = match[1].split('#');
    var playerName = parts[0].trim();
    var channel = message.mentions.channels.first() || message.channel;

    // Default the data
    async.waterfall([
      function search(cb) {
        albionAPI.search(playerName, cb);
      },
      function checkSearch(results, cb) {
        if (!results.players) {
          return message.reply('no results.');
        }

        var player = results.players[0];
        if(!player) {
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

          var data = (val) ? JSON.parse(val) : {};
          data[message.guild.name] = (data[message.guild.name]) ? data[message.guild.name] : {};
          data[message.guild.name][player.Name] = message.channel.name;
          AWFUL_PLAYERS = data;

          redis.set(REDIS_PLUGIN_KEY, JSON.stringify(data), cb);
        });
      }
    ], (err) => {
      if(err) {
        debug('Error handling the request', err);
      }
      this.reply(message, `adding awful player ${playerName}`);
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
        if(!player) {
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

          var data = (val) ? JSON.parse(val) : {};
          data[message.guild.name] = (data[message.guild.name]) ? data[message.guild.name] : {};
          delete data[message.guild.name][player.Name];
          AWFUL_PLAYERS = data;

          redis.set(REDIS_PLUGIN_KEY, JSON.stringify(data), cb);
        });
      }
    ], (err) => {
      if(err) {
        debug('Error handling the request', err);
      }
      this.reply(message, `removing awful player ${playerName}`);
    });
  }

  onMessage(message) {
    if (!message) {
      return;
    }


    var msg = message.cleanContent;
    var match = msg.match(/^\!albion awful (.*)$/i);
    if(match) {
      if(!this.hasAdmin(message)) {
        debug(`addAwful: Blocked admin request from ${message.author.username}#${message.author.discriminator}`);
        return;
      }

      this.addAwful(message, match);
      return;
    }
    var match1 = msg.match(/^\!albion notawful (.*)$/i);
    if(match1) {
      if(!this.hasAdmin(message)) {
        debug(`removeAwful: Blocked admin request from ${message.author.username}#${message.author.discriminator}`);
        return;
      }
      this.removeAwful(message, match1);
      return;
    }
  }

  onTick() {
    albionAPI.getRecentEvents({}, (err, results) => {
      results.forEach(res => {
        for(var discordGuild in AWFUL_PLAYERS) {
          var awfulPlayers = AWFUL_PLAYERS[discordGuild];

          if(!(res.Victim.Name in awfulPlayers)) {
            return;
          }

          // Do we know about this death?
          if(announcedDeath.indexOf(res.EventId) !== -1) {
            return;
          }

          var killRatio = (res.Victim.AverageItemPower / res.Killer.AverageItemPower).toFixed(2); // higher better
          announcedDeath.push(res.EventId);
          let others = (res.Participants.length > 1) ? `+${res.Participants.length}` : `${res.Participants[0].Name}`;
          let guilds = [...new Set(res.Participants.map(item => item.GuildName))];
          guilds = (guilds.Length > 1) ? `${guilds.join(', ')}` : `${guilds[0]}`;

          var channel = this.getChannel(discordGuild, awfulPlayers[res.Victim.Name]);
          channel.send(`**${res.Victim.Name}** died to ${others} from ${guilds}\nhttps://albiononline.com/en/killboard/kill/${res.EventId}`);
        }
      });
    });
  }
}

module.exports = Awful;
