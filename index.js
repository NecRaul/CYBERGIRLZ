const { Client, GatewayIntentBits } = require("discord.js");
const {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} = require("@discordjs/voice");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});
const { downloadFromInfo, getInfo } = require("ytdl-core");
const { command, token } = require("./config.json");

const CYBERGIRLZ = "https://www.youtube.com/watch?v=IMgWnCMAigw";

const audioPlayer = createAudioPlayer();

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
      "You need to be in a voice channel you stupid moid!"
    );
    return;
  }
  if (!voiceChannel.joinable) {
    await message.channel.send(
      `Voice channel ${voiceChannel.name} isn't joinable?`
    );
    return;
  }

  joinVoiceChannel({
    guildId: message.guild.id,
    channelId: voiceChannel.id,
    adapterCreator: message.guild?.voiceAdapterCreator,
  }).subscribe(audioPlayer);

  const videoInfo = await getInfo(CYBERGIRLZ);
  const resource = createAudioResource(
    downloadFromInfo(videoInfo, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    })
  );
  audioPlayer.play(resource);
});

client.login(token).catch((e) => console.log(e));

