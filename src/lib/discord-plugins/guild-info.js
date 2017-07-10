var debug = require('debug')('Albion:Plugin:GuildInfo');
var Plugin = require('./base-plugin');
var request = require('request');


class GuildInfo extends Plugin {

  search(query, cb) {
    debug(`Searching for: ${query}`);
    request(`https://gameinfo.albiononline.com/api/gameinfo/search?q=${query}`, function (error, response, body) {
      debug(`statusCode: ${response && response.statusCode}`);
      cb(error, JSON.parse(body));
    });
  }

  handleGuildSearch(message) {
    var match = message.cleanContent.match(/^\!albion guild (.*)$/i);
    if(match) {
      this.search(match[1], (err, results) => {
        debug(err, results, results.guilds);
        if (!results.guilds) {
          return;
        }
        var guild = results.guilds[0];
        if(!guild) {
          message.reply('no results.');
          return;
        }
        var alliance = '';
        if(guild.AllianceName) {
          alliance = ` of ${guild.AllianceName}`;
        }

        message.reply(`Found Guild: ${guild.Name}${alliance}.`);

      });
      debug(match);
    }
  }

  onMessage(message) {
    if (!message) {
      return;
    }
    this.handleGuildSearch(message);
  }
}

module.exports = GuildInfo;
