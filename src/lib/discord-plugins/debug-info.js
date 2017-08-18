var debug = require('debug')('Albion:Plugin:DebugInfo');
var Plugin = require('./base-plugin');

var async = require('async');
var albionAPI = require('albion-api');

class DebugInfo extends Plugin {

  handleDebug(message) {
    var match = message.cleanContent.match(/^\!debug$/i);
    if(!match) {
      return;
    }
    if(!this.hasAdmin(message)) {
      return;
    }
    message.channel.send({embed: {
        color: 3447003,
        fields: [
          {
            name: "Guild ID",
            value: `${message.guild.id}`,
            inline: true
          },
          {
            name: "Channel ID",
            value: `${message.channel.id}`,
            inline: true
          }
        ],
        timestamp: new Date(),
        footer: {
          icon_url: this.bot.client.user.avatarURL,
          text: `Debug Information | PsyKzz#4695`
        }
      }
    });
  }

  onMessage(message) {
    if (!message) {
      return;
    }

    this.handleDebug(message);
  }
}

module.exports = DebugInfo;
