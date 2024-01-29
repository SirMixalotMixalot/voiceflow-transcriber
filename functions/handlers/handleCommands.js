const fs = require("fs");
const { REST, Routes } = require("discord.js");
module.exports = (client) => {
  const { commands, commandsArray } = client;
  client.handleCommands = async () => {
    const commandFolders = fs.readdirSync(`./commands`);
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith("js"));
      for (const commandFile of commandFiles) {
        const currentPath = `../../commands/${folder}/${commandFile}`;
        const command = require(currentPath);
        commands.set(command.data.name, command);
        commandsArray.push(command.data);
        console.log(`Command: ${command.data.name} has been processed`);
      }
    }
    const clientId = "1200584036691742721";
    const guildId = "1200583738191523894";
    const rest = new REST({ version: "9" }).setToken(process.env.CLIENT_TOKEN);
    try {
      console.log("Started refreshing application (/) commands");
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsArray,
      });
    } catch (error) {
      console.error(error);
    }
  };
};
