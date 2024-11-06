const { Client, GatewayIntentBits } = require("discord.js");
const {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  VoiceConnectionDisconnectReason,
} = require("@discordjs/voice");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});
const {
  createAgent,
  downloadFromInfo,
  getInfo,
} = require("@distube/ytdl-core");
const { command, token } = require("./config.json");
const { readFileSync } = require("fs");

const CYBERGIRLZ = "https://www.youtube.com/watch?v=IMgWnCMAigw";
const agent = createAgent(JSON.parse(readFileSync("cookies.json")));
const audioPlayer = createAudioPlayer();
let voiceConnection = null;

client.on("messageCreate", async (message) => {
  if (
    !message.guild ||
    message.author.bot ||
    message.content.trimEnd() != `${command}` ||
    audioPlayer.state.status != AudioPlayerStatus.Idle
  ) {
    return;
  }

  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) {
    await message.channel.send(
      "You need to be in a voice channel you stupid moid!",
    );
    return;
  }
  if (!voiceChannel.joinable) {
    await message.channel.send(
      `Voice channel ${voiceChannel.name} isn't joinable?`,
    );
    return;
  }

  voiceConnection = joinVoiceChannel({
    guildId: message.guild.id,
    channelId: voiceChannel.id,
    adapterCreator: message.guild?.voiceAdapterCreator,
  });
  voiceConnection.subscribe(audioPlayer);

  const videoInfo = await getInfo(CYBERGIRLZ, { agent });
  const resource = createAudioResource(
    downloadFromInfo(videoInfo, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    }),
  );
  audioPlayer.play(resource);

  let idleStartTime = Date.now();
  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    idleStartTime = Date.now();
  });
  const disconnectAfterIdle = setInterval(() => {
    const elapsedTime = Date.now() - idleStartTime;
    if (
      elapsedTime > 60000 &&
      audioPlayer.state.status == AudioPlayerStatus.Idle
    ) {
      if (voiceConnection) {
        voiceConnection.disconnect(VoiceConnectionDisconnectReason.IDLE);
        voiceConnection = null;
      }
      clearInterval(disconnectAfterIdle);
    }
  }, 1000);
});

client.login(token).catch((e) => console.log(e));
