var debug = require('debug')('AlbionMarketAPI');
var async = require('async');
var request = require('request');

var BASE_URL = process.env.ALBION_MARKET_API_BASE || 'https://albion-market.com/api';

/**
 * baseRequest - description
 *
 * @param  {type} uri description
 * @param  {callback} cb  description
 * @private
 */
function baseRequest(uri, cb) {
  var url = `${BASE_URL}${uri}`;
  request(url, function (error, response, body) {
    debug(`Url: ${url} statusCode: ${response && response.statusCode}`);
    if(error || (response && response.statusCode === 404)) {
       return cb(error || response);
    }
    cb(null, JSON.parse(body));
  });
}

// -- Searching
//

/**
 * getItemOrders - description
 *
 * @param  {string} query description
 * @param  {callback} cb    description
 */
function getItemOrders(itemName, cb) {
  debug(`getItemOrders for: ${itemName}`);
  baseRequest(`/v1/orders/${itemName}/`, cb);
}


module.exports = {
  getItemOrders
};
