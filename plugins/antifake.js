const {
    Function,
    setAntiFake,
    antiFakeList,
    prefix
} = require('../lib/')
const {
    getFake
} = require('../lib/database/antifake')

// TODO: change button to text 

Function({
    pattern: 'antifake ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Set antifake',
    type: 'group'
}, async (message, match) => {
    const groupMetadata = await message.client.groupMetadata(message.chat)
    const isAntiFake = await getFake(message.jid)

    let buttons = [
        {
            buttonId: prefix + 'antifake on',
            buttonText: { displayText: 'ON' },
            type: 1
        },
        {
            buttonId: prefix + 'antifake off',
            buttonText: { displayText: 'OFF' },
            type: 1
        },
        {
            buttonId: prefix + 'antifake list',
            buttonText: { displayText: 'LIST' },
            type: 1
        }
    ]

    let isAntiFakeEnabled = isAntiFake && isAntiFake.enabled || false

    const buttonMessage = {
        text: 'Antifake Manager',
        footer: `Group Name: ${groupMetadata.subject}\nAntiFake Status: ${isAntiFakeEnabled ? 'Enabled' : 'Disabled'}`,
        buttons: buttons,
        headerType: 1
    }

    if (!match) return await message.client.sendMessage(message.chat, buttonMessage)

    if (match === 'list') {
        if (!isAntiFake) {
            return await message.reply("_You haven't set the Antifake yet._\n__To set:__ ```.antifake 1,44,972...```")
        }
        return await message.reply(await antiFakeList(message.jid))
    }

    if (match === 'on' || match === 'off') {
        await setAntiFake(message.jid, match)
        return await message.reply(`_Antifake ${match === 'on' ? 'Activated' : 'Deactivated'}_`)
    }

    await setAntiFake(message.jid, match)
    return await message.reply('_Antifake Updated_')
})
