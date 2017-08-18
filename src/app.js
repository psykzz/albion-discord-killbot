var debug = require('debug')('Albion:App');

if(process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

var web = require('express')();
var router = require('./lib/router');
var Bot = require('./lib/discord');

var config = require('./config');
require('heroku-self-ping')(config.APP_URL);

var bot = new Bot(config.DISCORD_TOKEN);

web.use('/', router);
bot.use([
  require('./lib/discord-plugins/awful'),
  require('./lib/discord-plugins/killboard'),
  require('./lib/discord-plugins/guild-info'),
  require('./lib/discord-plugins/crafting'),
  require('./lib/discord-plugins/market'),
  // require('./lib/discord-plugins/server-status'), // broken due to weird string from status (new lines in string)
  require('./lib/discord-plugins/player-info'),
  require('./lib/discord-plugins/debug-info'),
]);

web.listen(config.PORT, function() {
  debug(`Listening on port ${config.PORT}`);
});
bot.login(() => {});
