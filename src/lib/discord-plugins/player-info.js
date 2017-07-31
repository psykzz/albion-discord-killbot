var debug = require('debug')('Albion:Plugin:PlayerInfo');
var Plugin = require('./base-plugin');

var async = require('async');
var albionAPI = require('albion-api');

class PlayerInfo extends Plugin {

  handlePlayerSearch(message) {
    var match = message.cleanContent.match(/^\!albion player (.*)$/i);
    if(!match) {
      return;
    }

    message.channel.startTyping();

    async.waterfall([
      (cb) => {
        albionAPI.search(match[1], cb);
      },
      (results, cb) => {
        if (!results.players) {
          message.channel.stopTyping();
          return message.reply('no results.');
        }

        var player = results.players[0];
        if(!player) {
          message.channel.stopTyping();
          return message.reply('no results.');
        }

        cb(null, player);
      },
      (player, cb) => {
        albionAPI.getPlayerInfo(player.Id, cb);
      },
      (playerInfo, cb) => {
        albionAPI.getPlayerSoloKills(playerInfo.Id, {range: 'week'}, (err, soloKillDetails) => {
          if(err) {
            return cb(err);
          }
          cb(null, playerInfo, soloKillDetails);
        });
      },
      (playerInfo, soloKillDetails, cb) => {
        albionAPI.getPlayerTopKills(playerInfo.Id, {range: 'week'}, (err, topKillDetails) => {
          if(err) {
            return cb(err);
          }
          cb(null, playerInfo, soloKillDetails, topKillDetails);
        });
      },
      (playerInfo, soloKillDetails, topKillDetails, cb) => {
        // message.reply(`https://albiononline.com/en/killboard/player/${playerInfo.Id}\n\`\`\`text\nPlayer: ${playerInfo.Name}\nGuild: ${playerInfo.GuildName} - [${playerInfo.AllianceTag}] ${playerInfo.AllianceName}\nAvg Item Power: ${playerInfo.AverageItemPower}\n\n** Fame **\nKill: ${playerInfo.KillFame}\nDeath: ${playerInfo.DeathFame}\nRatio: ${playerInfo.FameRatio}\`\`\``);
        message.channel.send({embed: {
            color: 3447003,
            fields: [
              {
                name: "Character",
                value: `${playerInfo.Name}`,
                inline: true
              },
              {
                name: "Guild",
                value: `${playerInfo.GuildName}`,
                inline: true
              },
              {
                name: "Alliance",
                value: `[${playerInfo.AllianceTag}] ${playerInfo.AllianceName}`,
                inline: true
              },
              {
                name: "Avg Item Power",
                value: `${playerInfo.AverageItemPower}`,
                inline: true
              },
              {
                name: "Fame",
                value: `Kill: ${playerInfo.KillFame}\nDeath: ${playerInfo.DeathFame}\nRatio: ${playerInfo.FameRatio}`,
                inline: true
              },
              {
                name: "Kills (this week)",
                value: `Solo: ${soloKillDetails.length}\nOverall: ${topKillDetails.length}`,
                inline: true
              },
              {
                name: "Links",
                value: `[Killboard](https://albiononline.com/en/killboard/player/${playerInfo.Id})`,
                inline: true,
              }
            ],
            timestamp: new Date(),
            footer: {
              icon_url: this.bot.client.user.avatarURL,
              text: `PlayerId: ${playerInfo.Id} | PsyKzz#4695`
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

    this.handlePlayerSearch(message);
  }
}

module.exports = PlayerInfo;
