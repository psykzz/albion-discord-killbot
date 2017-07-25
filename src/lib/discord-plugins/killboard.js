var debug = require('debug')('Albion:Plugin:Killboard');
var Plugin = require('./base-plugin');

var albionAPI = require('albion-api');

var redis = require('../redis');

// Globals
var REDIS_PLUGIN_KEY = 'killboard-channels'

var outputChannels = {};
var announcedKills = [];
class Killboard extends Plugin {

  onInit() {
    redis.get(REDIS_PLUGIN_KEY, (err, val) => {
      if(err || val === null) {
        debug(`Error: ${err} val: ${val}`);
        return;
      }

      var rawChannels = JSON.parse(val);
      rawChannels.forEach(ch => {
        var channel = this.getChannel(ch.guild, ch.channel);
        outputChannels[ch.id] = channel;
      });
    });
  }

  handleKillAlert(message) {

      var match = message.cleanContent.match(/^\!albion killalert (.*)$/i);
      if(match) {
        var parts = match[1].split('#');
        var guildName = parts[0].trim();
        var channel = message.mentions.channels.first() || message.channel; // default to current channel
        // console.log("match found", match, guildName, channel.name, this.reply)

        this.getGuildId(guildName, (err, guildId) => {
          if(err) {
            debug("Error finding guild", guildName, err);
            return;
          }

          var previously = '';
          if(outputChannels[guildId]) {
            previously = ` previously registered in #${outputChannels[guildId].name}`;
          }

          outputChannels[guildId] = channel;
          this.reply(message, `kill alerts for ${guildName} are now setup in #${channel.name}${previously}`);

          // Save these for when we need to restart later.
          redis.get(REDIS_PLUGIN_KEY, (err, val) => {
            if(err) {
              debug("Error saving channel configs for killalert");
              return;
            }

            var data = (val === null) ? JSON.parse(val) : [];

            // Remove old key if it exists
            data = data.filter((item) => {
              return item.id !== guildId;
            });

            data.push({
              id: guildId,
              guild: message.guild.name,
              channel: channel.name
            });

            redis.set(REDIS_CHANNEL_KEY, JSON.stringify(data));
          });
        });
      }
  }

  handleClearAlert(message) {

      var match = message.cleanContent.match(/^\!albion clearalert (.*)$/i);
      if(match) {
        var parts = match[1].split('#');
        var guildName = parts[0].trim();
        var channel = message.mentions.channels.first() || message.channel; // default to current channel

        this.getGuildId(guildName, (err, guildId) => {
          if(err) {
            debug("Error finding guild", guildName, err);
            return;
          }
          if(!outputChannels[guildId]) {
            this.reply(message, `kill alerts for ${guildName} are not setup, nothing to remove.`);
          }

          delete outputChannels[guildId];
          this.reply(message, `kill alerts for ${guildName} are now removed.`);

          // Save these for when we need to restart later.
          redis.get(REDIS_CHANNEL_KEY, (err, val) => {
            if(err) {
              debug("Error saving channel configs for killalert");
              return;
            }

            var data = (val === null) ? JSON.parse(val) : [];

            // Remove old key if it exists
            data = data.filter((item) => {
              return item.id !== guildId;
            });

            redis.set(REDIS_CHANNEL_KEY, JSON.stringify(data));
          });
        });
      }
  }

  onMessage(message) {
    // Requires you to be in a discord, not supporting individuals.
    if(!message.guild || !message.channel) {
      return;
    }
    this.handleClearAlert(message);
    this.handleKillAlert(message);
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
        var killer = res.Killer.Name;
        var victim = res.Victim.Name;
        var otherHelpers = (res.groupMemberCount > 0) ? ` +${res.groupMemberCount}` : '';
        if(res.Killer.GuildId === guild.GuildId) {
          killer = (res.Killer.GuildId === guild.GuildId) ? `**${res.Killer.Name}** (${guild.GuildName})` : `${res.Killer.Name}`;
        }
        if(res.Killer.GuildId === guild.GuildId) {
          victim = (res.Victim.GuildId === guild.GuildId) ? `**${res.Victim.Name}** (${guild.GuildName})` : `${res.Victim.Name}`;
        }

        var killRatio = (res.Victim.AverageItemPower / res.Killer.AverageItemPower).toFixed(2); // higher better
        announcedKills.push(res.EventId);

        var channel = outputChannels[guild.GuildId];
        channel.send(`Killmail: ${killer}${otherHelpers} killed ${victim} - (${killRatio} gear disparity) https://albiononline.com/en/killboard/kill/${res.EventId}`);
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
