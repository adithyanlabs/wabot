const {
    Function,
    PluginDB,
    Plugin,
    removeCommand,
    getJson,
    Database,
    commands,
    PREFIX,
    pluginFile
} = require('../lib/');
const Config = require('../config');
const axios = require('axios');
const fs = require('fs');

Function({
    pattern: 'plugin ?(.*)',
    fromMe: true,
    desc: 'install plugins',
    type: 'user'
}, async (message, match) => {
    match = match || message.reply_message.text;
    await Plugin(match, message);
});

Function({
    pattern: 'remove ?(.*)',
    fromMe: true,
    desc: 'Remove a specific plugin or all plugins',
    type: 'user'
}, async (message, match) => {
    if (!match) return await message.reply('Need plugin name!\nExample:\n.remove mforward\n.remove all');
    try {
        if (match.toLowerCase() === 'all') {
            const plugins = await PluginDB.PluginDB.findAll();
            for (const plugin of plugins) {
                const pluginName = plugin.dataValues.name;
                await removeCommand(pluginName);
                await plugin.destroy();
            }
            return await message.reply('All plugins successfully deleted!\nReboot the BOT');
        }
        const plugin = await PluginDB.PluginDB.findAll({ where: { name: match } });
        if (plugin.length < 1) return await message.reply(`Plugin *${match}* not found.`);
        await removeCommand(plugin[0].dataValues.name);
        await plugin[0].destroy();
        const pluginPath = require('path').join(__dirname, pluginFile(match));
        delete require.cache[pluginPath];
        if (fs.existsSync(pluginPath)) fs.unlinkSync(pluginPath);
        await message.reply('Plugin successfully deleted!\nReboot the BOT');
    } catch (error) {
        console.error(error);
        await message.reply(`An error occurred while removing the plugin(s).\nError: ${error.message}`);
    }
});

Function({
    pattern: 'cmdrm ?(.*)',
    fromMe: true,
    desc: 'Delete a command',
    type: 'user'
}, async (message, match) => {
    const response = await removeCommand(match);
    if (response) {
        await message.send('Deleted');
    } else {
        await message.send('Not found');
    }
});

const toggle = new Database('toggle');
Function({
    pattern: 'toggle ?(.*)',
    fromMe: true,
    desc: 'To switch commands on/off',
    type: 'group'
}, async (message, match) => {
    if (!match) return await message.reply('Need a cmd and action!\nExample: toggle ping off/on');
    const [cmd, tog] = match.split(' ');
    if (!cmd) return await message.reply('Need a cmd!\nExample: toggle ping off/on');
    if (!tog || (tog !== 'on' && tog !== 'off')) return await message.reply('Need an action!\nExample: toggle ping off/on');
    if (cmd == 'toggle') return await message.reply("I can't toggle toggle");
    const iscmd = commands.some(command => command.pattern !== undefined && command.pattern.test(PREFIX + cmd));
    if (!iscmd) return await message.reply(`Command *${cmd}* not found`);
    await toggle.set(cmd, tog == 'off');
    return await message.reply(`${cmd.charAt(0).toUpperCase() + cmd.slice(1)} ${tog == 'on' ? 'Activated' : 'Deactivated'}`);
});
