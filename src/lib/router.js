var express = require('express');
var router = express.Router();

var bot = require('../app').bot;

var config = require('../config');

// define the home page route
router.get('/', function (req, res) {
  res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${config.DISCORD_CLIENT_ID}&scope=bot&permissions=0`);
});

router.get('/guilds', function (req, res) {
  if(!bot) {
    return res.json({error: "bot not defined"});
  }
  
  res.json({
    guilds: bot.guilds.map(item => {
      return {
        name: item.name,
        id: item.id
      }
    })
  })
})

module.exports = router;
