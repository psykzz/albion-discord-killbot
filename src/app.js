var debug = require('debug')('Albion:App');

var web = require('express')();
var router = require('./lib/router');
var Bot = require('./lib/discord');

var config = require('./config');
require('heroku-self-ping')(config.APP_URL);

var bot = new Bot(config.DISCORD_TOKEN);

web.use('/', router);
bot.use([
  require('./lib/discord-plugins/killboard'),
  require('./lib/discord-plugins/guild-info'),
  require('./lib/discord-plugins/server-status'),
  require('./lib/discord-plugins/player-info')
]);

bot.login(() => {});
web.listen(config.PORT, function() {
  debug(`Listening on port ${config.PORT}`);
});
