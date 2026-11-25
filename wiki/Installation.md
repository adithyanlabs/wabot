# Installation

## Requirements

| Tool | Why | Installed by `install.cmd`? |
| --- | --- | --- |
| Node.js **≥ 22.13** | Runs the bot; needs the built-in `node:sqlite` | Yes (Node 22 LTS) |
| ffmpeg | Stickers, audio and video tools | Yes |
| git | `.update` command | Yes |

---

## One-file installer: `install.cmd`

One file works on every platform. On Windows it runs as a batch/PowerShell script. On Linux, macOS and Termux it runs as a POSIX shell script.

```bash
git clone https://github.com/adithyanlabs/wabot
cd wabot
```

| Platform | Run |
| --- | --- |
| Windows 10/11 | Double-click `install.cmd`, or `install.cmd [action]` |
| Linux / macOS | `sh install.cmd [action]` |
| Termux | `pkg install git -y && sh install.cmd [action]` |

### What it does

1. **Node.js**: if `node` is missing or older than 22.13, it installs Node 22 LTS.
   - Windows: a portable copy in `.runtime\node`. No admin rights needed, and the checksum is verified.
   - Linux: uses your package manager (`apt`, `dnf`, `yum`, `pacman`, `zypper` or `apk`). If that doesn't work, it downloads the official tarball into `.runtime/node`, picking a musl or old-glibc build when needed.
   - macOS: Homebrew `node@22`, or the official tarball.
   - Termux: `pkg install nodejs`.
2. **ffmpeg** and **git**: installed if missing. On Windows they are portable copies in `.runtime`.
3. **npm packages**: `npm install --omit=dev`. This only reruns when `package.json` changes. If it fails, it retries with `--ignore-scripts` (for example on Termux, where `sharp` has no build).
4. **config.env**: on first run it creates `PREFIX=.`, `VPS=true` and asks for your number (`SUDO`).
5. **Start**: runs the bot under pm2 as `hermit-md`. On Termux it also takes a wake lock so Android doesn't kill the bot.

### Actions

| Action | What it does |
| --- | --- |
| `start` *(default)* | Install if needed, create config, start the bot |
| `install` | Install dependencies and create config only |
| `restart` | Restart the bot |
| `stop` | Stop the bot |
| `logs` | Follow the pm2 logs |

Closing the window or pressing Ctrl+C only detaches. Use `stop` to really stop the bot.

### Logging in

On first start, a QR code is printed in the terminal. Open WhatsApp → **Settings → Linked devices → Link a device** and scan it. The login is saved in `session/`, which git ignores.

> Linking always uses the Chrome identity. Once linked, the bot switches to the Android companion identity so it can receive view-once media. See `WA_BROWSER` in [Configuration](Configuration.md).

---

## Docker

```bash
docker build -f lib/Dockerfile -t hermit-md .
docker run -d --name hermit-md --env-file config.env -p 3000:3000 hermit-md
```

The image is based on `quay.io/hermit/hermit-ser` and runs `pm2-runtime ecosystem.config.js`.

---

## Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/adithyanlabs/wabot)

It uses `app.json` (the env var form and a Postgres add-on) and `heroku.yml` (Docker build). Fill in `SESSION_ID`, `SUDO` and `BOT_INFO`.

## Render

[Deploy to Render](https://render.com/deploy?repo=https://github.com/adithyanlabs/wabot) with `render.yaml`.

Required: `SESSION_ID`, `DATABASE_URL` (Postgres), `RENDER_API` (your Render API key) and `RENDER_NAME` (the service name). With the last two set, `.setvar`, `.getvar`, `.delvar`, `.allvar`, `.restart` and `.update` work from WhatsApp.

## Koyeb

Deploy the repository with the Dockerfile, then set `SESSION_ID`, `DATABASE_URL`, `KOYEB_API_KEY` and `KOYEB_APP_NAME`. These enable `.setvar`, `.getvar`, `.delvar`, `.allvar` and `.update`.

## Manual VPS

```bash
git clone https://github.com/adithyanlabs/wabot && cd wabot
npm install --omit=dev
printf 'VPS=true\nSUDO=919876543210\n' > config.env
npm start        # pm2 start . --attach --name hermit-md
```

---

## Updating

From WhatsApp: `.update` checks for new commits, and `.update now` applies them. On Koyeb and Render this redeploys the service.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `require('node:sqlite')` error | Node is too old. Install Node ≥ 22.13, or rerun `install.cmd` |
| Stickers or audio don't work | ffmpeg is missing. Rerun `install.cmd` or install ffmpeg |
| `.setvar` does nothing on a VPS | Set `VPS=true` in `config.env`, then restart |
| `.update` fails | git is missing, or the folder isn't a git clone |
| Logged out / QR every start | Delete `session/` and scan again |
