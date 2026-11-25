const { spawn } = require('child_process');
const { Function, isPublic } = require('../lib');
const { imageToWebp, videoToWebp, addExif } = require('../lib/sticker');
const { sendStickerAudio } = require('../lib/proto-ext');

const pending = new Map();
const PENDING_TTL_MS = 10 * 60 * 1000;

function mediaKind(message) {
  if (!message) return null;
  return ['sticker', 'image', 'video', 'audio'].find(kind => message[kind]) || null;
}

async function downloadMedia(message) {
  const kind = mediaKind(message);
  const content = message.data?.message?.[message.mtype];
  if (!content) return message.download();
  const stream = await global.Baileys.downloadContentFromMessage(content, kind);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function convertToOgg(input) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0', '-vn', '-t', '5', '-c:a', 'libopus',
      '-b:a', '128k', '-f', 'ogg', 'pipe:1'
    ]);
    const chunks = [];
    const errors = [];
    ffmpeg.stdout.on('data', chunk => chunks.push(chunk));
    ffmpeg.stderr.on('data', chunk => errors.push(chunk));
    ffmpeg.on('error', reject);
    ffmpeg.on('close', code => code === 0 && chunks.length
      ? resolve(Buffer.concat(chunks))
      : reject(new Error(Buffer.concat(errors).toString() || 'No audio track found')));
    ffmpeg.stdin.on('error', reject);
    ffmpeg.stdin.end(input);
  });
}

async function makeSticker(message, kind) {
  const media = await downloadMedia(message);
  if (kind === 'sticker') return media;
  return kind === 'video' ? videoToWebp(media) : imageToWebp(media);
}

async function addMedia(message, state) {
  const kind = mediaKind(message);
  if (kind === 'audio') {
    state.audio = await convertToOgg(await downloadMedia(message));
  } else if (kind === 'video') {
    const video = await downloadMedia(message);
    if (!state.sticker) state.sticker = await videoToWebp(video);
    if (!state.audio) {
      try {
        state.audio = await convertToOgg(video);
      } catch {
        return '_Video has no audio._';
      }
    }
  } else if (kind === 'sticker' || kind === 'image') {
    state.sticker = await makeSticker(message, kind);
  }
  return null;
}

async function quotedMedia(reply, client) {
  const context = reply.data?.message?.[reply.mtype]?.contextInfo;
  if (!context?.quotedMessage) return null;
  const stored = context.stanzaId && client.store
    ? await client.store.loadMessage(context.remoteJid || reply.jid, context.stanzaId).catch(() => null)
    : null;
  const content = stored?.message || context.quotedMessage;
  const type = Object.keys(content).find(key =>
    ['stickerMessage', 'imageMessage', 'videoMessage', 'audioMessage'].includes(key)
  );
  if (!type) return null;
  const kind = type.replace('Message', '');
  return {
    [kind]: true,
    download: async () => {
      const stream = await global.Baileys.downloadContentFromMessage(content[type], kind);
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return Buffer.concat(chunks);
    }
  };
}

Function({
  pattern: 'stdio ?(.*)',
  fromMe: isPublic,
  desc: 'Make a sticker with sound. Optional: .stdio pack name;author',
  type: 'media'
}, async (message, match) => {
  const reply = message.reply_message;
  if (!mediaKind(reply)) {
    return message.reply('_Reply to a video, sticker, image, or audio._');
  }

  const key = `${message.jid}:${message.sender}`;
  for (const [id, entry] of pending) {
    if (Date.now() - entry.at > PENDING_TTL_MS) pending.delete(id);
  }
  const previous = pending.get(key);
  pending.delete(key);
  const state = previous && Date.now() - previous.at < PENDING_TTL_MS
    ? { sticker: previous.sticker, audio: previous.audio }
    : {};
  const exifInput = match?.trim() || (state.sticker || state.audio ? previous?.exifInput : '') || '';
  const error = await addMedia(reply, state);
  if (error && !state.audio) return message.reply(error);

  if (!state.sticker || !state.audio) {
    const inner = await quotedMedia(reply, message.client).catch(() => null);
    const innerKind = mediaKind(inner);
    if ((state.sticker && ['audio', 'video'].includes(innerKind)) ||
        (state.audio && ['sticker', 'image', 'video'].includes(innerKind))) {
      await addMedia(inner, state).catch(() => null);
    }
  }

  if (!state.sticker || !state.audio) {
    pending.set(key, { ...state, exifInput, at: Date.now() });
    if (pending.size > 200) pending.delete(pending.keys().next().value);
    return message.reply(state.sticker
      ? '_Sticker saved. Reply to audio or video with .stdio._'
      : '_Audio saved. Reply to a sticker, image, or video with .stdio._');
  }

  const [pack, author] = exifInput.split(/[;,]/);
  const exif = exifInput ? `${pack};${author || ''}` : undefined;
  const sticker = await addExif(state.sticker, exif);
  await sendStickerAudio(message.client, message.jid, sticker, state.audio, {
    quoted: message.data
  });
});
