// Extract reply/send string literals from Hermit plugins into lib/language/replies/en.json.
// Run from the bot folder after changing replies:  node scripts/i18n-extract.js . lib/language/replies/en.json
// Then add the new keys to ml.json / genz.json (missing keys fall back to English).
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2];
const SKIP = /^(_3e|allplug|calu|mforward|gjid)\.js$/;
const files = [...fs.readdirSync(path.join(ROOT, 'plugins')).map(f => 'plugins/' + f), ...fs.readdirSync(path.join(ROOT, 'lib')).map(f => 'lib/' + f)]
  .filter(f => f.endsWith('.js') && !SKIP.test(path.basename(f)) && f !== 'lib/i18n.js');

const unescape = (s) => s.replace(/\\(u\{[0-9a-f]+\}|u[0-9a-f]{4}|x[0-9a-f]{2}|.)/gis, (_, c) => {
  if (/^u\{/i.test(c)) return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
  if (/^u/i.test(c)) return String.fromCharCode(parseInt(c.slice(1), 16));
  if (/^x/i.test(c)) return String.fromCharCode(parseInt(c.slice(1), 16));
  return { n: '\n', t: '\t', r: '\r', '0': '\0' }[c] ?? c;
});

// read a JS string/template literal starting at i (s[i] is the quote); return {end, parts}
function readLiteral(s, i) {
  const q = s[i]; let j = i + 1, parts = [''], exprs = 0;
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') { parts[parts.length - 1] += s.slice(j, j + 2); j += 2; continue; }
    if (c === q) return { end: j + 1, parts, exprs };
    if (q !== '`' && c === '\n') return null;
    if (q === '`' && c === '$' && s[j + 1] === '{') {
      let depth = 1; j += 2;
      while (j < s.length && depth) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; else if ('\'"`'.includes(s[j])) { const r = readLiteral(s, j); if (!r) return null; j = r.end; continue; } j++; }
      parts.push(''); exprs++; continue;
    }
    parts[parts.length - 1] += c; j++;
  }
  return null;
}

const entries = []; let concat = 0, dynamicOnly = 0;
for (const f of files) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /\.(reply|send)\(\s*/g; let m;
  while ((m = re.exec(s))) {
    const i = m.index + m[0].length;
    if (!'\'"`'.includes(s[i])) continue;
    const lit = readLiteral(s, i);
    if (!lit) continue;
    const after = s.slice(lit.end).match(/^\s*(.)/)?.[1];
    if (after !== ',' && after !== ')') { concat++; continue; }
    // send(x, 'image') etc: only text
    // send(content, type): text only when there is no type, the type is 'text', or an options object
    if (m[1] === 'send' && after === ',') {
      const next = s.slice(lit.end).replace(/^\s*,\s*/, '');
      if (!/^(['"])text\1|^\{/.test(next)) continue;
    }
    const parts = lit.parts.map(unescape);
    let text = parts[0]; for (let k = 1; k < parts.length; k++) text += `{${k}}` + parts[k];
    // nothing to translate: only values and formatting (e.g. "_{1}: {2}_") or a bare URL;
    // such generic templates would also match unrelated messages
    const words = text.replace(/\{\d+\}/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/[^\p{L}]+/gu, '');
    if (words.length < 3) { dynamicOnly++; continue; }
    entries.push({ file: path.basename(f, '.js'), text, vars: lit.exprs });
  }
}
// unique by text, readable keys
const slug = (t) => t.replace(/\{\d+\}/g, ' ').replace(/[^A-Za-z0-9]+/g, ' ').trim().toLowerCase().split(' ').filter(w => !/^(the|a|an|to|is|of|and|for|your|you|this|in|on|be|it)$/.test(w)).slice(0, 4).join('_') || 'msg';
const seen = new Map(), keys = new Set(), catalog = {};
for (const e of entries) {
  if (seen.has(e.text)) continue;
  let base = `${e.file.replace(/[^a-z0-9]/gi, '').toLowerCase()}.${slug(e.text)}`, key = base, n = 2;
  while (keys.has(key)) key = `${base}_${n++}`;
  keys.add(key); seen.set(e.text, key); catalog[key] = e.text;
}
fs.writeFileSync(process.argv[3], JSON.stringify(catalog, null, 2));
console.log('catalog entries:', Object.keys(catalog).length, '| with placeholders:', Object.values(catalog).filter(t => /\{\d+\}/.test(t)).length, '| skipped concatenated:', concat, '| skipped variable-only:', dynamicOnly);
