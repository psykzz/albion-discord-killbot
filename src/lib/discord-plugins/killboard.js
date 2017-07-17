var debug = require('debug')('Albion:Plugin:Killboard');
var Plugin = require('./base-plugin');

var albionAPI = require('albion-api');

// Globals
var outputChannels = {};
var announcedKills = [];
class Killboard extends Plugin {

  onMessage(message) {
    var match = message.cleanContent.match(/^\!albion killalert (.*)$/i);
    if(match) {
      this.getGuildId(match[1], (err, guildId) => {
        outputChannels[guildId] = message.channel;
      });
    }
  }

  onTick() {
    albionAPI.getRecentEvents({}, (err, results) => {
      results.forEach(res => {

        var guild;
        // Was our guild involved
        var guildFound = res.Participants.some(p => {
          guild = p;
          return (p.GuildId in outputChannels);
        });

        // Skipif we didn't find a guild we care about
        if(guildFound === false) {
          guild = null;
          return;
        }

        // Do we know about this kill?
        if(announcedKills.indexOf(res.EventId) !== -1) {
          return;
        }

        // Formatting
        var killer = '';
        var victim = '';
        var otherHelpers = (res.groupMemberCount > 0) ? ` +${res.groupMemberCount}` : '';
        if(res.Killer.GuildId === guild.GuildId) {
          killer = (res.Killer.GuildId === guild.GuildId) ? `**${res.Killer.Name}** (${guild.GuildName})` : `${res.Killer.Name}`;
        }
        if(res.Killer.GuildId === guild.GuildId) {
          victim = (res.Victim.GuildId === guild.GuildId) ? `**${res.Victim.Name}** (${guild.GuildName})` : `${res.Victim.Name}`;
        }

        var killRatio = (res.Victim.AverageItemPower / res.Killer.AverageItemPower).toFixed(2); // higher better
        announcedKills.push(res.EventId);
        outputChannels[guild.GuildId].send(`Killmail: ${killer}${otherHelpers} killed ${victim} - (${killRatio} gear disparity) https://albiononline.com/en/killboard/kill/${res.EventId}`);
      });
    });
  }

  getGuildId(guildName, cb) {
    albionAPI.search(guildName, (err, results) => {
      results.guilds.map(r => {
        if(r.Name.toLowerCase() == guildName.toLowerCase()) {
          cb(null, r.Id);
        }
      });
    });
  }
}

module.exports = Killboard;
