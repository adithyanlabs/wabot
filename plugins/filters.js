const {
    Function,
    parseMessage
} = require('../lib/');
const FilterDb = require('../lib/database/filters');

Function({
    pattern: 'filter ?(.*)',
    fromMe: true,
    desc: 'Set filter message in any chat',
    type: 'group'
}, async (message, match, client) => {
    let filters = match.match(/[\'\"\“](.*?)[\'\"\“]/gsm);

    if (filters === null) {
        filters = await FilterDb.getFilter(message.jid);
        if (filters === false) {
            await message.reply('_There are no filters in this chat!_');
        } else {
            let msg = '_Here are your filters in this chat:_\n';
            filters.map((filter) => msg += '```' + filter.dataValues.pattern + '```\n');
            await message.reply(msg);
        }
    } else {
        if (filters.length < 2) {
            return await message.reply(`*Need text!*\nExample: filter 'hi' 'hello'`);
        }
        await FilterDb.setFilter(message.jid, filters[0].replace(/['"“]+/g, ''), filters[1].replace(/['"“]+/g, ''), filters[0][0] === "'" ? true : false);
        const name = filters[0].replace(/['"]+/g, '');
        await message.reply(`_Successfully set_ \`\`\`${name}\`\`\` _to filter!_`);
    }
});

Function({
    pattern: 'stop ?(.*)',
    fromMe: true,
    desc: 'Stop filter message',
    type: 'group'
}, async (message, match, client) => {
    if (!match) return await message.reply(`*Need text!*\nExample: stop hi`);
    let deleted = await FilterDb.deleteFilter(message.jid, match);
    if (!deleted) return await message.reply('_There was no filter like this!_');
    await message.reply('_The filter was successfully deleted!_');
});

Function({
    pattern: 'pfilter ?(.*)',
    fromMe: true,
    desc: 'Set filter message in all PMs',
    type: 'group'
}, async (message, match, client) => {
    let filters = match.match(/[\'\"\“](.*?)[\'\"\“]/gsm);
    if (filters === null) {
        filters = await FilterDb.getFilter('pfilter');
        if (filters === false) {
            await message.reply('_No pfilters found!_');
        } else {
            let msg = '_Here are your pfilters:_\n';
            filters.map((filter) => msg += '```' + filter.dataValues.pattern + '```\n');
            await message.reply(msg);
        }
    } else {
        if (filters.length < 2) {
            return await message.reply(`*Need text!*\nExample: pfilter 'hi' 'hello'`);
        }
        await FilterDb.setFilter('pfilter', filters[0].replace(/['"“]+/g, ''), filters[1].replace(/['"“]+/g, ''), filters[0][0] === "'" ? true : false);
        const name = filters[0].replace(/['"]+/g, '');
        await message.reply(`_Successfully set_ \`\`\`${name}\`\`\` _to pfilter!_`);
    }
});

Function({
    pattern: 'pstop ?(.*)',
    fromMe: true,
    desc: 'Stop filter message in all PMs',
    type: 'group'
}, async (message, match, client) => {
    if (!match) return await message.reply(`*Need text!*\nExample: pstop hi`);
    let deleted = await FilterDb.deleteFilter('pfilter', match);
    if (!deleted) return await message.reply('_There was no pfilter like this!_');
    await message.reply('_The pfilter was successfully deleted!_');
});

Function({
    pattern: 'gfilter ?(.*)',
    fromMe: true,
    desc: 'Set filter message in all groups',
    type: 'group'
}, async (message, match, client) => {
    let filters = match.match(/[\'\"\“](.*?)[\'\"\“]/gsm);
    if (filters === null) {
        filters = await FilterDb.getFilter('gfilter');
        if (filters === false) {
            await message.reply('_No Gfilters found!_');
        } else {
            let msg = '_Here are your Gfilters:_\n';
            filters.map((filter) => msg += '```' + filter.dataValues.pattern + '```\n');
            await message.reply(msg);
        }
    } else {
        if (filters.length < 2) {
            return await message.reply(`*Need text!*\nExample: gfilter 'hi' 'hello'`);
        }
        await FilterDb.setFilter('gfilter', filters[0].replace(/['"“]+/g, ''), filters[1].replace(/['"“]+/g, ''), filters[0][0] === "'" ? true : false);
        const name = filters[0].replace(/['"]+/g, '');
        await message.reply(`_Successfully set_ \`\`\`${name}\`\`\` _to Gfilter!_`);
    }
});

Function({
    pattern: 'gstop ?(.*)',
    fromMe: true,
    desc: 'Stop filter message in all groups',
    type: 'group'
}, async (message, match, client) => {
    if (!match) return await message.reply(`*Need text!*\nExample: gstop hi`);
    let deleted = await FilterDb.deleteFilter('gfilter', match);
    if (!deleted) return await message.reply('_There was no Gfilter like this!_');
    await message.reply('_The Gfilter was successfully deleted!_');
});

Function({
    on: 'text',
    fromMe: false
}, async (message, match, client) => {
    let filters = await FilterDb.getFilter(message.jid);
    if (!filters) return;
    filters.map(
        async (filter) => {
            let pattern = new RegExp(filter.dataValues.regex ? filter.dataValues.pattern : ('\\b(' + filter.dataValues.pattern + ')\\b'), 'gm');
            if (pattern.test(message.text)) {
                await client.sendMessage(message.jid, await parseMessage(message.jid, message.sender, client, filter.dataValues.text), {
                    quoted: message.data
                });
            }
        }
    );
});

Function({
    on: 'text',
    fromMe: false
}, async (message, match, client) => {
    let filters = await FilterDb.getFilter('pfilter');
    if (!filters) return;
    filters.map(
        async (filter) => {
            let pattern = new RegExp(filter.dataValues.regex ? filter.dataValues.pattern : ('\\b(' + filter.dataValues.pattern + ')\\b'), 'gm');
            if (pattern.test(message.text)) {
                await client.sendMessage(message.jid, await parseMessage(message.jid, message.sender, client, filter.dataValues.text), {
                    quoted: message.data
                });
            }
        }
    );
});

Function({
    on: 'text',
    fromMe: false
}, async (message, match, client) => {
    let filters = await FilterDb.getFilter('gfilter');
    if (!filters) return;
    filters.map(
        async (filter) => {
            let pattern = new RegExp(filter.dataValues.regex ? filter.dataValues.pattern : ('\\b(' + filter.dataValues.pattern + ')\\b'), 'gm');
            if (pattern.test(message.text)) {
                await client.sendMessage(message.jid, await parseMessage(message.jid, message.sender, client, filter.dataValues.text), {
                    quoted: message.data
                });
            }
        }
    );
});
