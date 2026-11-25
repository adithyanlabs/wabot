const {
	Function,
	isPublic,
	sendAlive,
	runtime
} = require("../lib/");
const config = require('../config')

Function({
	pattern: 'ping ?(.*)',
	fromMe: isPublic,
	desc: 'Bot response in second.',
	type: 'info'
}, async (message, match, client) => {
	var start = new Date().getTime();
	var msg = await message.reply('*Ping!*');
	var end = new Date().getTime();
	var responseTime = end - start;
	await message.reply(`*Pong!*\nLatency: ${responseTime}ms`);
});

Function({
	pattern: 'alive ?(.*)',
	fromMe: isPublic,
	desc: 'Does bot work?',
	type: 'info'
}, async (message, match, client) => {
	await sendAlive(client, message, match);
});

Function({
	pattern: 'jid',
	fromMe: isPublic,
	desc: 'to get remoteJid',
	type: 'whatsapp'
}, async (message) => {
	await message.reply(message.mentionedJid[0] ? message.mentionedJid[0] : message.quoted ? message.quoted.sender : message.chat)
});

Function({
	pattern: 'runtime',
	fromMe: isPublic,
	desc: 'get bots runtime',
	type: 'info'
}, async (message, match, client) => {
	await message.send(await runtime(process.uptime()));
});

// The reply chatbot used api.brainshop.ai, which has shut down; its lib functions were
// removed earlier, so this handler threw "isChatBot is not a function" on every message.