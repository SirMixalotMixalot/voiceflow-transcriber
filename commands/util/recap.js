const { SlashCommandBuilder } = require("discord.js");
const sdk = require("api")("@voiceflow-developer/v1.2#79ekqm2zlrgprgl6");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("recap")
    .setDescription("Answers any questions about the most recent call")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Get more specific information about the recap")
        .setRequired(false)
    ),
  async execute(interaction, client) {
    // send query

    const query =
      interaction?.options?._hoistedOptions[0]?.value ??
      "Recap the last document stored"; //the things we have to do in this life...

    console.log(query);
    sdk.auth(process.env.VOICE_FLOW_KNOWLEDGE_API_KEY);
    sdk
      .postKnowledgeBaseQuery({
        question: query,
        chunkLimit: 2,
        synthesis: true,
        settings: {
          model: "claude-instant-v1",
          temperature: 0.1,
          system:
            "You are an AI Summary assistant. Information will be provided to help answer the user's questions. Always summarize your response to be as brief as possible and be extremely concise. Your responses should be fewer than a couple of sentences. Do not reference the material provided in your response.",
        },
      })
      .then(async ({ data }) => await interaction.reply(data.output))
      .catch((err) => console.error(err));
  },
};
