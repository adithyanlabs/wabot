const {
    Function,
    isPublic
} = require("../lib/");
const Config = require('../config');
const fs = require('fs');
const got = require('got');
const FormData = require('form-data');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

Function({
    pattern: 'rmbg ?(.*)',
    fromMe: true,
    desc: 'Remove background from an image'
}, async (message, match) => {
    if (!message.reply_message) return await message.reply('Please reply to an image.');
    if (!/image/.test(message.mine)) return await message.reply('Please reply to an image.');
    if (Config.REMOVE_BG_API_KEY === false) return await message.reply('No API key provided for remove.bg.');

    const loadingMessage = await message.reply('Processing...');
    const location = await message.reply_message.downloadAndSaveMedia();
    const form = new FormData();
    form.append('image_file', fs.createReadStream(location));
    form.append('size', 'auto');

    const rbg = await got.stream.post('https://api.remove.bg/v1.0/removebg', {
        body: form,
        headers: {
            'X-Api-Key': Config.REMOVE_BG_API_KEY
        }
    });

    await pipeline(rbg, fs.createWriteStream('rbg.png'));

    await message.client.sendMessage(message.jid, {
        image: fs.readFileSync('rbg.png')
    });

    await message.client.sendMessage(message.jid, {
        delete: loadingMessage.key
    });
});
