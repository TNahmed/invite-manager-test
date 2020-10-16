console.log("\nLoading...");
console.log("If This Take Too long make sure u have add right token!");
const fs = require("fs");
const yaml = require("js-yaml");
const { mainprefix, token, color } = yaml.load(fs.readFileSync("./config.yml"));
const Discord = require("discord.js");
const client = new Discord.Client();
const db = require("quick.db");
const { join } = require("path");
const { readdirSync } = require("fs");
client.commands = new Discord.Collection();
client.login(token);
 const ms = require("ms");

client.on("ready", () => {
  client.user.setActivity("Testing Stuffs", { type: "PLAYING" });
  console.clear();
  console.log(
    "\x1b[36m%s\x1b[0m",
    `
    ▓█████▄  ▄▄▄       ██▀███   ██ ▄█▀  
  ▒██▀ ██▌▒████▄    ▓██ ▒ ██▒ ██▄█▒   
  ░██   █▌▒██  ▀█▄  ▓██ ░▄█ ▒▓███▄░   
  ░▓█▄   ▌░██▄▄▄▄██ ▒██▀▀█▄  ▓██ █▄   
  ░▒████▓  ▓█   ▓██▒░██▓ ▒██▒▒██▒ █▄  
   ▒▒▓  ▒  ▒▒   ▓▒█░░ ▒▓ ░▒▓░▒ ▒▒ ▓▒   
   ░ ▒  ▒   ▒   ▒▒ ░  ░▒ ░ ▒░░ ░▒ ▒░     
   ░ ░  ░   ░   ▒     ░░   ░ ░ ░░ ░      
     ░          ░  ░   ░     ░  ░       
   ░                                                                                 `
  );
  console.log(
    "\n\x1b[32m%s\x1b[0m",
    `          $[INFO]: Logged on ${client.user.tag}`
  );
  console.log("\x1b[32m%s\x1b[0m", `           $[INFO]: PREFIX ${mainprefix}`);
});

const commandFiles = readdirSync(join(__dirname, "commands")).filter(file =>
  file.endsWith(".js")
);

for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async message => {
  let prefix = await db.get(`guildprefix_${message.guild.id}`);
  if (prefix === null) prefix = mainprefix;
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;

  if (message.content.startsWith(prefix)) {
    const args = message.content
      .slice(prefix.length)
      .trim()
      .split(/ +/);

    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) return;

    try {
      client.commands.get(command).run(client, message, args);
    } catch (error) {
      console.error(error);
    }
  }
});
const guildInvites = new Map();

client.on("inviteCreate", async invite =>
  guildInvites.set(invite.guild.id, await invite.guild.fetchInvites())
);
client.on("ready", () => {
  client.guilds.cache.forEach(guild => {
    guild
      .fetchInvites()
      .then(invites => guildInvites.set(guild.id, invites))
      .catch(err => console.log(err));
  });
});
const { defaultjoinmessage, defaultleavemessage } = yaml.load(
  fs.readFileSync("./config.yml")
);
client.on("guildMemberAdd", async member => {
  let joinchannelmessage = db.get(`joinchannelmessage_${member.guild.id}`);
  if (!joinchannelmessage === null) {
    return console.log(`None`);
  }
  let joinmessage = db.get(`joinchannelmessage_${member.guild.id}`);
  if (joinmessage === null) joinmessage = defaultjoinmessage;

  const catchedInvites = guildInvites.get(member.guild.id);
  const newInvites = await member.guild.fetchInvites();
  guildInvites.set(member.guild.id, newInvites);
  try {
    const usedInvite = newInvites.find(
      inv => catchedInvites.get(inv.code).uses < inv.uses
    );
    db.add(`invites_${member.guild.id}_${usedInvite.inviter.id}`, 1);
    db.set(`inviter_${member.id}`, usedInvite.inviter.id);
    let inv = db.fetch(`invites_${member.guild.id}_${usedInvite.inviter.id}`);
    //let jointimes = db.get(`jointimes_${member.guild.id}_${member.author.id}`)
    //if(jointimes === null) jointimes = "First Time";
    let joinmessage2 = defaultjoinmessage
      .toLowerCase()
      .replace("{user}", member.user.tag)
      .replace("{user}", member.user.tag)
      .replace("{user}", member.user.tag)
      .replace("{user}", member.user.tag)
      .replace("{user}", member.user.tag)
      .replace("{user}", member.user.tag)
      .replace("{user}", member.user.tag)
      .replace("{inviter}", usedInvite.inviter.tag)
      .replace("{inviter}", usedInvite.inviter.tag)
      .replace("{inviter}", usedInvite.inviter.tag)
      .replace("{inviter}", usedInvite.inviter.tag)
      .replace("{inv}", inv)
      .replace("{inv}", inv)
      .replace("{inv}", inv)
      .replace("{inv}", inv)
      .replace("{inv}", inv)
      .replace("{inv}", inv);

    //  .replace("{jointimes}", jointimes)
    //  .replace("{jointimes}", jointimes)
    // .replace("{jointimes}", jointimes)
    //  .replace("{jointimes}", jointimes)

    db.add(`jointimes_${member.guild.id}_${member.id}`, 1);
    db.add(`Regular_${member.guild.id}_${usedInvite.inviter.id}`, 1);
    client.channels.cache.get(joinchannelmessage).send(joinmessage2);
  } catch (err) {
    console.log(err);
  }
});

client.on("guildMemberRemove", member => {
  let leavechannel = db.get(`leavechannelmessage_${member.guild.id}`);
  if (leavechannel === null) {
    return console.log(`nope!`);
  }
  let leavemssage = db.get(`leavemessage_${member.guild.id}`);
  if (leavemssage === null) leavemssage = defaultleavemessage;

  let inviter2 = db.fetch(`inviter_${member.id}`);
  const iv2 = client.users.cache.get(inviter2);
  const mi = member.guild.members.cache.get(inviter2);
  db.subtract(`invites_${member.guild.id}_${inviter2}`, 1);
  if (!inviter2) {
    client.channels.cache
      .get(leavechannel)
      .send(`${member} User Left But i cloudnt find who invited him!`);
    return;
  }
  let leavemssage2 = leavemssage
    .toLowerCase()
    .replace("{user}", member.user.tag)
    .replace("{user}", member.user.tag)
    .replace("{user}", member.user.tag)
    .replace("{user}", member.user.tag)
    .replace("{inviter}", `<@${inviter2}>`)
    .replace("{inviter}", `<@${inviter2}>`)
    .replace("{inviter}", `<@${inviter2}>`)
    .replace("{inviter}", `<@${inviter2}>`)
    .replace("{inviter}", `<@${inviter2}>`);

  db.add(`leaves_${member.guild.id}_${inviter2}`, 1);
  client.channels.cache.get(leavechannel).send(leavemssage2);
});
