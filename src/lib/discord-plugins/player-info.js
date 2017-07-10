var debug = require('debug')('Albion:Plugin:PlayerInfo');
var Plugin = require('./base-plugin');
var request = require('request');


class PlayerInfo extends Plugin {

  search(query, cb) {
    debug(`Searching for: ${query}`);
    request(`https://gameinfo.albiononline.com/api/gameinfo/search?q=${query}`, function (error, response, body) {
      debug(`statusCode: ${response && response.statusCode}`);
      cb(error, JSON.parse(body));
    });
  }

  handlePlayerSearch(message) {
    var match = message.cleanContent.match(/^\!albion player (.*)$/i);
    if(match) {
      this.search(match[1], (err, results) => {
        debug(err, results, results.players);
        if (!results.players) {
          return;
        }
        var player = results.players[0];
        if(!player) {
          message.reply('no results.');
          return;
        }
        var guild = '';
        if(player.GuildName) {
          guild = ` of ${player.GuildName}`;
        }

        message.reply(`Found Player: ${player.Name}${guild}.`);

      });
      debug(match);
    }
  }

  onMessage(message) {
    if (!message) {
      return;
    }
    this.handlePlayerSearch(message);
  }
}

module.exports = GuildInfo;
