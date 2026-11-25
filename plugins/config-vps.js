const { Function } = require('../lib/')
const fs = require('fs');
const config = require('../config')

const ENV_FILE = 'config.env'
const LINE = /^\s*(?:export\s+)?([\w.-]+)\s*[=:]\s*(.*?)\s*$/

const unquote = v => /^(['"`])([\s\S]*)\1$/.test(v) ? v.slice(1, -1) : v
const quote = v => /[#\s'"]/.test(v) ? JSON.stringify(v) : v

const readLines = () => fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/) : []

// Parse KEY=VALUE / KEY: VALUE lines; only the FIRST separator splits, so values
// containing ':' or '=' (urls, BOT_INFO, ...) are kept intact.
const readVars = () => {
  const vars = {}
  for (const line of readLines()) {
    const m = line.match(LINE)
    if (m) vars[m[1].toUpperCase()] = unquote(m[2])
  }
  return vars
}

const writeVar = (key, value) => {
  const lines = readLines()
  let found = false
  const out = lines.map(line => {
    const m = line.match(LINE)
    if (m && m[1].toUpperCase() === key) {
      found = true
      return `${key}=${quote(value)}`
    }
    return line // keep comments and other vars untouched
  })
  if (!found) {
    if (out.length && out[out.length - 1] === '') out.pop()
    out.push(`${key}=${quote(value)}`)
  }
  fs.writeFileSync(ENV_FILE, out.join('\n') + '\n', 'utf8')
}

if (config.VPS == true) {

Function({
	pattern: 'setvar ?(.*)',
	fromMe: true,
	desc: 'set config var',
	type: 'termux'
}, async (message, match) => {
  const m = (match || '').match(/^\s*([\w.-]+)\s*[=:]\s*([\s\S]*?)\s*$/)
  if (!m) return await message.send('*Invalid format.*\n_Use *KEY:VALUE* or *KEY=VALUE*_')
  const key = m[1].toUpperCase()
  const value = m[2]
  if (!value) return await message.send('Please specify a new value')
  writeVar(key, value)
  require('dotenv').config({ path: './' + ENV_FILE, override: true })
  return await message.send(`_Updated *${key}* with value *${value}* in config.env file_\n_Restart the bot to apply it._`)
})

Function({
	pattern: 'getvar ?(.*)',
	fromMe: true,
	desc: 'get config var',
	type: 'termux'
}, async (message, match) => {
  if (!match) return await message.send('*Please specify a key*')
  const key = match.trim().toUpperCase()
  const value = readVars()[key]
  if (value === undefined) return await message.send(`_Key *${key}* not found in config.env file_`)
  return await message.send(`_${key}:${value}_`)
})

Function({
	pattern: 'allvar',
	fromMe: true,
	desc: 'get all config vars',
	type: 'termux'
}, async (message) => {
  const vars = readVars()
  if (!Object.keys(vars).length) return await message.send('_config.env is empty or missing_')
  const str = Object.entries(vars).map(([k, v]) => `${k} = ${v}`).join('\n')
  return await message.send(`*All config vars:*\n${str}`)
})
}
