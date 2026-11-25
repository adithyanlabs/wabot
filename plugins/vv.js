const { Function, Database } = require('../lib/');
const config = require('../config');

// Ported from raganork-md (plugins/wamsg.js .vv, plugins/autovv.js, plugins/utils/viewonce.js).
// WhatsApp only sends view-once media to an Android companion; with WA_BROWSER=chrome the
// quoted message is a stub without media, and the original never reaches the message store.

const WRAPPERS = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];
const MEDIA = ['imageMessage', 'videoMessage', 'audioMessage'];
const TEXT = ['extendedTextMessage', 'conversation'];

const isAndroid = () => config.WA_BROWSER === 'android';

// returns a clean (non view-once) copy of a view-once message, or null
function extractViewOnce(message) {
  if (!message) return null;
  const root = message.ephemeralMessage?.message || message;
  const wrapper = WRAPPERS.find(key => root[key]);
  const inner = wrapper ? root[wrapper].message : root;
  if (!inner) return null;

  const type = [...MEDIA, ...TEXT].find(key => inner[key]);
  if (!type) return null;
  const value = inner[type];
  if (typeof value === 'string') {
    return wrapper ? { type, isText: true, text: value, message: { [type]: value } } : null;
  }
  if (!wrapper && !value.viewOnce) return null;

  const node = { ...value };
  delete node.viewOnce;
  const isText = TEXT.includes(type);
  return { type, isText, text: isText ? node.text || '' : null, message: { [type]: node } };
}

// usable = text present, or media that can still be downloaded
// (newer WhatsApp quotes view-once as a stub without either)
function hasContent(vv) {
  if (!vv) return false;
  if (vv.isText) return Boolean(vv.text);
  const media = vv.message[vv.type];
  return Boolean(media?.mediaKey || media?.url || media?.directPath);
}

// the quote is often a stub, so look the original up in the message store (messages.db).
// retry briefly in case it was quoted right after it arrived and is still being written.
async function recoverFromStore(client, chat, id) {
  if (!id || !client.store) return null;
  for (let i = 0; i < 4; i++) {
    const saved = await client.store.loadMessage(chat, id).catch(() => null);
    const vv = extractViewOnce(saved?.message);
    if (hasContent(vv)) return { vv, source: saved };
    if (saved) return null;
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

const ownerJid = (client) => {
  const sudo = String(config.SUDO || '').split(',')[0].replace(/[^0-9]/g, '');
  return sudo && sudo !== '0' ? sudo + '@s.whatsapp.net' : client.user.jid;
};

// failures go to the owner's DM, so nothing shows up in the chat where .vv was used
async function reportFailure(client, chat, reason) {
  const where = chat.endsWith('@g.us') ? `group ${chat.split('@')[0]}` : chat.split('@')[0];
  try {
    await client.sendMessage(ownerJid(client), {
      text: `*_.vv could not open a view once message_*\n\n_Chat:_ ${where}\n_Reason:_ ${reason}`
    });
  } catch (_) {}
}

const STUB_REASON = () =>
  'WhatsApp quoted the message without its media, and the original was not found in the saved messages (it may be older than 48 hours, or it arrived without media).' +
  (isAndroid()
    ? ' Turn on `.autovv` to save view once messages the moment they arrive.'
    : ' The browser is set to chrome, which never receives view once media. Set WA_BROWSER=android and restart (no need to link again).');

async function sendViewOnce(client, target, vv, key, caption) {
  if (vv.isText) {
    return client.sendMessage(target, { text: caption ? `${vv.text}\n\n${caption}` : vv.text });
  }
  const message = { [vv.type]: { ...vv.message[vv.type] } };
  if (caption && vv.type !== 'audioMessage') {
    const original = message[vv.type].caption;
    message[vv.type].caption = original ? `${original}\n\n${caption}` : caption;
  }
  return client.forwardMessage(target, { key, message }, { contextInfo: { isForwarded: false } });
}

Function({
  pattern: 'vv ?(.*)',
  fromMe: true,
  desc: 'Send a view-once message as normal media',
  type: 'utility'
}, async (message, match, client) => {
  const reply = message.reply_message;
  if (!reply?.data?.message) return message.reply('_Reply to a view once message!_');

  let vv = extractViewOnce(reply.data.message);
  if (!vv) return message.reply('_Not a view once msg!_');

  const target = match?.trim() || message.chat;
  if (!target.includes('@')) return message.reply('_Use a full JID for another chat._');

  const chat = reply.chat || message.chat;
  let source = reply.data;
  if (!hasContent(vv)) {
    const recovered = await recoverFromStore(client, chat, reply.id);
    if (!recovered) return reportFailure(client, message.chat, STUB_REASON());
    vv = recovered.vv;
    source = recovered.source;
  }

  try {
    return await sendViewOnce(client, target, vv, source.key);
  } catch (error) {
    return reportFailure(client, message.chat, String(error?.message || error));
  }
});

/* ---------- auto view once ---------- */
const autovv = new Database('autovv');

const normalizeJid = (input, current) => {
  const value = (input || '').trim().toLowerCase();
  if (!value) return null;
  if (value === 'here') return current;
  if (value.includes('@')) return /^[\w.-]+@(s\.whatsapp\.net|g\.us|lid)$/.test(value) ? value : null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 ? `${digits}@s.whatsapp.net` : null;
};

Function({
  pattern: 'autovv ?(.*)',
  fromMe: true,
  desc: 'Save every incoming view once message to a chosen chat',
  type: 'utility'
}, async (message, match) => {
  const arg = (match || '').trim();
  const current = autovv.get('jid');
  const browser = isAndroid() ? 'android ✅' : 'chrome ⚠️ (view once media is never received, set WA_BROWSER=android)';

  if (!arg || arg.toLowerCase() === 'status') {
    return message.reply(
      `_*Auto view once*_\n\n_Status:_ ${current ? `on ✅ → ${current}` : 'off ❌'}\n_Browser:_ ${browser}\n\n` +
      '_Usage:_\n`.autovv here` - _use this chat_\n`.autovv <number/jid>` - _use another chat_\n`.autovv off` - _disable_'
    );
  }
  if (arg.toLowerCase() === 'off') {
    autovv.delete('jid');
    return message.reply('_Auto view once deactivated ❌_');
  }
  const target = normalizeJid(arg, message.chat);
  if (!target) return message.reply('_Invalid chat! Use `here`, a number, or a JID like `123456789@s.whatsapp.net`_');
  autovv.set('jid', target);
  const warn = isAndroid() ? '' : `\n\n⚠️ _Browser: ${browser}_`;
  return message.reply(`_Auto view once activated ✅_\n_Saving to:_ ${target}${warn}`);
});

// dedupe retries / reconnect redeliveries
const recent = new Set();
const firstTime = (id) => {
  if (recent.has(id)) return false;
  recent.add(id);
  if (recent.size > 2000) recent.delete(recent.values().next().value);
  return true;
};

Function({
  on: 'messages.upsert',
  fromMe: false
}, async (update, match, client) => {
  const target = autovv.get('jid');
  if (!target) return;
  const msg = update.messages?.[0];
  const key = msg?.key;
  if (!key?.id || key.fromMe || key.remoteJid === 'status@broadcast') return;

  const vv = extractViewOnce(msg.message);
  if (!hasContent(vv) || !firstTime(key.id)) return;

  const chat = key.remoteJid;
  const sender = key.participant || chat;
  const info = `_Auto view once_\n_From:_ @${sender.split('@')[0]}\n_Chat:_ ${chat.endsWith('@g.us') ? 'group ' : ''}${chat.split('@')[0]}`;
  try {
    if (vv.type === 'audioMessage') await client.sendMessage(target, { text: info, mentions: [sender] });
    await sendViewOnce(client, target, vv, key, info);
  } catch (e) {
    recent.delete(key.id);
    console.warn(`autovv: could not forward ${key.id} to ${target}: ${e?.message || e}`);
  }
});

module.exports = { extractViewOnce, hasContent };
