var debug = require('debug')('Albion:Plugin:Killboard');
var Plugin = require('./base-plugin');

var albionAPI = require('albion-api');

var redis = require('../redis');

// Globals
var REDIS_PLUGIN_KEY = 'killboard-channels-v2';

var outputChannels = {};
var announcedKills = {};
class Killboard extends Plugin {

  onInit() {
    redis.get(REDIS_PLUGIN_KEY, (err, val) => {
      if(err || val === null) {
        debug(`Error getting values from redis: ${err} val: ${val}`);
        return;
      }

      debug("Setting channels from redis", val);
      outputChannels = JSON.parse(val);
    });
  }

  handleTest(message) {
    var match = message.cleanContent.match(/^\!albion test killboard$/i);
    if(!match) {
      return;
    }

    if(!this.hasAdmin(message)) {
      debug(`handleKillAlert: Blocked admin request from ${message.author.name}`);
      return;
    }

    albionAPI.getRecentEvents({}, (err, results) => {
      var res = results[0];
      // Formatting
      var killer = res.Killer.Name;
      var victim = res.Victim.Name;
      var otherHelpers = (res.numberOfParticipants > 0) ? ` [+${res.numberOfParticipants}]` : '';
      var killRatio = (res.Victim.AverageItemPower / res.Killer.AverageItemPower).toFixed(2); // higher better

      var victimInventory = [];
      res.Victim.Inventory.forEach(item => {
        if(!item) { return; }
        if(parseInt(item.Type.slice(1, 2), 10) >= 4) {
          victimInventory.push(`${item.Type} x${item.Count}`);
        }
      });
      if(victimInventory.length === 0) {
        victimInventory.push(" -- Empty");
      }

      var channel = message.channel;
      // channel.send(`Killmail: ${killer}${otherHelpers} killed ${victim} - (${killRatio} gear disparity)\nhttps://albiononline.com/en/killboard/kill/${res.EventId}`);
      channel.send({embed: {
          color: 3447003,
          title: "New Kill",
          url: `https://albiononline.com/en/killboard/kill/${res.EventId}`,
          description: `${killer}${otherHelpers} killed ${victim}`,
          fields: [
            {
              name: "Gear disparity",
              value: `${killRatio}`,
              inline: true
            },
            {
              name: "Link",
              value: `[Killboard](https://albiononline.com/en/killboard/kill/${res.EventId})`,
              inline: true,
            },
            {
              name: "Dropped items (T4+)",
              value: victimInventory.join("\n")
            }
          ],
          timestamp: new Date(res.Timestamp),
          footer: {
            icon_url: this.bot.client.user.avatarURL,
            text: `EventID: ${res.EventId} | PsyKzz#4695`
          }
        }
      });
    });
  }

  handleKillAlert(message) {
    var match = message.cleanContent.match(/^\!albion killalert (.*)$/i);
    if(!match) {
      return;
    }

    if(!this.hasAdmin(message)) {
      debug(`handleKillAlert: Blocked admin request from ${message.author.name}`);
      return;
    }

    var parts = match[1].split('#');
    var guildName = parts[0].trim();
    var channel = message.mentions.channels.first() || message.channel; // default to current channel

    this.getGuildId(guildName, (err, guildId) => {
      if(err) {
        debug("Error finding guild", guildName, err);
        return;
      }

      outputChannels[message.guild.name] = (outputChannels[message.guild.name]) ? outputChannels[message.guild.name] : {};
      var channelList = outputChannels[message.guild.name];

      var previously = '';
      if(channelList && channelList[guildId]) {
        previously = ` previously registered in #${channelList[guildId]}`;
      }
      outputChannels[message.guild.name][guildId] = channel.name;
      this.reply(message, `kill alerts for ${guildName} are now setup in #${channel.name}${previously}`);

      // Save these for when we need to restart later.
      redis.get(REDIS_PLUGIN_KEY, (err, val) => {
        if(err) {
          debug("Error saving channel configs for killalert");
          return;
        }

        var data = (val) ? JSON.parse(val) : {};
        data[message.guild.name] = (data[message.guild.name]) ? data[message.guild.name] : {};
        data[message.guild.name][guildId] = channel.name;
        redis.set(REDIS_PLUGIN_KEY, JSON.stringify(data));
      });
    });
  }

  handleClearAlert(message) {
    var match = message.cleanContent.match(/^\!albion clearalert (.*)$/i);
    if(!match) {
      return;
    }

    if(!this.hasAdmin(message)) {
      debug(`handleClearAlert: Blocked admin request from ${message.author.name}`);
      return;
    }

    var parts = match[1].split('#');
    var guildName = parts[0].trim();
    var channel = message.mentions.channels.first() || message.channel; // default to current channel

    this.getGuildId(guildName, (err, guildId) => {
      if(err) {
        debug("Error finding guild", guildName, err);
        return;
      }
      outputChannels[message.guild.name] = (outputChannels[message.guild.name]) ? outputChannels[message.guild.name] : {};

      if(!outputChannels[message.guild.name][guildId]) {
        this.reply(message, `kill alerts for ${guildName} are not setup, nothing to remove.`);
      }

      delete outputChannels[message.guild.name][guildId];
      this.reply(message, `kill alerts for ${guildName} are now removed.`);

      // Save these for when we need to restart later.
      redis.get(REDIS_PLUGIN_KEY, (err, val) => {
        if(err) {
          debug("Error saving channel configs for killalert");
          return;
        }

        var data = (val) ? JSON.parse(val) : {};
        data[message.guild.name] = (data[message.guild.name]) ? data[message.guild.name] : {};
        delete data[message.guild.name][guildId];
        redis.set(REDIS_PLUGIN_KEY, JSON.stringify(data));
      });
    });
  }

  onMessage(message) {
    // Requires you to be in a discord, not supporting individuals.
    if(!message.guild || !message.channel) {
      return;
    }

    this.handleClearAlert(message);
    this.handleKillAlert(message);
    this.handleTest(message);
  }

  onTick() {
    albionAPI.getRecentEvents({}, (err, results) => {
      for(var discordGuild in outputChannels) {
        var channelList = outputChannels[discordGuild];
        if(!channelList) {
          debug(`${discordGuild} has no channelList configured.`);
          continue;
        }
        var guild;

        results.forEach(res => {
          // Was our guild involved
          var guildFound = res.Participants.some(p => {
            guild = p;
            return (p.GuildId in channelList);
          });

          // Skipif we didn't find a guild we care about
          if(guildFound === false) {
            guild = null;
            return;
          }

          // Do we know about this kill?
          announcedKills[discordGuild] = (announcedKills[discordGuild]) ? announcedKills[discordGuild] : [];
          if(announcedKills[discordGuild].indexOf(res.EventId) !== -1) {
            return;
          }

          // Formatting
          var killer = (res.Killer.GuildId === guild.GuildId) ? `**${res.Killer.Name}** (${guild.GuildName})` : res.Killer.Name;
          var victim = (res.Victim.GuildId === guild.GuildId) ? `**${res.Victim.Name}** (${guild.GuildName})` : res.Victim.Name;
          var otherHelpers = (res.numberOfParticipants > 0) ? ` [+${res.numberOfParticipants}]` : '';
          var killRatio = (res.Victim.AverageItemPower / res.Killer.AverageItemPower).toFixed(2); // higher better

          var victimInventory = [];
          res.Victim.Inventory.forEach(item => {
            if(!item) { return; }
            if(parseInt(item.Type.slice(1, 2), 10) >= 5) {
              victimInventory.push(`${item.Type} x${item.Count}`);
            }
          });
          if(victimInventory.length === 0) {
            victimInventory.push(" -- Empty");
          }

          announcedKills[discordGuild].push(res.EventId);

          var channel = this.getChannel(discordGuild, channelList[guild.GuildId]);
          if(!channel) {
            return;
          }
          // channel.send(`Killmail: ${killer}${otherHelpers} killed ${victim} - (${killRatio} gear disparity)\nhttps://albiononline.com/en/killboard/kill/${res.EventId}`);
          channel.send({embed: {
              color: 3447003,
              description: `${killer}${otherHelpers} killed ${victim}`,
              fields: [
                {
                  name: "Gear disparity",
                  value: `${killRatio}`,
                  inline: true
                },
                {
                  name: "Link",
                  value: `[Killboard](https://albiononline.com/en/killboard/kill/${res.EventId})`,
                  inline: true,
                },
                {
                  name: "Dropped items (T5+)",
                  value: victimInventory.join("\n")
                }
              ],
              timestamp: new Date(res.Timestamp),
              footer: {
                icon_url: this.bot.client.user.avatarURL,
                text: `EventID: ${res.EventId} | PsyKzz#4695`
              }
            }
          });
        });
      }
    });
  }

  getGuildId(guildName, cb) {
    albionAPI.search(guildName, (err, results) => {
      results.guilds.some(r => {
        if(r.Name.toLowerCase() == guildName.toLowerCase()) {
          cb(null, r.Id);
          return true;
        }
        return false;
      });
    });
  }
}

module.exports = Killboard;
