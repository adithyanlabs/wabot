const { Function, isPublic, ffmpeg } = require('../lib/');

// .square - crop a video or image to 1:1 from the centre (ported from raganork-md's .square).
// The side is the shorter dimension rounded down to an even number: H.264 (yuv420p) rejects
// odd sizes, which made raganork's version fail on e.g. 1079x1920 phone recordings.
const SIDE = 'trunc(min(iw\\,ih)/2)*2';
const CROP = `crop=${SIDE}:${SIDE},setsar=1`; // crop is centred by default

const VIDEO_ARGS = [
  '-vf', CROP,
  '-map', '0:v:0', '-map', '0:a?',            // keep the audio if there is any
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '128k',
  '-movflags', '+faststart'
];
const IMAGE_ARGS = ['-vf', CROP, '-frames:v', '1', '-q:v', '2'];

// the replied video/image node, also inside view-once / ephemeral wrappers
function repliedMedia(reply) {
  let msg = reply?.data?.message;
  if (!msg) return null;
  msg = msg.ephemeralMessage?.message || msg;
  for (const w of ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension']) {
    if (msg[w]?.message) msg = msg[w].message;
  }
  if (msg.videoMessage) return { type: 'video', node: msg.videoMessage };
  if (msg.imageMessage) return { type: 'image', node: msg.imageMessage };
  return null;
}

async function download(node, type) {
  const { downloadContentFromMessage } = global.Baileys;
  const chunks = [];
  for await (const chunk of await downloadContentFromMessage(node, type)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const squareVideo = (buffer) => ffmpeg(buffer, VIDEO_ARGS, 'mp4', 'mp4');
const squareImage = (buffer) => ffmpeg(buffer, IMAGE_ARGS, 'img', 'jpg');

Function({
  pattern: 'square ?(.*)',
  fromMe: isPublic,
  desc: 'Crop a video or image to a square from the centre',
  type: 'media'
}, async (message) => {
  const media = repliedMedia(message.reply_message);
  if (!media) return await message.reply('_Reply to a video or image to crop it to a square_');

  try {
    if (media.type === 'video') await message.reply('_Cropping video to a square..._');
    const input = await download(media.node, media.type);
    const output = media.type === 'video' ? await squareVideo(input) : await squareImage(input);
    const options = { quoted: message.data, caption: '_Cropped to a square_' };
    if (media.type === 'video' && media.node.gifPlayback) options.gifPlayback = true;
    return await message.send(output, media.type, options);
  } catch (error) {
    const reason = typeof error === 'number' ? `ffmpeg exited with code ${error}` : (error?.message || String(error));
    return await message.reply(`_Could not crop to a square: ${reason}_`);
  }
});

module.exports = { squareVideo, squareImage, repliedMedia };
