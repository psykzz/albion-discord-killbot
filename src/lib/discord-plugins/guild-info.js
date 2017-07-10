var debug = require('debug')('Albion:Plugin:GuildInfo');
var Plugin = require('./base-plugin');

var async = require('async');
var albionAPI = require('../albion-api');

class GuildInfo extends Plugin {

  handleGuildSearch(message) {
    var match = message.cleanContent.match(/^\!albion guild (.*)$/i);
    if(match) {

      async.waterfall([
        function search(cb) {
          albionAPI.search(match[1], cb);
        },
        function checkSearch(results, cb) {
          if (!results.guilds) {
            return message.reply('no results.');
          }

          var guild = results.guilds[0];
          if(!guild) {
            return message.reply('no results.');
          }

          cb(null, guild);
        },
        function getMoreInfo(guild, cb) {
          albionAPI.getGuildInfo(guild.Id, cb);
        },
        function replyMessage(guildInfo, cb) {
          message.reply(`\n\`\`\`text\nGuild: ${guildInfo.Name} - [${guildInfo.AllianceTag}] ${guildInfo.AllianceName}\nFounder: ${guildInfo.FounderName}\nFounded on: ${guildInfo.Founded}\n\n** Fame **\nKills: ${guildInfo.killFame}\nDeaths: ${guildInfo.DeathFame}\nRatio: ${guildInfo.killFame / guildInfo.DeathFame}\`\`\``)
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

module.exports = GuildInfo;
