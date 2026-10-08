const {
    Function,
    prefix
} = require('../lib/')
const sql = require('../lib/database/greetings')

// TODO: change button to text

Function({
    pattern: 'welcome ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Sets the welcome message',
    type: 'group'
}, async (message, match, client) => {
    const groupMetadata = await client.groupMetadata(message.chat)
    let welcomeMessage = await sql.getMessage(message.jid)
    let buttons = [
        {
            buttonId: prefix + 'welcome on',
            buttonText: { displayText: 'ON' },
            type: 1
        },
        {
            buttonId: prefix + 'welcome off',
            buttonText: { displayText: 'OFF' },
            type: 1
        },
        {
            buttonId: prefix + 'welcome get',
            buttonText: { displayText: 'GET' },
            type: 1
        }
    ]

    let welcomeEnabled = welcomeMessage && welcomeMessage.enabled
    const buttonMessage = {
        text: '*Example: .welcome on/off/delete*\n' +
            '*.welcome Hey &mention, Welcome to &gname*\n\n' +
            '```For more information visit:``` https://github.com/A-d-i-t-h-y-a-n/hermit-md/wiki/greetings',
        footer: `Group Name: ${groupMetadata.subject}\nWelcome Message Status: ${welcomeEnabled ? 'Enabled' : 'Disabled'}`,
        buttons: buttons,
        headerType: 1
    }
    
    if (!match) {
        return await message.client.sendMessage(message.chat, buttonMessage)
    }

    switch (match) {
        case "on":
            if (!welcomeMessage) return message.reply('_Welcome message not set._')
            await sql.enableMessage(message.jid)
            await message.reply('_Welcome activated_')
            break
        case "off":
            if (!welcomeMessage) return message.reply('_Welcome message not set._')
            await sql.disableMessage(message.jid)
            await message.reply('_Welcome deactivated_')
            break
        case "delete":
            if (!welcomeMessage) return message.reply('_Welcome message not set._')
            await sql.deleteMessage(message.jid, 'welcome')
            await message.reply('_Welcome deleted_')
            break
        case "get":
            if (!welcomeMessage) return message.reply('_Welcome message not set._')
            const updateWelcome = {
                id: message.chat,
                participants: [message.sender],
                action: 'add'
            }
            await client.ev.emit('group-participants.update', updateWelcome)
            message.reply(welcomeMessage.message)
            break
        default:
            await sql.setMessage(message.jid, 'welcome', match)
            const update = {
                id: message.chat,
                participants: [message.sender],
                action: 'add'
            }
            await client.ev.emit('group-participants.update', update)
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
    let goodbyeMessage = await sql.getMessage(message.jid, 'goodbye')
    let buttons = [
        {
            buttonId: prefix + 'goodbye on',
            buttonText: { displayText: 'ON' },
            type: 1
        },
        {
            buttonId: prefix + 'goodbye off',
            buttonText: { displayText: 'OFF' },
            type: 1
        },
        {
            buttonId: prefix + 'goodbye get',
            buttonText: { displayText: 'GET' },
            type: 1
        }
    ]

    let goodbyeEnabled = goodbyeMessage && goodbyeMessage.enabled
    const buttonMessage = {
        text: '*Example: .goodbye on/off/delete*\n' +
            '*.goodbye Bye &mention*\n\n' +
            '```For more information visit:``` https://github.com/A-d-i-t-h-y-a-n/hermit-md/wiki/greetings',
        footer: `Group Name: ${groupMetadata.subject}\nGoodbye Message Status: ${goodbyeEnabled ? 'Enabled' : 'Disabled'}`,
        buttons: buttons,
        headerType: 1
    }

    if (!match) {
        return await message.client.sendMessage(message.chat, buttonMessage)
    }

    switch (match) {
        case "on":
            if (!goodbyeMessage) return message.reply('_Goodbye message not set._')
            await sql.enableMessage(message.jid, 'goodbye')
            await message.reply('_Goodbye activated_')
            break
        case "off":
            if (!goodbyeMessage) return message.reply('_Goodbye message not set._')
            await sql.disableMessage(message.jid, 'goodbye')
            await message.reply('_Goodbye deactivated_')
            break
        case "delete":
            if (!goodbyeMessage) return message.reply('_Goodbye message not set._')
            await sql.deleteMessage(message.jid, 'goodbye')
            await message.reply('_Goodbye deleted_')
            break
        case "get":
            if (!goodbyeMessage) return message.reply('_Goodbye message not set._')
            const updateGoodbye = {
                id: message.chat,
                participants: [message.sender],
                action: 'remove'
            }
            await client.ev.emit('group-participants.update', updateGoodbye)
            message.reply(goodbyeMessage.message)
            break
        default:
            await sql.setMessage(message.jid, 'goodbye', match)
            const update = {
                id: message.chat,
                participants: [message.sender],
                action: 'remove'
            }
            await client.ev.emit('group-participants.update', update)
            await message.reply('_Goodbye updated_')
    }
})
