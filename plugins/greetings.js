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
        const usage = [`${prefix}welcome on`, `${prefix}welcome off`, `${prefix}welcome get`, `${prefix}welcome delete`, `${prefix}welcome Hey &mention, Welcome to &gname`].join('\n')
        return await message.reply(`*Welcome Manager*\n\nGroup: ${groupMetadata.subject}\nStatus: ${welcomeEnabled ? '✅' : '❌'}\n\nUsage:\n${usage}`)
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
        const usage = [`${prefix}goodbye on`, `${prefix}goodbye off`, `${prefix}goodbye get`, `${prefix}goodbye delete`, `${prefix}goodbye Bye &mention`].join('\n')
        return await message.reply(`*Goodbye Manager*\n\nGroup: ${groupMetadata.subject}\nStatus: ${goodbyeEnabled ? '✅' : '❌'}\n\nUsage:\n${usage}\n\nMore info: https://github.com/adithyanlabs/hermit-md/wiki/greetings`)
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