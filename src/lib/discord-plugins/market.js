var debug = require('debug')('Albion:Plugin:Market');
var Plugin = require('./base-plugin');

var async = require('async');
var albionMarketAPI = require('../albionMarketAPI');

class Market extends Plugin {

  handlePlayerSearch(message) {
    var match = message.cleanContent.match(/^\!cost (.*)$/i);
    if(!match) {
      return;
    }

    async.waterfall([
      (cb) => {
        albionMarketAPI.getItemOrders(match[1].toUpperCase(), cb);
      },
      (result, cb) => {
        if(result.message) {
          message.reply('item not found.');
          return cb(result.message);
        }
        cb(null, result);
      },
      (itemDetails, cb) => {
        // message.reply(`https://albiononline.com/en/killboard/player/${playerInfo.Id}\n\`\`\`text\nPlayer: ${playerInfo.Name}\nGuild: ${playerInfo.GuildName} - [${playerInfo.AllianceTag}] ${playerInfo.AllianceName}\nAvg Item Power: ${playerInfo.AverageItemPower}\n\n** Fame **\nKill: ${playerInfo.KillFame}\nDeath: ${playerInfo.DeathFame}\nRatio: ${playerInfo.FameRatio}\`\`\``);
        message.channel.send({embed: {
            color: 3447003,
            fields: [
              {
                name: "Item ID",
                value: `${itemDetails.item.id}`,
                inline: true
              },
              {
                name: "Name",
                value: `${itemDetails.item.name}`,
                inline: true
              },
              {
                name: "Orders",
                value: `Buying: ${itemDetails.stats.buy.order_count}\nSelling: ${itemDetails.stats.sell.order_count}`,
                inline: true
              },
              {
                name: "Volume",
                value: `Buying: ${itemDetails.stats.buy.total_volume}\nSelling: ${itemDetails.stats.sell.total_volume}`,
                inline: true
              },
              {
                name: "Buying",
                value: `Avg: ${itemDetails.stats.buy.price_average}\nMax: ${itemDetails.stats.buy.price_maximum}\nMin: ${itemDetails.stats.buy.price_minimum}`,
                inline: true
              },
              {
                name: "Selling",
                value: `Avg: ${itemDetails.stats.sell.price_average}\nMax: ${itemDetails.stats.sell.price_maximum}\nMin: ${itemDetails.stats.sell.price_minimum}`,
                inline: true
              },
              {
                name: "Links",
                value: `[Albion Market](https://albion-market.com/#/orders/${itemDetails.item.id}/)`,
                inline: true,
              }
            ],
            timestamp: new Date(),
            footer: {
              icon_url: this.bot.client.user.avatarURL,
              text: `MarketAPI: https://albion-market.com | PsyKzz#4695`
            }
          }
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

    this.handlePlayerSearch(message);
  }
}

module.exports = Market;
