const { Function, setWarn, resetWarn } = require('../lib/');
const config = require('../config');

async function isAdmin(participants, userId) {
    return (await participants.filter(p => p.admin !== null).map(p => p.lid)).includes(userId);
}

Function({
    pattern: 'warn ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Warn users in the chat',
    type: 'group',
}, async (message, match) => {
    const user = message.mention[0] || message.reply_message.sender;
    if (!user) return await message.reply('_Reply or mention a user_');
    
    const count = await setWarn(user, message.jid);
    
    if (count > config.WARN) {
        const groupMetadata = await message.client.groupMetadata(message.jid);
        const participants = groupMetadata.participants;
        
        const botIsAdmin = await isAdmin(participants, message.client.user.lidid);
        const userIsAdmin = await isAdmin(participants, user);
        
        if (!botIsAdmin) return await message.reply("*I'm not an admin*");
        if (userIsAdmin) return await message.reply('*Given user is an admin.*');
        
        await message.client.sendMessage(message.jid, {
            text: `@${user.split('@')[0]}, *Kicked from the group*,\n_Reached max warnings._`,
            mentions: [user]
        });
        await resetWarn(user, message.jid);
        return await message.client.groupParticipantsUpdate(message.jid, [user], 'remove');
    }
    
    let reason = 'No reason provided';
    if (message.reply_message) {
        reason = message.reply_message.text ? (message.reply_message.text.length > 40 ? 'Replied message' : message.reply_message.text) : message.reply_message.mtype.replace('Message', '');
    }
    if (match) {
        reason = match.replace(`@${user.split('@')[0]}`, '').trim() || reason;
    }

    await message.client.sendMessage(message.jid, {
        text: `*╭* ⚠️ WARNING ⚠️ \n┣ *User:* @${user.split('@')[0]}\n┣ *Warnings:* ${count}\n┣ *Reason:* ${reason}\n┣ *Remaining:* ${config.WARN - count}\n*╰*`,
        mentions: [user]
    });
});

Function({
    pattern: 'reset ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Reset warnings for a user in the chat',
    type: 'group'
}, async (message, match) => {
    if (match.startsWith('warn')) {
        const user = message.mention[0] || message.reply_message.sender;
        if (!user) return await message.reply('_Reply or mention a user_');
        
        try {
            await resetWarn(user, message.jid);
            await message.client.sendMessage(message.jid, {
                text: `*╭* RESET WARNING\n┣ *User:* @${user.split('@')[0]}\n┣ *Remaining warnings:* ${config.WARN}\n*╰*`,
                mentions: [user]
            });
        } catch (error) {
            return await message.reply("_The user doesn't have any warnings yet_");
        }
    }
});
