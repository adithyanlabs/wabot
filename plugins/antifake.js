const {
    Function,
    setAntiFake,
    antiFakeList,
    prefix
} = require('../lib/')
const {
    getFake
} = require('../lib/database/antifake')

Function({
    pattern: 'antifake ?(.*)',
    fromMe: true,
    onlyGroup: true,
    desc: 'Set antifake',
    type: 'group'
}, async (message, match) => {
    const groupMetadata = await message.client.groupMetadata(message.chat)
    const isAntiFake = await getFake(message.jid)
    const isAntiFakeEnabled = (isAntiFake && isAntiFake.enabled) || false
    const input = (match || '').trim().toLowerCase()

    if (!input) {
        const usage = [`${prefix}antifake on`, `${prefix}antifake off`, `${prefix}antifake list`, `${prefix}antifake 1,44,972`].join('\n')
        return await message.reply(`*Antifake Manager*\n\nGroup: ${groupMetadata.subject}\nStatus: ${isAntiFakeEnabled ? '✅' : '❌'}\n\nUsage:\n${usage}`)
    }

    if (input === 'list') {
        if (!isAntiFake) {
            return await message.reply("_You haven't set the Antifake yet._\n__To set:__ ```.antifake 1,44,972...```")
        }
        return await message.reply(await antiFakeList(message.jid))
    }

    if (input === 'on' || input === 'off') {
        await setAntiFake(message.jid, input)
        return await message.reply(`_Antifake ${input === 'on' ? 'Activated' : 'Deactivated'}_`)
    }

    await setAntiFake(message.jid, match.trim())
    return await message.reply('_Antifake Updated_')
})