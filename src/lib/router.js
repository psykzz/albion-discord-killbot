var express = require('express');
var router = express.Router();

var config = require('../config');

// define the home page route
router.get('/', function (req, res) {
  res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${config.DISCORD_CLIENT_ID}&scope=bot&permissions=0`);
});

module.exports = router;
