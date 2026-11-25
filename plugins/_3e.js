const {
	Function,
	isPublic,
	getUrl,
	fromBuffer,
	Imgur,
	getBuffer,
	getJson,
	parsedJid,
	Fancy,
	addAudioMetaData,
	bytesToSize,
	parseMention,
	isUrl,
	sendwithLinkpreview,
	pinterest,
	wallpaper,
	wikimedia,
	quotesAnime,
	aiovideodl,
	umma,
	ringtone,
	styletext,
	FileSize,
	h2k,
	textpro,
	yt,
	ytIdRegex,
	yta,
	ytv,
	runtime,
	clockString,
	sleep,
	jsonformat,
	Serialize,
	processTime,
    parsedUrl,
    isFile,
    postJson
} = require("../lib/");
const util = require('util');
const config = require ('../config')
Function({pattern: '> ?(.*)', fromMe: true, desc: 'Run js code (evel)', type: 'misc'}, async (message, match, client) => {return});
Function({on: 'text', fromMe: true, desc: 'Run js code (evel)', type: 'misc'}, async (message, match, client) => {
if(message.message.startsWith(">")){
const m = message;
try {
let evaled = await eval(`${message.message.replace(">","")}`) 
if (typeof evaled !== 'string') evaled = require('util').inspect(evaled); 
await message.reply(evaled) 
} catch (err) {
await message.reply(util.format(err))
}}
})

Function({on:'text', fromMe: true}, async (message, match, client) => {
if (message.message.startsWith("$")) {
var m = message
var conn = message.client
const util = require('util')
const json = (x) => JSON.stringify(x,null,2)
try { let return_val = await eval(`(async () => { ${message.message.replace("$","")} })()`)
if (return_val && typeof return_val !== 'string') return_val = util.inspect(return_val)
if (return_val) await message.send(return_val || "No return value")} catch (e) {
if (e) await message.send(util.format(e))}
}
})