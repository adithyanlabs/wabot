const {
	SUDO,
	AUDIO_DATA,
	STICKER_DATA
} = require('../config');
const {
	Function,
	addAudioMetaData,
	getBuffer,
	toAudio,
	parseJsonModule,
    setDB, 
    PREFIX,
    isFile,
    parseMention,
    toPTT
} = require('../lib/')

async function toSticker(buffer) {
   const path = require('path')
  const { spawn } = require('child_process')
  const fs = require('fs')
  const os = require('os')
  const tempFilePath = path.join(os.tmpdir(), 'sticker.webp')
  const ffmpeg = spawn('ffmpeg', [
    '-i', '-',
    '-vf', 'scale=512:-1',
    '-loop', '0',
    '-vcodec', 'libwebp',
    tempFilePath
  ])
  ffmpeg.stdin.end(buffer)
  return new Promise((resolve, reject) => {
    ffmpeg.on('close', () => {
      fs.readFile(tempFilePath, (error, file) => {
        if (error) {
          reject(error)
        } else {
          fs.unlinkSync(tempFilePath)
          resolve(file)
        }
      })
    })
  })
}

const mediaCache = {};
const audioCache = {};
const stickerCache = {};

Function({
	pattern: 'mention ?(.*)',
	fromMe: true,
	desc: 'mention msg reply',
	type: 'group'
}, async (message, match) => {
	if (!db.database.mention_reply) {
		db.database.mention_reply = { data: false, enabled: false }
		await setDB()
	}
const dbData = db.database.mention_reply

  if (!match) return await message.send('_Need input!_\n*Example: .mention on/off*\n*.mention hello*\n\n```For more information visit:```https://github.com/A-d-i-t-h-y-a-n/hermit-md/wiki/mention')

  if (match === 'get') {
    if (!dbData.data) {
      return message.reply("*No mention msg found!*")
    }
    return message.reply(dbData.data)
  }

  if (match === 'on' || match === 'off') {
    dbData.enabled = match === 'on'
    await setDB()
    return message.reply(`_Mention ${match === 'on' ? 'Activated' : 'Deactivated'}_`)
  }

  dbData.data = match
  dbData.enabled = true
  await setDB()
  return message.reply('_Mention Updated_')
})

Function({
  on: 'messages.upsert',
  fromMe: false
}, async (message, query, client) => {
	const { data, enabled } = db.database.mention_reply || { data: false, enabled: false }
	if (!enabled || !data) return
	const Message = require('../lib/Message')
	const msg = message.messages[0]
	if (!msg?.message) return
	msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message
	const m = new Message(client, msg)
	if (!m.mentionedJid) return
	
	const isMentioned = m.mentionedJid.some(lid => lid.includes(client.user.lid))
	if (!isMentioned) return
	
	
    const typeRegex = new RegExp(/type\/(image|video|gif|audio|text|sticker)/)

    const match = typeRegex.exec(data)
    
    const type = match ? match[1] : ''

    const urls = (data.match(/http.+?(mp4|jpg|png|webp|jpeg)/g) || [])

    const default_module = {mentionedJid: [m.sender], quoted: m.data}
    
    const randomIndex = Math.floor(Math.random() * urls.length)
    
	
	async function getMediaBuffer(url) {
	  if (mediaCache[url]) {
	    return mediaCache[url];
	  }
	  const buffer = await getBuffer(url);
	  mediaCache[url] = buffer;
	  return buffer;
	}
	
	
	if (!type) {
	  const message = data.replace(/\{mention\}|[!#\$&]mention/g, `@${m.sender.split('@')[0]}`)
	  return await client.sendMessage(m.chat, { text: message, mentions: parseMention(message) }, { quoted: m.data })
	} else if (type === 'audio') {
	  const audioUrl = urls[randomIndex]
	  let audio = audioCache[audioUrl];
      if (!audio) {
      const audioBuffer = await getMediaBuffer(audioUrl);
      audio = await toPTT(await isFile(audioBuffer), 'mp4')
      
      audioCache[audioUrl] = audio;
      }
	  default_module.audio = audio
	  default_module.mimetype = 'audio/mpeg'
	  default_module.ptt = true
	} else if (type === 'video') {
	  const videoUrl = urls[randomIndex]
	  const video = await getMediaBuffer(videoUrl);
	  default_module.video = video
	} else if (type === 'sticker') {
	  const stickerUrl = urls[randomIndex]
	  let sticker = stickerCache[stickerUrl];
      if (!sticker) {
      const stickerBuffer = await getMediaBuffer(stickerUrl);
      sticker = await toSticker(stickerBuffer);
      
      stickerCache[stickerUrl] = sticker;
      }
	  default_module.sticker = sticker
	} else if (type === 'image') {
	  const imageUrl = urls[randomIndex]
	  const image = await getMediaBuffer(imageUrl);
	  default_module.image = image
	} else if (type === 'gif') {
	  const videoUrl = urls[randomIndex]
	  const video = await getMediaBuffer(videoUrl);
	  default_module.video = video
	  default_module.gifPlayback = true
	} else {
	  const message = { text: "Sorry, I can't send this " + type + " type of media." }
	  return await client.sendMessage(m.chat, message)
	}


const external_module = await parseJsonModule(data)
const module = Object.assign({}, default_module, external_module);
return await client.sendMessage(m.chat, {...module}, {...module})
})