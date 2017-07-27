var debug = require('debug')('Albion:Plugin:BasePlugin');
var config = require('../../config');

var ADMIN_IDS = [
  "113752662788276232" // PsyKzz
];

class Plugin {
  constructor(bot) {
    this.bot = bot;

    if(this.onTick) {
      this.timer = setInterval(() => {
        this.onTick();
      }, config.TICK_DELAY);
    }
  }

  hasAdmin(message) {
    if (ADMIN_IDS.indexOf(message.author.id) > -1) {
      return true;
    }
    if(message.member && !message.member.roles.exists('name', 'Apostles')) {
      this.reply(message, "not enough roles.");
      return false;
    }
    return true;
  }

  getChannel(guildName, channelName) {
    var guild = this.bot.client.guilds.find('name', guildName);
    debug("getChannel: Guild", guildName, guild.name);
    if(!guild) {
      debug("Unable to find guild", guildName);
      return;
    }

    var channel = guild.channels.find('name', channelName);
    debug("getChannel: Channel", channelName, channel.name);
    if(!channel) {
      debug("Unable to find channel", channelName);
      return;
    }

    return channel;
  }

  reply(message, content, delay) {
    delay = delay || 5000;
    message.reply(content)
    .then(msg => {
      msg.delete(delay);
      message.delete(delay);
    });
  }
}
module.exports = Plugin;
