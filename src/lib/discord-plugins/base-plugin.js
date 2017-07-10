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
}
module.exports = Plugin;
