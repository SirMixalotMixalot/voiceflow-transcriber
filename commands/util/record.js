// command which joins a call, transcribes the messeges and adds them to the knowledge base
const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
  entersState,
  VoiceConnectionStatus,
  EndBehaviorType,
} = require("@discordjs/voice");
const {
  createWriteStream,
  readSync,
  readFileSync,
  openAsBlob,
  writeFile,
  appendFile,
  write,
} = require("fs");
const { pipeline } = require("stream");
const prism = require("prism-media");
const { default: axios } = require("axios");
const { readFile } = require("fs/promises");

const WHISPER_URL = "https://transcribe.whisperapi.com";
module.exports = {
  data: new SlashCommandBuilder()
    .setName("record")
    .setDescription(
      `Joins your current voice call and records and transcribes your call!`
    ),
  async execute(interaction, client) {
    // join voice call
    await interaction.deferReply();

    const voiceConnection = getVoiceConnection(interaction.guildId);

    if (!interaction.member.voice.channel) {
      await interaction.followUp(
        "Join a voice channel and then try that again!"
      );
      return;
    }
    const channel = interaction.member.voice.channel;
    const transcriptFileName = `${channel.name}-${interaction.member.voice.sessionId}.txt`;

    //make a transcript file for this entire call
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      selfDeaf: false,
      selfMute: true,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    const receiver = connection.receiver;
    // set up recording and transcription
    receiver.speaking.on("start", (userId) => {
      const opusStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 1000,
        },
      });
      const oggStream = new prism.opus.OggLogicalBitstream({
        opusHead: new prism.opus.OpusHead({
          channelCount: 2,
          sampleRate: 48000,
        }),
        pageSizeControl: {
          maxPackets: 10,
        },
      });

      const filename = `./recordings/${Date.now()}.ogg`;

      const out = createWriteStream(filename);

      console.log(`👂 Started recording ${filename}`);

      pipeline(opusStream, oggStream, out, async (err) => {
        if (err) {
          console.warn(`❌ Error recording file ${filename} - ${err.message}`);
        } else {
          console.log(`✅ Recorded ${filename}`);
          // send to transcription api and save on voiceflow
          const fileData = await openAsBlob(filename);
          const formData = new FormData();
          formData.append("file", fileData, filename);

          formData.append("fileType", "ogg");
          formData.append("language", "en");
          formData.append("task", "transcribe");
          try {
            const transcription = await axios.post(WHISPER_URL, formData, {
              headers: {
                Authorization: "Bearer " + process.env.WHISPER_API_KEY,
              },
            });
            //save data to txt file
            //console.dir(interaction.member);
            appendFile(
              transcriptFileName,
              `${interaction.member.user.globalName}: ${transcription.data.text}\n`,
              (err) => {
                console.log("Failed to write to file");
                console.error(err);
              }
            );
          } catch (error) {
            connection.destroy();
            console.error("We fumbled this one my guy");
            console.error(error);
            console.error("=================");
          }
        }
      });
    });

    await interaction.followUp("Ready!");
    //
  },
};
