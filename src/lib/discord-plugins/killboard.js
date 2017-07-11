var debug = require('debug')('Albion:Plugin:Killboard');
var Plugin = require('./base-plugin');

class Killboard extends Plugin {
  onMessage(message) {
  }

  onTick() {
    debug("tick");
  }
}

module.exports = Killboard;
