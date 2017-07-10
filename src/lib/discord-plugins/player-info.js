var debug = require('debug')('Albion:Plugin:PlayerInfo');
var Plugin = require('./base-plugin');

var async = require('async');
var albionAPI = require('../albion-api');

class PlayerInfo extends Plugin {

  handleGuildSearch(message) {
    var match = message.cleanContent.match(/^\!albion player (.*)$/i);
    if(match) {

      async.waterfall([
        function search(cb) {
          albionAPI.search(match[1], cb);
        },
        function checkSearch(results, cb) {
          if (!results.players) {
            return message.reply('no results.');
          }

          var player = results.players[0];
          if(!player) {
            return message.reply('no results.');
          }

          cb(null, player);
        },
        function getMoreInfo(player, cb) {
          albionAPI.getPlayerInfo(player.Id, cb);
        },
        function replyMessage(playerInfo, cb) {
          message.reply(`\n\`\`\`text\nPlayer: ${playerInfo.Name}\nGuild: ${playerInfo.GuildName} - [${playerInfo.AllianceTag}] ${playerInfo.AllianceName}\nAvg Item Power: ${playerInfo.AverageItemPower}\n\n** Fame **\nKills: ${playerInfo.killFame}\nDeaths: ${playerInfo.DeathFame}\nRatio: ${playerInfo.killFame / playerInfo.DeathFame}\`\`\``)
          cb();
        }
      ], (err) => {
        if(err) {
          debug('Error handling the request', err);
        }
      })
    }
  }

  onMessage(message) {
    if (!message) {
      return;
    }

    this.handleGuildSearch(message);
  }
}

module.exports = PlayerInfo;
