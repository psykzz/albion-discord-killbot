var debug = require('debug')('Albion:Plugin:GuildInfo');
var Plugin = require('./base-plugin');

var async = require('async');
var albionAPI = require('albion-api');

class GuildInfo extends Plugin {

  handleGuildSearch(message) {
    var match = message.cleanContent.match(/^\!albion guild (.*)$/i);
    if(!match) {
      return;
    }
    
    message.channel.startTyping();

    async.waterfall([
      (cb) => {
        albionAPI.search(match[1], cb);
      },
      (results, cb) => {
        if (!results.guilds) {
          return message.reply('no results.');
        }

        var guild = results.guilds[0];
        if(!guild) {
          return message.reply('no results.');
        }

        cb(null, guild);
      },
      (guild, cb) => {
        albionAPI.getGuildInfo(guild.Id, cb);
      },
      (guildInfo, cb) => {
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
      (guildInfo, guildMembers, cb) => {
        // message.reply(`https://albiononline.com/en/killboard/guild/${guildInfo.Id}\n\`\`\`text\nGuild: ${guildInfo.Name} - [${guildInfo.AllianceTag}] ${guildInfo.AllianceName}\nFounder: ${guildInfo.FounderName}\nFounded on: ${guildInfo.Founded}\n\n** Fame **\nKill: ${guildInfo.killFame}\nDeath: ${guildInfo.DeathFame}\nRatio: ${guildInfo.killFame / guildInfo.DeathFame}\n\nMembers: ${guildMembers}\`\`\``);

        message.channel.send({embed: {
            color: 3447003,
            fields: [
              {
                name: "Guild",
                value: `${guildInfo.Name}`,
                inline: true
              },
              {
                name: "Alliance",
                value: `[${guildInfo.AllianceTag}] ${guildInfo.AllianceName}`,
                inline: true
              },
              {
                name: "Founder",
                value: `${guildInfo.FounderName}`,
                inline: true
              },
              {
                name: "Founded",
                value: `${guildInfo.Founded.slice(0, 10)}`,
                inline: true
              },
              {
                name: "Fame",
                value: `Kill: ${guildInfo.killFame}\nDeath: ${guildInfo.DeathFame}\nRatio: ${(guildInfo.killFame / guildInfo.DeathFame).toFixed(2)}`,
                inline: true
              },
              {
                name: "Members",
                value: `${guildMembers}`,
                inline: true
              },
              {
                name: "Links",
                value: `[Killboard](https://albiononline.com/en/killboard/guild/${guildInfo.Id})`,
                inline: true,
              }
            ],
            timestamp: new Date(),
            footer: {
              icon_url: this.bot.client.user.avatarURL,
              text: `GuildId: ${guildInfo.Id} | PsyKzz#4695`
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

    this.handleGuildSearch(message);
  }
}

module.exports = GuildInfo;
