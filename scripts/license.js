#!/usr/bin/env node
// scripts/license.js - author tooling for the ownership/tamper guard (lib/patch/guard.js).
// The private key never ships. Keep it secret; anyone with it can mint licenses and
// sign releases.
//
//   node scripts/license.js keygen              make a key pair (run once)
//   node scripts/license.js issue "<name>" [days]   sign a license token for a deployer
//   node scripts/license.js sign                sign a release (enables the anti-edit check)
//   node scripts/license.js verify <token>      check a token against the baked public key
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const KEY_DIR = path.join(ROOT, 'license');
const PRIV = path.join(KEY_DIR, 'owner.key');            // secret, git-ignored
const MANIFEST = path.join(KEY_DIR, 'manifest.json');
const GUARD = path.join(ROOT, 'lib', 'patch', 'guard.js');

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const die = (m) => { console.error(m); process.exit(1); };

function loadPrivate() {
  if (!fs.existsSync(PRIV)) die('No private key. Run: node scripts/license.js keygen');
  return crypto.createPrivateKey(fs.readFileSync(PRIV, 'utf8'));
}
const sign = (msg, key) => b64url(crypto.sign(null, Buffer.from(msg), key));

function keygen() {
  if (fs.existsSync(PRIV)) die(`A key already exists at ${PRIV}. Delete it first to replace it (old licenses then stop working).`);
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.mkdirSync(KEY_DIR, { recursive: true });
  fs.writeFileSync(PRIV, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  const pub = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  // bake the public key into guard.js so it travels inside the protected source
  const src = fs.readFileSync(GUARD, 'utf8').replace(/const OWNER_PUBLIC_KEY = '[^']*';/, `const OWNER_PUBLIC_KEY = '${pub}';`);
  fs.writeFileSync(GUARD, src);
  console.log(`Private key saved to ${PRIV} (keep it SECRET, it is git-ignored).`);
  console.log('Public key baked into lib/patch/guard.js.');
  console.log('\nNext: issue a license for yourself and set it as LICENSE, e.g.');
  console.log('  node scripts/license.js issue "owner" > license.key');
}

function issue(name, days) {
  if (!name) die('Usage: node scripts/license.js issue "<name>" [days]');
  const key = loadPrivate();
  const payload = { owner: 'adithyanlabs', name, iat: Date.now() };
  if (days) payload.exp = Date.now() + Number(days) * 86400000;
  const part = b64url(JSON.stringify(payload));
  const token = `${part}.${sign(part, key)}`;
  console.error(`License for "${name}"${days ? ` (expires in ${days} days)` : ''}:`);
  console.log(token); // stdout, so `> license.key` captures just the token
}

function signRelease() {
  const key = loadPrivate();
  const { coreFiles } = require(GUARD);
  const files = {};
  for (const rel of coreFiles()) files[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
  const canonical = JSON.stringify(files, Object.keys(files).sort());
  fs.mkdirSync(KEY_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify({ files, sig: sign(canonical, key) }, null, 2) + '\n');
  console.log(`Signed ${Object.keys(files).length} core files -> ${path.relative(ROOT, MANIFEST)}`);
  console.log('Commit this manifest. Re-run after every legitimate edit to core files.');
}

function verifyToken(token) {
  const { OWNER_PUBLIC_KEY } = require(GUARD);
  if (!OWNER_PUBLIC_KEY) die('No public key baked in guard.js yet. Run keygen first.');
  if (!token) die('Usage: node scripts/license.js verify <token>');
  const pub = crypto.createPublicKey({ key: Buffer.from(OWNER_PUBLIC_KEY, 'base64'), format: 'der', type: 'spki' });
  const [p, s] = token.split('.');
  const ok = p && s && crypto.verify(null, Buffer.from(p), pub, Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  console.log(ok ? 'VALID: ' + Buffer.from(p, 'base64').toString() : 'INVALID');
}

const [cmd, ...args] = process.argv.slice(2);
({ keygen, issue: () => issue(args[0], args[1]), sign: signRelease, verify: () => verifyToken(args[0]) }[cmd] || (() => die('Commands: keygen | issue "<name>" [days] | sign | verify <token>')))();
