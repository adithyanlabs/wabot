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
        return await message.reply(
            `*Antifake Manager*\n\n` +
            `Group: ${groupMetadata.subject}\n` +
            `Status: ${isAntiFakeEnabled ? 'Enabled' : 'Disabled'}\n\n` +
            `Usage:\n` +
            `${prefix}antifake on\n` +
            `${prefix}antifake off\n` +
            `${prefix}antifake list\n` +
            `${prefix}antifake 1,44,972`
        )
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