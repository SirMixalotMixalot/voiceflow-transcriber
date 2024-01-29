require("dotenv").config(); //initializes dotenv
const { Client, Collection, GatewayIntentBits } = require("discord.js"); //imports discord.js
const fs = require("fs");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
}); //creates new client

client.commands = new Collection();
client.commandsArray = [];
const functionFolders = fs.readdirSync("./functions");

for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./functions/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of functionFiles) {
    require(`./functions/${folder}/${file}`)(client);
  }
}
client.handleEvents();
client.handleCommands();

client.login(process.env.CLIENT_TOKEN);
