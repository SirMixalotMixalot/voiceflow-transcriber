const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const { default: axios } = require("axios");
const sdk = require("api")("@voiceflow-developer/v1.2#cfbl71xlo6a5m31");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop_recording")
    .setDescription("Stops recording the current call the bot is in"),
  async execute(interaction, client) {
    await interaction.deferReply();

    const voiceConnection = getVoiceConnection(interaction.guildId);

    if (!voiceConnection) {
      await interaction.followUp("I need to be in a call first!");
      return;
    }
    voiceConnection.destroy();
    await interaction.followUp("I've stopped recording the call!");

    //upload file to voiceflow
    const channel = interaction.member.voice.channel;
    console.dir(channel);
    const transcriptFileName = `${channel.name}-${interaction.member.voice.sessionId}.txt`;

    if (!fs.existsSync(transcriptFileName)) {
      return;
    }
    const fileData = await fs.openAsBlob(transcriptFileName);

    const formData = new FormData();
    formData.append("file", fileData, transcriptFileName);
    try {
      await axios.post(
        "https://api.voiceflow.com/v3alpha/knowledge-base/docs/upload?maxChunkSize=1000",
        formData,
        {
          headers: {
            Authorization: process.env.VOICE_FLOW_KNOWLEDGE_API_KEY,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (e) {
      console.error(e);
    }
  },
};
