const { Function } = require('../lib/');
const config = require('../config');

const isBotAdmin = async (message) => {
    if (!message.isGroup) return false;

    const groupMetadata = await message.client.groupMetadata(message.chat).catch(() => {});
    const participants = groupMetadata ? groupMetadata.participants : [];
    const adminIds = participants.filter(participant => participant.admin !== null).map(participant => participant.id);

    return adminIds.includes(message.client.user.lid);
};

Function({
    pattern: 'pp$',
    fromMe: true,
    desc: 'Set profile picture in any resolution',
    type: 'whatsapp'
}, async (message) => {
    if (!message.reply_message || !message.reply_message.image) {
        return await message.send('_Reply to an image._');
    }
    const media = await message.reply_message.downloadAndSaveMedia();
    await message.updateProfilePicture(message.user_id, media);
    await message.send("```Profile updated```");
});

Function({
    pattern: 'fullpp$',
    fromMe: true,
    desc: 'Set profile picture in any resolution',
    type: 'whatsapp'
}, async (message) => {
    if (!message.reply_message || !message.reply_message.image) {
        return await message.send('_Reply to an image._');
    }
    const media = await message.reply_message.downloadAndSaveMedia();
    await message.updateProfilePicture(message.user_id, media);
    await message.send("```Profile updated```");
});

Function({
    pattern: 'gpp$',
    fromMe: true,
    desc: 'Set group icon in any resolution',
    type: 'group'
}, async (message) => {
    if (!message.isGroup) return await message.send('_This command only works in group chats_');
    
    if (!await isBotAdmin(message)) return await message.send("_I'm not an admin_");
    
    if (!message.reply_message || !message.reply_message.image) {
        return await message.send('_Reply to an image._');
    }
    const media = await message.reply_message.downloadAndSaveMedia();
    await message.updateProfilePicture(message.chat, media);
    await message.send("```Group icon updated```");
});

Function({
    pattern: 'block$',
    fromMe: true,
    desc: 'Block a person',
    type: 'whatsapp'
}, async (message) => {
    const id = message.mention[0] || message.reply_message.sender || (!message.isGroup && message.jid);
    if (!id) return await message.send('*Provide a user*');
    await message.client.updateBlockStatus(id, 'block');
    await message.send('_Blocked_');
});

Function({
    pattern: 'unblock$',
    fromMe: true,
    desc: 'Unblock a person',
    type: 'whatsapp'
}, async (message) => {
    const id = message.mention[0] || message.reply_message.sender || (!message.isGroup && message.jid);
    if (!id) return await message.send('*Provide a user*');
    await message.client.updateBlockStatus(id, 'unblock');
    await message.send('_Unblocked_');
});

Function({
    pattern: 'clear$',
    fromMe: true,
    desc: 'Delete WhatsApp chat',
    type: 'whatsapp'
}, async (message) => {
    await message.clearChat(message.chat);
    await message.send('_Chat cleared_');
});

Function({
    pattern: 'archive$',
    fromMe: true,
    desc: 'Archive WhatsApp chat',
    type: 'whatsapp'
}, async (message) => {
    await message.archiveChat(message.chat, true);
    await message.send('_Chat archived_');
});

Function({
    pattern: 'unarchive$',
    fromMe: true,
    desc: 'Unarchive WhatsApp chat',
    type: 'whatsapp'
}, async (message) => {
    await message.archiveChat(message.chat, false);
    await message.send('_Chat unarchived_');
});

Function({
    pattern: 'pin$',
    fromMe: true,
    desc: 'Pin a message',
    type: 'whatsapp'
}, async (message) => {
    await message.pinMsg(message.chat, true);
    await message.send('_Message pinned_');
});

Function({
    pattern: 'unpin$',
    fromMe: true,
    desc: 'Unpin a message',
    type: 'whatsapp'
}, async (message) => {
    await message.pinMsg(message.chat, false);
    await message.send('_Message unpinned_');
});

Function({
    pattern: 'setbio ?(.*)',
    fromMe: true,
    desc: 'Change your profile status',
    type: 'whatsapp'
}, async (message, match) => {
    match = match || message.reply_message.text;
    if (!match) return await message.send('*Need status!*\n*Example: setbio Hey there! I am using WhatsApp*');
    await message.client.updateProfileStatus(match);
    await message.send('_Profile status updated_');
});

Function({
    pattern: 'setname ?(.*)',
    fromMe: true,
    desc: 'Change your profile name',
    type: 'whatsapp'
}, async (message, match) => {
    match = match || message.reply_message.text;
    if (!match) return await message.send('*Need name!*\n*Example: setname Your Name*');
    await message.client.updateProfileName(match);
    await message.send('_Profile name updated_');
});

Function({
    pattern: 'onwa ?(.*)',
    fromMe: true,
    desc: 'Check if a number is on WhatsApp',
    type: 'whatsapp'
}, async (message, match) => {
    match = match || message.reply_message.text;
    if (!match) return await message.send('*Need number!*\n*Example: onwa +1 (123) 456-7890*');
    match = match.replace(/[^0-9]/g, '');
    if (!match) return await message.send('*Need number!*\n*Example: onwa +1 (123) 456-7890*');
    
    const [result] = await message.client.onWhatsApp(match);
    if (!result) {
        return await message.send(match + " does not exist on WhatsApp");
    }
    if (result.exists) {
        return await message.send("*" + match + " exists on WhatsApp*,\nJID: " + result.jid);
    }
});
