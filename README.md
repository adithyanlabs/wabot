#### HERMIT MD WHATSAPP BOT
Hermit-md - Simple whatsapp Multi Device whatsapp bot.

***

### SETUP
1. [![Fork](https://img.shields.io/github/forks/adithyanlabs/hermit-bot?style=social)](https://github.com/adithyanlabs/hermit-bot/fork)
2. Scan the QR or pair and copy it
    <br>
<a href='https://hermit-md.vercel.app/' target="_blank"><img alt='SESSION' src='https://img.shields.io/badge/SESSION-100000?style=for-the-badge&logo=scan&logoColor=white&labelColor=black&color=black'/></a>

---

<!--
### Privacy and Security

- Hermit-MD is an **open-source** bot with **encrypted source code**. We value privacy, and the core functionality is protected from tampering.
- Your session ID, generated via https://hermit-md.vercel.app/session, is **encrypted** with a secret password and stored securely for **24 hours**.  
- The session data is **only accessible by you**. We cannot decrypt it, ensuring full privacy.
- We do **not use Pastebin or any other alternatives** for storing session data. All session data is securely stored in a **PostgreSQL database**, which is fully controlled by us, ensuring your data's security and privacy.
- Once the session is initiated, it is saved on your side in encrypted form, and the bot communicates with the server only for **error reports, updates, and active user counts**.  
- No personal data or decrypted sessions are shared via the WebSocket connection.

---

#### DEPLOY TO RENDER 

1. If You don't have a account in render. Create a account.
    <br>
<a href='https://dashboard.render.com/register' target="_blank"><img alt='render' src='https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=render&logoColor=white'/></a>

3. Get [DATABASE_URL](https://github.com/adithyanlabs/hermit-md/wiki/DATABASE_URL) and copy it

4. Get [Render api key](https://dashboard.render.com/u/settings#api-keys)

2. Now Deploy
    <br>
<a href='https://render.com/deploy?repo=https://github.com/adithyanlabs/hermit-bot' target="_blank"><img alt='DEPLOY' src='https://img.shields.io/badge/-DEPLOY-black?style=for-the-badge&logo=render&logoColor=white'/></a>

#### DEPLOY TO KOYEB 

1. If You don't have a account in koyeb. Create a account.
    <br>
<a href='https://app.koyeb.com/auth/signup' target="_blank"><img alt='koyeb' src='https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=koyeb&logoColor=white'/></a>

3. Create [DATABASE_URL](https://app.koyeb.com/database-services/new) and copy it

4. Get [Koyeb API_KEY](https://app.koyeb.com/settings/api)

2. Now Deploy
    <br>
<a href='https://hermit-md.vercel.app/koyeb' target="_blank"><img alt='DEPLOY' src='https://img.shields.io/badge/-DEPLOY-black?style=for-the-badge&logo=koyeb&logoColor=white'/></a>

-->

#### RUN ON VPS/UBUNTU/WINDOWS

1. Install NodeJs,ffmpeg
2. Installation
   ```
   npm i -global pm2
   git clone https://github.com/adithyanlabs/wabot.git
   cd hermit-bot
   npm install
   ```
3. Configuration
   ```
   echo "VPS = true
     SESSION_ID = null
     AUTH_FILE = session
     SUDO = null
     PREFIX = .
     MODE = private
     LOG_MSG = true" > config.env
   ```
- Start
  ```
  npm start
  ```
- Stop
  ```
  pm2 delete hermit-md
  ```
<br>

For help visit [Github wiki](https://github.com/adithyanlabs/hermit-bot/wiki)

***

[![Join us on Telegram](https://img.shields.io/badge/Join_Telegram-blue?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/hermitmd_official)

<a href="https://whatsapp.com/channel/0029Va4OxFAGk1FjrFvTJa1V"><img alt="WhatsApp" src="https://img.shields.io/badge/-Whatsapp%20Channel-white?style=for-the-badge&logo=whatsapp&logoColor=black"/></a>
