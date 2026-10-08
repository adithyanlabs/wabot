const {
    Function,
    prefix,
    setSchedule,
    getSchedule,
    getAllSchedule,
    addSchedule
} = require('../lib/')

const {
    AUTOMUTE_MSG,
    AUTOUNMUTE_MSG
} = require('../config')

const isBotAdmins = async (message) => {
    const groupMetadata = await message.client.groupMetadata(message.chat)
    const participants = await groupMetadata.participants
    const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id)
    return groupAdmins.includes(message.user_id)
}

const formatTime = (time) => {
    if (!time) return 'null'
    const upper = time.toUpperCase()
    const digits = upper.replace(/[A-Z]/g, '').trim()
    const meridiem = upper.replace(/[^A-Z]/g, '')
    return `${digits} ${meridiem}`.trim()
}

const isValidTime = (text) => {
    const upper = text.toUpperCase()
    return upper.includes(':') && (upper.includes('AM') || upper.includes('PM'))
}

const createScheduler = ({ pattern, type, label, defaultMsg, desc, action }) => {
    Function({
        pattern: `${pattern} ?(.*)`,
        fromMe: true,
        desc,
        type: 'group'
    }, async (message, match, client) => {
        if (!message.isGroup) return await message.reply('_This command only works in group chats_')
        if (!(await isBotAdmins(message))) return await message.reply("_I'm not an admin_")

        const groupMetadata = await message.client.groupMetadata(message.jid)
        const current = await getSchedule(message.jid, type)
        const msg = message.reply_message.text || defaultMsg
        const text = (match || '').trim()
        const input = text.toLowerCase()

        if (!text) {
            return await message.reply(
                `*${label} Manager*\n\n` +
                `Group: ${groupMetadata.subject}\n` +
                `Status: ${current?.enabled ? 'Enabled' : 'Disabled'}\n\n` +
                `Usage:\n` +
                `${prefix}${pattern} on\n` +
                `${prefix}${pattern} off\n` +
                `${prefix}${pattern} get\n` +
                `${prefix}${pattern} 6:00 AM\n` +
                `${prefix}${pattern} 12:00 PM`
            )
        }

        if (input === 'get') {
            if (!current) return await message.send(`_${label} is not scheduled in this chat_`)
            return await message.send(
                `*Time:* ${formatTime(current.time)}\n` +
                `*Status:* ${current.enabled ? 'on' : 'off'}\n` +
                `*Message:* ${current.message}`
            )
        }

        if (input === 'on' || input === 'off') {
            if (!current || !current.time) return await message.send(`_${label} is not scheduled in this chat_`)

            const schedule = await getSchedule(message.jid, type)
            const originalTime = current.time
            if (input === 'off') schedule.time = 'off'

            const isScheduled = await addSchedule(message.jid, schedule.time, type, schedule.subject, schedule.message, client)
            if (!isScheduled) return await message.send(`_${label} already ${input === 'on' ? 'enabled' : 'disabled'}_`)

            await setSchedule(message.jid, originalTime, type, schedule.subject, schedule.message, input === 'on')
            return await message.send(`_${label} ${input === 'on' ? 'enabled' : 'disabled'}._`)
        }

        if (!isValidTime(text)) {
            return await message.reply(`_Wrong format!_\n*Example:* ${pattern} 6:00 AM || ${pattern} 12:00 PM`)
        }

        await setSchedule(message.jid, text, type, groupMetadata.subject, msg, true)
        await addSchedule(message.jid, text, type, groupMetadata.subject, msg, client)
        return await message.send(`_Group will ${action} at ${formatTime(text)}_`)
    })
}

createScheduler({
    pattern: 'automute',
    type: 'mute',
    label: 'AutoMute',
    defaultMsg: AUTOMUTE_MSG,
    desc: 'auto group mute scheduler',
    action: 'mute'
})

createScheduler({
    pattern: 'autounmute',
    type: 'unmute',
    label: 'AutoUnmute',
    defaultMsg: AUTOUNMUTE_MSG,
    desc: 'auto group unmute scheduler',
    action: 'unmute'
})

Function({
    pattern: 'getmute ?(.*)',
    fromMe: true,
    desc: 'get all groups mute and unmute schedules',
    type: 'group'
}, async (message) => {
    const schedules = await getAllSchedule()
    if (!schedules || !schedules.length) return await message.send('_No schedules found_')

    const lines = schedules.map((schedule, index) => {
        const { mute = {}, unmute = {} } = JSON.parse(schedule.dataValues.content)
        return `*${index + 1}. Group:* ${mute.groupName || unmute.groupName || 'null'}\n` +
            `*Mute:* ${formatTime(mute.time)}\n` +
            `*Unmute:* ${formatTime(unmute.time)}\n` +
            `*Status:* ${mute.enabled ?? 'null'}`
    })

    await message.send(lines.join('\n\n'))
})