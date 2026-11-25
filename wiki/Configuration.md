# Configuration

Hermit-MD reads every setting from **environment variables**. On a VPS, Termux or Windows it also reads a **`config.env`** file in the bot folder.

- Each key in `config.env` is named exactly like its environment variable. In code, it's also available under that name, e.g. `LOG_MSG` → `config.LOG_MSG`.
- `config.env` overrides variables already set in the environment.
- Boolean settings are on only when the value is `true` (any case). Everything else, including empty, is `false` unless a different default is listed.
- Changes take effect after a restart.

```env
# config.env example
SESSION_ID=
SUDO=919876543210,919812345678
PREFIX=.
MODE=private
VPS=true
DATABASE_URL=./database.db
BOT_INFO=Hermit;Adithyan;919876543210;https://i.imgur.com/6oRG106.jpeg
LOG_MSG=false
ALWAYS_ONLINE=false
REJECT_CALL=false
```

---

## Core

| Key | Default | Description |
| --- | --- | --- |
| `SESSION_ID` | *(empty)* | Session used to log in. Needed on cloud hosts. Locally you can scan the QR code instead. |
| `AUTH_FILE` | `false` | Optional auth file path. |
| `DATABASE_URL` | `./database.db` | A `postgres://…` URL uses PostgreSQL. Anything else is treated as an SQLite file path. Use Postgres on cloud hosts so data survives redeploys. |
| `MODE` | `private` | `public`: everyone can use commands. `private`: only you and `SUDO` users can. |
| `SUDO` | `0,0` | Owner/admin numbers with country code and no `+`, comma separated. The **first** number receives error reports and view-once forwards. |

## Prefix

| Key | Default | Description |
| --- | --- | --- |
| `PREFIX` | `^[.,!]` | Command prefix. See the formats below. |

| Value | Meaning |
| --- | --- |
| `.` | A single prefix (`.menu`) |
| `,` | A single prefix (`,menu`) |
| `^[.,!]` | Any of `.`, `,` or `!` |
| `null` or `false` | No prefix: just type `menu` |

> On Termux, the system sets `PREFIX=/data/data/com.termux/files/usr`. The bot detects this and ignores it, so put your prefix in `config.env`.

## Behaviour

| Key | Default | Description |
| --- | --- | --- |
| `READ_COMMAND` | `false` | Mark command messages as read |
| `READ_MSG` | `false` | Mark **every** incoming message as read |
| `LOG_MSG` | `false` | Print incoming messages in the console |
| `BLOCK_CHAT` | `false` | Comma-separated numbers or group IDs the bot ignores |
| `ALWAYS_ONLINE` | `false` | Always show the bot as online |
| `REJECT_CALL` | `false` | Automatically reject incoming calls |
| `AUTO_STATUS_VIEW` | `false` | Automatically view contacts' statuses |
| `START_MSG` | `true` | Send a "bot started" message, plus offline-sync started and finished notices |
| `WAIT_OFFLINE_SYNC` | `false` | `false`: answer new messages right away while the offline backlog syncs in the background. `true`: Baileys' default, where nothing is handled until the backlog has finished. |
| `ERROR_MESSAGE` | `true` | Send error reports to the first `SUDO` number |
| `WA_BROWSER` | `android` | `android`: log in as an Android companion, the only identity WhatsApp sends view-once media to. `chrome`: always use the normal web identity. New devices are always linked as Chrome, then switch to Android. |
| `WARN` | `4` | Number of warnings before `.warn` removes a user |

## Branding

Fields are separated by `;`.

| Key | Format | Default |
| --- | --- | --- |
| `BOT_INFO` | `botname;ownername;ownernumber;imageurl` | `ʜᴇʀᴍɪᴛ;ᴀᴅɪᴛʜyᴀɴ;972528277755;https://i.imgur.com/6oRG106.jpeg` |
| `AUDIO_DATA` | `title;artist;coverimageurl` | `ʜᴇʀᴍɪᴛ;ᴀᴅɪᴛʜyᴀɴ;https://i.imgur.com/fj2WE83.jpeg` |
| `STICKER_DATA` | `packname;author` | `ʜᴇʀᴍɪᴛ;ᴀᴅɪᴛʜyᴀɴ` |

## Group messages

| Key | Default |
| --- | --- |
| `AUTOMUTE_MSG` | `_Group automuted!_` |
| `AUTOUNMUTE_MSG` | `_Group autounmuted!_` |
| `ANTILINK_MSG` | `_Link Not Allowed!_` |

## Platform

| Key | Default | Description |
| --- | --- | --- |
| `VPS` | `false` | Enables `.setvar`, `.getvar` and `.allvar`, which edit `config.env`. `TERMUX=true` also works. `install.cmd` sets this for you. |
| `KOYEB_API_KEY` | `false` | Koyeb API token. Enables the Koyeb `.setvar`, `.getvar`, `.delvar` and `.allvar` commands, plus `.update` redeploys. |
| `KOYEB_APP_NAME` | *(empty)* | Koyeb service name |
| `RENDER_API` | `false` | Render API key. Enables the Render var commands, `.restart` and `.update` redeploys. |
| `RENDER_NAME` | *(empty)* | Render service name |

## API keys

| Key | Default | Description |
| --- | --- | --- |
| `REMOVE_BG_API_KEY` | `false` | API key from [remove.bg](https://www.remove.bg/api) for the `.rmbg` command |

## Not configurable

| Setting | Why |
| --- | --- |
| `LANG` | Always `EN`. It isn't read from the environment because the system `LANG` (e.g. `en_US.UTF-8`) would clash with it. Use `.lang` to change the **reply** language instead. |
| `VERSION` | Read from `package.json` |

---

## Renamed variables

Old names still work as hidden aliases, but new setups should use the new names.

| Old name | New name |
| --- | --- |
| `SEND_READ` | `READ_COMMAND` |
| `MSG_LOG` | `LOG_MSG` |
| `BLOCKCHAT` | `BLOCK_CHAT` |
| `TERMUX_VPS` / `TERMUX` | `VPS` |
| `RBG_API_KEY` | `REMOVE_BG_API_KEY` |

---

## Changing config from WhatsApp

### VPS / Termux / Windows (`VPS=true`)

```
.setvar KEY=VALUE      or  .setvar KEY:VALUE
.getvar KEY
.allvar
```

- Values may contain `:` and `=` (URLs, `BOT_INFO`). Only the first separator splits the key from the value.
- Values with spaces, `#` or quotes are quoted automatically in `config.env`.
- Comments and other lines in `config.env` are kept.
- **Restart the bot** to apply the change: `sh install.cmd restart`.

### Koyeb / Render

```
.setvar KEY:VALUE
.getvar KEY
.delvar KEY
.allvar
```

These commands change the service's environment variables through the platform API and redeploy it. Use the `KEY:VALUE` form, and avoid values that contain `:`, because the value is cut off at the next `:`.

---

## Reply language

The bot's own replies can be translated and edited:

| Command | Description |
| --- | --- |
| `.lang` | List the available languages |
| `.lang ml` | Switch the reply language (`en`, `ml`, `genz`, or `custom`) |
| `.replies <word>` | Search the reply keys |
| `.getreply <key>` | Show a reply |
| `.setreply <key> <text>` | Change a reply. This switches to the `custom` language. |
| `.delreply <key>` | Reset a reply to its default |

Translations are stored in `lib/language/replies/*.json`. Any key missing from a language falls back to English.
