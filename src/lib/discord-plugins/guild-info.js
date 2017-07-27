var debug = require('debug')('Albion:Plugin:GuildInfo');
var Plugin = require('./base-plugin');

var async = require('async');
var albionAPI = require('albion-api');

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
        function getMembers(guildInfo, cb) {
          albionAPI.getGuildMembers(guildInfo.Id, (err, guildMembers) => {
            if(err) {
              return cb(err);
            }

            // parse them here to keep it clean
            var members = "";
            var guildNames = guildMembers.map(member => member.Name);
            if(guildNames.length < 10) {
              guildNames = guildNames.join(', ');
            } else {
              guildNames = guildNames.length;
            }

            cb(null, guildInfo, guildNames);
          });
        },
        function replyMessage(guildInfo, guildMembers, cb) {
          message.reply(`https://albiononline.com/en/killboard/guild/${guildInfo.Id}\n\`\`\`text\nGuild: ${guildInfo.Name} - [${guildInfo.AllianceTag}] ${guildInfo.AllianceName}\nFounder: ${guildInfo.FounderName}\nFounded on: ${guildInfo.Founded}\n\n** Fame **\nKill: ${guildInfo.killFame}\nDeath: ${guildInfo.DeathFame}\nRatio: ${guildInfo.killFame / guildInfo.DeathFame}\n\nMembers: ${guildMembers}\`\`\``);
          cb();
        }
      ], (err) => {
        if(err) {
          debug('Error handling the request', err);
        }
      });
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
