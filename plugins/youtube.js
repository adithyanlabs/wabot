const { Function, isPublic, addAudioMetaData } = require('../lib/');
const yt = require('../lib/youtube');
const fs = require('fs');

const QUALITIES = [144, 240, 360, 480, 720, 1080];
const VIDEO_LIMIT = 100 * 1024 * 1024;      // bigger videos go as a document
const DOCUMENT_LIMIT = 1900 * 1024 * 1024;  // WhatsApp's document limit is 2 GB

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + ' MB';
const clock = (s) => s >= 3600
  ? new Date(s * 1000).toISOString().slice(11, 19)
  : new Date(s * 1000).toISOString().slice(14, 19);
const fileName = (title, ext) => (title.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'youtube') + '.' + ext;

// text after the command, or the replied message
const query = (message, match) => (match || '').trim() || (message.reply_message?.text || '').trim();

const failure = (e) => {
  const reason = String(e?.message || e);
  const status = e?.info?.response?.status || e?.info?.status;
  // YouTube serves only the first ~1 MB of many videos to clients without its anti-bot
  // (PO) token, then answers 403
  if (status === 403 || /non 2xx/i.test(reason)) {
    return '_YouTube refused the download (HTTP 403)._\n_YouTube now blocks most downloads that do not carry its anti-bot token, so this video cannot be downloaded right now._';
  }
  if (/login|sign in|age/i.test(reason)) return '_This video needs a signed-in account (age-restricted or private)._';
  if (/unavailable|private|removed|not playable/i.test(reason)) return '_This video is unavailable._';
  if (/No video found/i.test(reason)) return '_No results found._';
  if (/ffmpeg is not installed/i.test(reason)) return '_ffmpeg is not installed. Run the installer again or install ffmpeg._';
  return `_Download failed: ${reason}_`;
};

Function({
  pattern: 'yts ?(.*)',
  fromMe: isPublic,
  desc: 'Search YouTube',
  type: 'download'
}, async (message, match) => {
  const text = query(message, match);
  if (!text) return await message.reply('_Give me something to search_\n*Example:* .yts hermit bot');
  try {
    const results = await yt.search(text, 10);
    if (!results.length) return await message.reply('_No results found._');
    const list = results.map((v, i) =>
      `*${i + 1}. ${v.title}*\n` +
      `_${[v.duration, v.channel, v.views].filter(Boolean).join(' • ')}_\n${v.url}`
    ).join('\n\n');
    return await message.reply(`*YouTube results for:* _${text}_\n\n${list}`);
  } catch (e) {
    return await message.reply(failure(e));
  }
});

async function sendSong(message, match, client) {
  const text = query(message, match);
  if (!text) return await message.reply('_Give me a song name or YouTube link_\n*Example:* .song believer');
  let song;
  try {
    await message.reply(yt.isYouTubeUrl(text) ? '_Downloading audio..._' : `_Searching *${text}*..._`);
    song = await yt.downloadAudio(text);
    const tagged = await addAudioMetaData(fs.readFileSync(song.file), song.thumbnail, song.title, song.channel, 'Hermit');
    await client.sendMessage(message.chat, {
      audio: tagged,
      mimetype: 'audio/mpeg',
      fileName: fileName(song.title, 'mp3'),
    }, { quoted: message.data });
  } catch (e) {
    return await message.reply(failure(e));
  } finally {
    song?.done();
  }
}

Function({ pattern: 'song ?(.*)', fromMe: isPublic, desc: 'Download a song from YouTube as mp3', type: 'download' }, sendSong);
Function({ pattern: 'yta ?(.*)', fromMe: isPublic, desc: 'Download YouTube audio as mp3', type: 'download' }, sendSong);

async function sendVideo(message, match, client) {
  let text = query(message, match);
  // optional quality at the end: ".ytv <link or name> 720"
  let height = 480;
  const q = text.match(/\s+(\d{3,4})p?$/i);
  if (q && QUALITIES.includes(+q[1])) {
    height = +q[1];
    text = text.slice(0, q.index).trim();
  }
  if (!text) return await message.reply(`_Give me a video name or YouTube link_\n*Example:* .ytv <link> 720\n_Qualities: ${QUALITIES.join(', ')} (default 480)_`);

  let video;
  try {
    await message.reply(`_Downloading video (${height}p)..._`);
    video = await yt.downloadVideo(text, height);
    if (video.size > DOCUMENT_LIMIT) return await message.reply(`_The video is too large to send (${mb(video.size)}). Try a lower quality._`);

    const caption = `*${video.title}*\n_${[video.channel, clock(video.seconds), video.height + 'p', mb(video.size)].filter(Boolean).join(' • ')}_`;
    const content = video.size > VIDEO_LIMIT
      ? { document: { url: video.file }, mimetype: 'video/mp4', fileName: fileName(video.title, 'mp4'), caption }
      : { video: { url: video.file }, mimetype: 'video/mp4', caption };
    await client.sendMessage(message.chat, content, { quoted: message.data });
  } catch (e) {
    return await message.reply(failure(e));
  } finally {
    video?.done();
  }
}

Function({ pattern: 'ytv ?(.*)', fromMe: isPublic, desc: 'Download a YouTube video', type: 'download' }, sendVideo);
Function({ pattern: 'video ?(.*)', fromMe: isPublic, desc: 'Search and download a YouTube video', type: 'download' }, sendVideo);
