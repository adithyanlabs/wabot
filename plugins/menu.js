const {
    Function,
    isPublic,
    Fancy,
    formatBytes,
    commands
} = require('../lib/');

const {
    BOT_INFO,
    MODE,
    PREFIX,
    VERSION
} = require('../config');
const os = require('os');

Function({
    pattern: 'menu',
    fromMe: isPublic,
    type: 'info'
}, async (message) => {
    const HANDLER = /\[(\W*)\]/.test(PREFIX) ? PREFIX.match(/\[(\W*)\]/)[1][0] : '.';
    const commandslist = {};

    commands.forEach(command => {
        if (command.dontAddCommandList === false && command.pattern !== undefined) {
            let name;
            try {
                const match = command.pattern.toString().match(/(\W*)([A-Za-zğüşıiöç0-9 ]*)/);
                name = match && match.length >= 3 ? HANDLER + match[2] : command.pattern;
            } catch {
                name = command.pattern;
            }

            const type = command.type || 'misc';
            if (!commandslist[type]) commandslist[type] = [];
            commandslist[type].push(String(name).trim());
        }
    });

    const [botName, owner] = BOT_INFO.split(';');
    const user = message.pushName.replace(/[\r\n]+/gm, '');

    let msg = `*${botName}*\n\n`;
    msg += `User: ${user}\n`;
    msg += `Admin: ${owner}\n`;
    msg += `Mode: ${MODE}\n`;
    msg += `Uptime: ${runtime(process.uptime())}\n`;
    msg += `RAM: ${formatBytes(os.totalmem() - os.freemem())} / ${formatBytes(os.totalmem())}\n`;
    msg += `Version: ${VERSION}\n`;
    msg += `Commands: ${commands.length}\n`;

    for (const category in commandslist) {
        msg += `\n*${await Fancy(category.toUpperCase(), 32)}*\n`;
        for (const plugin of commandslist[category]) {
            msg += `- ${await Fancy(plugin.toLowerCase(), 32)}\n`;
        }
    }

    await message.send(msg.trim());
});

const runtime = function (seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return [
        d > 0 ? `${d}d` : '',
        h > 0 ? `${h}h` : '',
        m > 0 ? `${m}m` : '',
        s > 0 ? `${s}s` : ''
    ].filter(Boolean).join(' ');
};

exports.runtime = runtime;