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
