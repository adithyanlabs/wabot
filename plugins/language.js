const { Function } = require('../lib/');
const i18n = require('../lib/i18n');

const preview = (text, n = 70) => {
  const one = String(text).replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n) + '…' : one;
};

Function({
  pattern: 'lang ?(.*)',
  fromMe: true,
  desc: 'Change the language of bot replies',
  type: 'user'
}, async (message, match) => {
  const code = (match || '').trim().toLowerCase();
  const list = Object.entries(i18n.LANGUAGES).map(([c, name]) => `${c === i18n.current() ? '✅' : '▫️'} *${c}* - ${name}`).join('\n');
  if (!code) {
    return await message.reply(`*Bot language*\n\n${list}\n\n_Change with:_ .lang ml\n_Edit replies with:_ .replies, .setreply`);
  }
  if (!i18n.setLanguage(code)) return await message.reply(`_Unknown language *${code}*_\n\n${list}`);
  const s = i18n.settings();
  const extra = code === 'custom' ? `\n_Based on *${s.base}* with ${Object.keys(s.custom || {}).length} edited replies._` : '';
  return await message.reply(`_Language set to *${i18n.LANGUAGES[code]}*_${extra}`);
});

Function({
  pattern: 'replies ?(.*)',
  fromMe: true,
  desc: 'Find bot replies you can edit with .setreply',
  type: 'user'
}, async (message, match) => {
  const words = (match || '').trim();
  const keys = i18n.search(words, 25);
  if (!keys.length) return await message.reply(`_No replies found for *${words}*_`);
  const custom = i18n.settings().custom || {};
  const total = words ? '' : `\n_Showing 25 of ${Object.keys(i18n.catalog).length}. Search with .replies <word>_`;
  const rows = keys.map(k => `${custom[k] !== undefined ? '✏️ ' : ''}*${k}*\n${preview(i18n.textFor(k))}`).join('\n\n');
  return await message.reply(`*Bot replies*${total}\n\n${rows}\n\n_Edit with:_ .setreply <key> <new reply>`);
});

Function({
  pattern: 'getreply ?(.*)',
  fromMe: true,
  desc: 'Show a bot reply in every language',
  type: 'user'
}, async (message, match) => {
  const key = (match || '').trim();
  if (!key) return await message.reply('_Give me a reply key_\n*Example:* .getreply youtube.no_results_found\n_Find keys with .replies_');
  if (!i18n.catalog[key]) return await message.reply(`_No reply with the key *${key}*. Find keys with .replies_`);
  const custom = i18n.settings().custom?.[key];
  const vars = i18n.placeholders(i18n.catalog[key]);
  return await message.reply(
    `*${key}*\n\n` +
    `*en:* ${i18n.textFor(key, 'en')}\n\n*ml:* ${i18n.textFor(key, 'ml')}\n\n*genz:* ${i18n.textFor(key, 'genz')}` +
    (custom !== undefined ? `\n\n*custom:* ${custom}` : '') +
    (vars.length ? `\n\n_Values in this reply: ${vars.join(' ')}. Keep them in your edit._` : '')
  );
});

Function({
  pattern: 'setreply ?(.*)',
  fromMe: true,
  desc: 'Edit a bot reply (custom language)',
  type: 'user'
}, async (message, match) => {
  const [, key, inline] = (match || '').match(/^\s*(\S+)\s*([\s\S]*)$/) || [];
  const text = (inline || message.reply_message?.text || '').trim();
  if (!key || !text) return await message.reply('_Give me a key and the new reply_\n*Example:* .setreply youtube.no_results_found Nothing found da 😅\n_Or reply to a message with .setreply <key>. Find keys with .replies_');
  if (!i18n.catalog[key]) return await message.reply(`_No reply with the key *${key}*. Find keys with .replies_`);

  const want = i18n.placeholders(i18n.catalog[key]);
  const have = i18n.placeholders(text);
  const missing = want.filter(p => !have.includes(p));
  const unknown = have.filter(p => !want.includes(p));
  if (unknown.length) return await message.reply(`_This reply only has the values ${want.join(' ') || '(none)'}; remove ${unknown.join(' ')}_`);

  i18n.setCustom(key, text);
  const note = missing.length ? `\n_Note: your reply leaves out ${missing.join(' ')}, so those values will not be shown._` : '';
  return await message.reply(`_Reply *${key}* updated_\n_Language is now *custom*._${note}`);
});

Function({
  pattern: 'delreply ?(.*)',
  fromMe: true,
  desc: 'Remove an edited reply (or all)',
  type: 'user'
}, async (message, match) => {
  const key = (match || '').trim();
  if (!key) return await message.reply('_Give me a reply key, or all_\n*Example:* .delreply youtube.no_results_found');
  const removed = i18n.deleteCustom(key);
  if (!removed) return await message.reply(`_*${key}* has no edited reply_`);
  return await message.reply(key === 'all' ? `_Removed ${removed} edited replies_` : `_Edited reply *${key}* removed_`);
});
