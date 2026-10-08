const {
    Function,
    prefix
} = require('../lib/')
const sql = require('../lib/database/greetings')

Function({
    pattern: 'welcome ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Sets the welcome message',
    type: 'group'
}, async (message, match, client) => {
    const groupMetadata = await client.groupMetadata(message.chat)
    const welcomeMessage = await sql.getMessage(message.jid)
    const welcomeEnabled = (welcomeMessage && welcomeMessage.enabled) || false
    const text = (match || '').trim()
    const input = text.toLowerCase()

    if (!text) {
        return await message.reply(
            `*Welcome Manager*\n\n` +
            `Group: ${groupMetadata.subject}\n` +
            `Status: ${welcomeEnabled ? 'Enabled' : 'Disabled'}\n\n` +
            `Usage:\n` +
            `${prefix}welcome on\n` +
            `${prefix}welcome off\n` +
            `${prefix}welcome get\n` +
            `${prefix}welcome delete\n` +
            `${prefix}welcome Hey &mention, Welcome to &gname`
        )
    }

    switch (input) {
        case 'on':
            if (!welcomeMessage) return await message.reply('_Welcome message not set._')
            await sql.enableMessage(message.jid)
            await message.reply('_Welcome activated_')
            break
        case 'off':
            if (!welcomeMessage) return await message.reply('_Welcome message not set._')
            await sql.disableMessage(message.jid)
            await message.reply('_Welcome deactivated_')
            break
        case 'delete':
            if (!welcomeMessage) return await message.reply('_Welcome message not set._')
            await sql.deleteMessage(message.jid, 'welcome')
            await message.reply('_Welcome deleted_')
            break
        case 'get':
            if (!welcomeMessage) return await message.reply('_Welcome message not set._')
            await client.ev.emit('group-participants.update', {
                id: message.chat,
                participants: [message.sender],
                action: 'add'
            })
            await message.reply(welcomeMessage.message)
            break
        default:
            await sql.setMessage(message.jid, 'welcome', text)
            await client.ev.emit('group-participants.update', {
                id: message.chat,
                participants: [message.sender],
                action: 'add'
            })
            await message.reply('_Welcome updated_')
    }
})

Function({
    pattern: 'goodbye ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Sets the goodbye message',
    type: 'group'
}, async (message, match, client) => {
    const groupMetadata = await client.groupMetadata(message.chat)
    const goodbyeMessage = await sql.getMessage(message.jid, 'goodbye')
    const goodbyeEnabled = (goodbyeMessage && goodbyeMessage.enabled) || false
    const text = (match || '').trim()
    const input = text.toLowerCase()

    if (!text) {
        return await message.reply(
            `*Goodbye Manager*\n\n` +
            `Group: ${groupMetadata.subject}\n` +
            `Status: ${goodbyeEnabled ? 'Enabled' : 'Disabled'}\n\n` +
            `Usage:\n` +
            `${prefix}goodbye on\n` +
            `${prefix}goodbye off\n` +
            `${prefix}goodbye get\n` +
            `${prefix}goodbye delete\n` +
            `${prefix}goodbye Bye &mention\n\n` +
            `More info: https://github.com/A-d-i-t-h-y-a-n/hermit-md/wiki/greetings`
        )
    }

    switch (input) {
        case 'on':
            if (!goodbyeMessage) return await message.reply('_Goodbye message not set._')
            await sql.enableMessage(message.jid, 'goodbye')
            await message.reply('_Goodbye activated_')
            break
        case 'off':
            if (!goodbyeMessage) return await message.reply('_Goodbye message not set._')
            await sql.disableMessage(message.jid, 'goodbye')
            await message.reply('_Goodbye deactivated_')
            break
        case 'delete':
            if (!goodbyeMessage) return await message.reply('_Goodbye message not set._')
            await sql.deleteMessage(message.jid, 'goodbye')
            await message.reply('_Goodbye deleted_')
            break
        case 'get':
            if (!goodbyeMessage) return await message.reply('_Goodbye message not set._')
            await client.ev.emit('group-participants.update', {
                id: message.chat,
                participants: [message.sender],
                action: 'remove'
            })
            await message.reply(goodbyeMessage.message)
            break
        default:
            await sql.setMessage(message.jid, 'goodbye', text)
            await client.ev.emit('group-participants.update', {
                id: message.chat,
                participants: [message.sender],
                action: 'remove'
            })
            await message.reply('_Goodbye updated_')
    }
})