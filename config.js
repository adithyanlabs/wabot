// config.js
// Every setting is exported under the SAME name as the env var / config.env key
// that sets it (e.g. LOG_MSG -> config.LOG_MSG). Old internal names are kept as
// hidden aliases at the bottom so existing and external plugins keep working.
const fs = require('fs');

if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env', override: true });

const env = process.env;
const toBool = (x, dflt = false) => (x === undefined || x === '' ? dflt : String(x).trim().toLowerCase() === 'true');
process.env.NODE_OPTIONS = '--max_old_space_size=2560';

/* ---------- prefix ----------
 * PREFIX env var examples: "."  ","  "^[.,!]" (any of . , !)  "null"/"false" (no prefix)
 *   PREFIX   -> the prefix shown in messages/menus, e.g. "."
 *   HANDLERS -> regex source that command patterns are built from
 */
// Termux sets PREFIX=/data/data/com.termux/files/usr for itself; never treat that as the bot prefix.
const PREFIX_ENV = /^\/.*com\.termux/.test(env.PREFIX || '') ? '' : env.PREFIX;
const PREFIX_RAW = (PREFIX_ENV || '^[.,!]').trim();
const NO_PREFIX = PREFIX_RAW === 'null' || PREFIX_RAW === 'false';
const prefixSrc = NO_PREFIX ? '' : PREFIX_RAW;
const HANDLERS = !prefixSrc.startsWith('^') && prefixSrc !== ''
  ? prefixSrc.replace('[', '').replace(']', '').replace(/\./g, '[.]')
  : /\p{Emoji_Presentation}/u.test(prefixSrc) ? '^[.]' : prefixSrc;
const PREFIX = NO_PREFIX ? ''
  : PREFIX_RAW.startsWith('^') ? (PREFIX_RAW.match(/\[(\W*)\]/)?.[1]?.[0] ?? PREFIX_RAW)
  : PREFIX_RAW.replace(/[\[\]]/g, '').trim();

let VERSION = 'v4.4.6';
try { VERSION = 'v' + require('./package.json').version; } catch {}

const config = {
  VERSION,
  SESSION_ID: env.SESSION_ID || '',
  AUTH_FILE: env.AUTH_FILE || false,
  DATABASE_URL: env.DATABASE_URL || './database.db', // postgres://... uses Postgres, anything else is a SQLite file
  MODE: (env.MODE || 'private').toLowerCase(),       // 'public' | 'private'
  SUDO: env.SUDO || '0,0',

  PREFIX,
  PREFIX_RAW,
  HANDLERS,

  READ_COMMAND: toBool(env.READ_COMMAND),     // mark command messages as read
  READ_MSG: toBool(env.READ_MSG),             // mark every message as read
  LOG_MSG: toBool(env.LOG_MSG),               // print incoming messages to the console
  BLOCK_CHAT: env.BLOCK_CHAT || false,        // comma separated numbers/group ids to ignore
  ALWAYS_ONLINE: toBool(env.ALWAYS_ONLINE),
  REJECT_CALL: toBool(env.REJECT_CALL),
  AUTO_STATUS_VIEW: toBool(env.AUTO_STATUS_VIEW),
  // 'android' (default): log in as an Android companion, the only identity WhatsApp sends
  // view-once media to. Linking a new device always uses Chrome (WhatsApp rejects an
  // Android companion during pairing), then switches to Android once linked.
  // 'chrome': always use the normal web identity.
  WA_BROWSER: ['chrome', 'web', 'browser'].includes(String(env.WA_BROWSER || '').trim().toLowerCase()) ? 'chrome' : 'android',
  START_MSG: toBool(env.START_MSG, true),     // also sends offline-sync started/finished notices
  // false (default): answer new messages immediately while the offline backlog syncs in the
  // background. true: Baileys default, nothing is handled until the backlog is finished.
  WAIT_OFFLINE_SYNC: toBool(env.WAIT_OFFLINE_SYNC),
  ERROR_MESSAGE: toBool(env.ERROR_MESSAGE, true),
  // Not read from env: the system LANG variable (e.g. en_US.UTF-8) would clash, and only EN exists.
  LANG: 'EN',

  BOT_INFO: env.BOT_INFO || 'ʜᴇʀᴍɪᴛ;ᴀᴅɪᴛʜyᴀɴ;972528277755;https://i.imgur.com/6oRG106.jpeg',
  AUDIO_DATA: env.AUDIO_DATA || 'ʜᴇʀᴍɪᴛ;ᴀᴅɪᴛʜyᴀɴ;https://i.imgur.com/fj2WE83.jpeg',
  STICKER_DATA: env.STICKER_DATA || 'ʜᴇʀᴍɪᴛ;ᴀᴅɪᴛʜyᴀɴ',
  AUTOMUTE_MSG: env.AUTOMUTE_MSG || '_Group automuted!_\n_(Change this by setting var AUTOMUTE_MSG)_',
  AUTOUNMUTE_MSG: env.AUTOUNMUTE_MSG || '_Group autounmuted!_\n_(Change this by setting var AUTOUNMUTE_MSG)_',
  ANTILINK_MSG: env.ANTILINK_MSG || '_Link Not Allowed!_\n_(Change this by setting var ANTILINK_MSG)_',
  WARN: parseInt(env.WARN, 10) || 4,

  VPS: toBool(env.VPS || env.TERMUX),         // enables config.env based setvar/getvar
  KOYEB_API_KEY: env.KOYEB_API_KEY || false,
  KOYEB_APP_NAME: env.KOYEB_APP_NAME || '',
  RENDER_API: env.RENDER_API || false,
  RENDER_NAME: env.RENDER_NAME || '',
  REMOVE_BG_API_KEY: env.REMOVE_BG_API_KEY || false,
};

// Old names -> new names. Non-enumerable so they don't show up when listing config.
const ALIASES = {
  SEND_READ: 'READ_COMMAND',
  MSG_LOG: 'LOG_MSG',
  BLOCKCHAT: 'BLOCK_CHAT',
  TERMUX_VPS: 'VPS',
  RBG_API_KEY: 'REMOVE_BG_API_KEY',
};
for (const [oldName, newName] of Object.entries(ALIASES)) {
  Object.defineProperty(config, oldName, {
    enumerable: false,
    get: () => config[newName],
    set: v => { config[newName] = v; },
  });
}

module.exports = config;
