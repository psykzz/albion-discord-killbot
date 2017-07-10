var debug = require('debug')('Albion:Bot:AlbionAPI')
var request = require('request');

function search(query, cb) {
  debug(`Searching for: ${query}`);
  request(`https://gameinfo.albiononline.com/api/gameinfo/search?q=${query}`, function (error, response, body) {
    debug(`statusCode: ${response && response.statusCode}`);
    cb(error, JSON.parse(body));
  });
}

function getGuildInfo(guildId, cb) {
  // https://gameinfo.albiononline.com/api/gameinfo/guilds/vFUVDtWgQwK-4NNwf0xo_w
  debug(`Searching for: ${guildId}`);
  request(`https://gameinfo.albiononline.com/api/gameinfo/guilds/${guildId}`, function (error, response, body) {
    debug(`statusCode: ${response && response.statusCode}`);
    cb(error, JSON.parse(body));
  });
}

function getPlayerInfo(playerId, cb) {
  // https://gameinfo.albiononline.com/api/gameinfo/players/Nubya8P6QWGhI6hDLQHIQQ
  debug(`Searching for: ${playerId}`);
  request(`https://gameinfo.albiononline.com/api/gameinfo/players/${playerId}`, function (error, response, body) {
    debug(`statusCode: ${response && response.statusCode}`);
    cb(error, JSON.parse(body));
  });
}

module.exports = {
  search, getGuildInfo, getPlayerInfo
}
