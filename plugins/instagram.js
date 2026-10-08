const {
    Function,
    isPublic,
    instagram,
    getJson,
    postJson,
    getUrl
} = require('../lib/');

Function({
    pattern: 'insta ?(.*)',
    fromMe: isPublic,
    desc: 'Download Instagram posts or reels',
    type: 'download'
}, async (message, match, client) => {
    match = getUrl(match || message.reply_message.text);
    if (!match) return await message.reply('*Need an Instagram link!*');
    
    try {
        const { result, status } = await getJson('https://api-25ca.onrender.com/api/instagram?url=' + match);
        if (!status || result.length < 1) return await message.reply('*No media found!*');
        
        for (const url of result) {
            await message.sendFromUrl(url);
        }
    } catch (error) {
        console.error(error);
        await message.reply('*Failed to fetch media.*\n_Please try again later._');
    }
});

Function({
    pattern: 'story ?(.*)',
    fromMe: isPublic,
    desc: 'Download Instagram stories',
    type: 'download'
}, async (message, match) => {
    try {
        match = match || message.reply_message.text;
        if (!match || (!match.includes("/stories/") && !match.startsWith("http"))) {
            return await message.reply('*Provide a valid URL or username.*');
        }
        
        if (match.includes("/stories/")) {
            const index = match.indexOf("/stories/") + 9;
            const lastIndex = match.lastIndexOf("/");
            match = match.substring(lastIndex, index);
        }
        
        const response = await getJson(apiUrl + 'story?url=https://instagram.com/stories/' + match);
        if (!response.status || response.result.length < 1) return await message.reply('*No media found!*');
        
        for (const url of response.result) {
            await message.sendFromUrl(url);
        }
    } catch (error) {
        console.error(error);
        await message.send('*Failed to download.*\n_Server may be down_\n_Please try again later._');
    }
});
