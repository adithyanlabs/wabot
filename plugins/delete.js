const {
    Function,
    isPublic
} = require("../lib/");

async function isBotAdmins(message, client) {
    const groupMetadata = message.isGroup ? await client.groupMetadata(message.chat).catch(e => {}) : '';
    const participants = message.isGroup ? await groupMetadata.participants : '';
    const groupAdmins = message.isGroup ? await participants.filter(v => v.admin !== null).map(v => v.id) : '';
    return message.isGroup ? groupAdmins.includes(message.user_id) : false;
}

Function({
    pattern: 'del$',
    fromMe: isPublic,
    desc: 'Delete message sent by the bot',
    type: 'whatsapp'
}, async (message, match, client) => {
    if (!message.reply_message) return await message.reply('_Reply to a message_');
    await client.sendMessage(message.chat, {
        delete: {
            remoteJid: message.chat,
            fromMe: true,
            id: message.quoted.id,
            participant: message.quoted.sender
        }
    });
});

Function({
    pattern: 'dlt$',
    fromMe: true,
    onlyGroup: true,
    desc: 'Delete message sent by a participant',
    type: 'group'
}, async (message, match, client) => {
    if (!message.reply_message) return await message.reply('_Reply to a message_');
    const isBotAdmin = await isBotAdmins(message, client);
    if (!isBotAdmin) return await message.reply("I'm not an admin");
    await client.sendMessage(message.chat, {
        delete: {
            remoteJid: message.chat,
            fromMe: message.quoted.fromMe,
            id: message.quoted.id,
            participant: message.quoted.sender
        }
    });
});

Function({
    pattern: 'edit ?(.*)',
    fromMe: true,
    desc: 'Edit message sent by the bot',
    type: 'whatsapp'
}, async (message, match, client) => {
    if (!message.reply_message) return await message.reply('_Reply to a message_');
    if (!match) return await message.reply('_Need text!_\n*Example: edit hi*');
    await client.relayMessage(message.jid, {
        protocolMessage: {
            key: message.quoted.data.key,
            type: 14,
            editedMessage: {
                conversation: match
            }
        }
    }, {});
});
