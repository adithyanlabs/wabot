<div align="center">

# Hermit-MD

A simple, multi-device WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys).

[![Sponsor](https://img.shields.io/badge/Sponsor-mask--sir-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/mask-sir)
![Node](https://img.shields.io/badge/node-%3E%3D22.13-339933?logo=node.js&logoColor=white)
![Version](https://img.shields.io/badge/version-4.4.6-blue)

</div>

---

## Features

- Multi-device login, with an Android companion identity so the bot can receive view-once media
- Sticker tools that keep sticker audio, plus audio, video and image converters
- YouTube, Instagram and remove.bg downloaders and tools
- Group management: warn, antilink, antifake, automute/unmute, greetings and filters
- Bot replies in several languages (`.lang`) that you can edit yourself (`.setreply`)
- Change config from WhatsApp with `.setvar` / `.getvar` on VPS, Koyeb and Render
- External plugins installed with `.plugin <url>`

## Requirements

- **Node.js 22.13 or newer.** The bot uses the built-in `node:sqlite` module.
- **ffmpeg** for stickers, audio and video tools.
- **git** for the `.update` command.

The installer below sets up all three for you if they are missing.

---

## Installation

### 1. One-file installer (Windows, Linux, macOS, Termux)

`install.cmd` installs everything and runs the same way on every platform. It installs Node.js 22 LTS, ffmpeg and git if they're missing. On Windows it puts them in `.runtime/`, so you don't need admin rights. Then it installs the npm packages, creates `config.env` and starts the bot with pm2.

```bash
git clone https://github.com/adithyanlabs/wabot
cd wabot
```

| Platform | Command |
| --- | --- |
| Windows 10/11 | Double-click `install.cmd`, or run `install.cmd` in a terminal |
| Linux / macOS | `sh install.cmd` |
| Termux (Android) | `pkg install git -y`, then `sh install.cmd` |

On first start, you're asked for your WhatsApp number (it becomes `SUDO`). Then **scan the QR code** shown in the terminal with WhatsApp → *Linked devices*.

#### Installer actions

```bash
sh install.cmd            # install if needed, then start (default)
sh install.cmd install    # only install dependencies and create config.env
sh install.cmd restart    # restart the bot
sh install.cmd stop       # stop the bot
sh install.cmd logs       # follow the bot logs
```

On Windows, use `install.cmd <action>`.

> Pressing <kbd>Ctrl</kbd>+<kbd>C</kbd> or closing the window only detaches. The bot keeps running under pm2 until you run `stop`.

### 2. Docker

```bash
docker build -f lib/Dockerfile -t hermit-md .
docker run -d --name hermit-md --env-file config.env -p 3000:3000 hermit-md
```

### 3. Cloud platforms

Set at least `SESSION_ID` on cloud hosts. Use a Postgres `DATABASE_URL` so data survives redeploys.

| Platform | How |
| --- | --- |
| **Heroku** | [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/adithyanlabs/wabot). It uses `app.json` and `heroku.yml`. |
| **Render** | [Deploy with `render.yaml`](https://render.com/deploy?repo=https://github.com/adithyanlabs/wabot). Set `RENDER_API` and `RENDER_NAME` to enable `.setvar` and `.update`. |
| **Koyeb** | Deploy the repo with the Dockerfile. Set `KOYEB_API_KEY` and `KOYEB_APP_NAME` to enable `.setvar` and `.update`. |

### 4. Manual (VPS)

```bash
git clone https://github.com/adithyanlabs/wabot && cd wabot
npm install --omit=dev
echo "VPS=true" > config.env
npm start
```

---

## Configuration

Every setting is read from environment variables, or from a `config.env` file in the bot folder. Each key in `config.env` uses the same name as its environment variable.

```env
# config.env
SUDO=919876543210
PREFIX=.
MODE=private
VPS=true
LOG_MSG=false
ALWAYS_ONLINE=false
```

The most-used settings:

| Key | Default | What it does |
| --- | --- | --- |
| `SESSION_ID` | – | Session to log in with (needed on cloud hosts) |
| `SUDO` | `0,0` | Owner number(s), comma separated |
| `PREFIX` | `^[.,!]` | Command prefix: `.`, `^[.,!]` or `null` for none |
| `MODE` | `private` | `public` or `private` |
| `DATABASE_URL` | `./database.db` | SQLite file, or a `postgres://` URL |
| `VPS` | `false` | Enables `.setvar` / `.getvar` editing of `config.env` |

**Full list with every option, format and example: [Configuration wiki](wiki/Configuration.md)**

### Renamed settings

Old names still work, but please switch to the new ones:

| Old | New |
| --- | --- |
| `SEND_READ` | `READ_COMMAND` |
| `MSG_LOG` | `LOG_MSG` |
| `BLOCKCHAT` | `BLOCK_CHAT` |
| `TERMUX` / `TERMUX_VPS` | `VPS` |
| `RBG_API_KEY` | `REMOVE_BG_API_KEY` |

### Changing settings from WhatsApp

```
.setvar MODE=public     set a value (KEY=VALUE or KEY:VALUE)
.getvar MODE            show one value
.allvar                 show all values
.lang ml                change the bot reply language
```

On a VPS, restart the bot after `.setvar` to apply the change. On Koyeb and Render, `.setvar` updates the service's environment and redeploys it. Use `KEY:VALUE` there, and avoid values that contain `:`.

---

## Wiki

- [Home](wiki/Home.md)
- [Installation](wiki/Installation.md)
- [Configuration](wiki/Configuration.md)

## Sponsor

If this bot is useful to you, please consider supporting development:

<a href="https://github.com/mask-sir"><img src="https://img.shields.io/badge/Sponsor-mask--sir-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor mask-sir"></a>

## Disclaimer

This project is not affiliated with or endorsed by WhatsApp or Meta. Automating a WhatsApp account can get it banned, so use it at your own risk.
