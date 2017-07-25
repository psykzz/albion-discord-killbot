var config = require('../../config');

class Plugin {
  constructor(bot) {
    this.bot = bot;

    if (this.onTick) {
      this.timer = setInterval(() => {
        this.onTick();
      }, config.TICK_DELAY);
    }
  }

  getChannel(guildName, channelName) {
    var guild = this.bot.client.guilds.find('name', guildName);
    if(!guild) {
      debug("Unable to find guild", guildName);
      return;
    }

    var channel = guild.channels.find('name', channelName);
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
