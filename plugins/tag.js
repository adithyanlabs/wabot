const {
    Function,
    parseMention
} = require('../lib/');

Function({
    pattern: 'tag ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Tag participants in the group',
    type: 'group'
}, async (message, match) => {
    const groupMetadata = await message.client.groupMetadata(message.chat).catch(() => {});
    const participants = groupMetadata ? groupMetadata.participants : [];

    if (match === 'all') {
        let msg = '';
        let count = 1;
        for (const participant of participants) {
            msg += `${count++} @${participant.id.split('@')[0]}\n`;
        }
        return await message.client.sendMessage(message.chat, {
            text: msg,
            mentions: participants.map(participant => participant.id)
        });
    } 

    if (match === 'admin' || match === 'admins') {
        const admins = participants.filter(participant => participant.admin !== null).map(participant => participant.jid);
        let msg = '';
        let count = 1;
        for (const admin of admins) {
            msg += `${count++} @${admin.split('@')[0]}\n`;
        }
        return await message.reply(msg, {
            mentions: parseMention(msg)
        });
    }

    if (match) {
        return await message.send(match || message.reply_message.text, 'text', {
            mentions: participants.map(participant => participant.id)
        });
    }

    if (!message.reply_message) {
        return await message.reply('_Example: \ntag all\n.tag admin\n.tag text\nReply to a message_');
    }

    await message.client.forwardMessage(message.chat, message.quoted_message, {
        contextInfo: {
            mentionedJid: participants.map(participant => participant.id)
        }
    });
});
