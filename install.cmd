:<<'::BATCH_END'
@echo off
rem ======================================================================
rem  Hermit-MD installer / launcher - ONE file for every platform.
rem    Windows 10/11 : double-click install.cmd   (or: install.cmd [action])
rem    Linux / macOS : sh install.cmd [action]
rem    Termux        : sh install.cmd [action]
rem  Actions: start (default) | install | stop | restart | logs
rem  Installs Node.js 22 LTS, ffmpeg and git when missing (into .runtime\
rem  without admin rights if needed), the npm packages, then runs the bot
rem  with pm2.
rem  The Windows part below hands over to the PowerShell code further down
rem  in this file; Unix shells skip all of it (it is inside a heredoc).
rem ======================================================================
setlocal
cd /d "%~dp0"
set "HERMIT_SELF=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText($env:HERMIT_SELF); $b='#__PS'+'_BEGIN__'; $e='#__PS'+'_END__'; $i=$s.IndexOf($b); $j=$s.IndexOf($e); & ([ScriptBlock]::Create($s.Substring($i, $j - $i))) %*"
set "HERMIT_RC=%errorlevel%"
if not "%HERMIT_RC%"=="0" (echo. & echo Setup failed with code %HERMIT_RC%. See the messages above. & pause)
exit /b %HERMIT_RC%

#__PS_BEGIN__
# 'Continue': under 'Stop', Windows PowerShell 5.1 turns any stderr output of a native
# program (npm warnings, node) into a fatal error. Cmdlets that matter use -ErrorAction Stop.
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

$Action = if ($args.Count -gt 0) { "$($args[0])".ToLower() } else { 'start' }
$Root = Split-Path -Parent $env:HERMIT_SELF
Set-Location $Root
$Rt = Join-Path $Root '.runtime'
$NodeLine = 22
New-Item -ItemType Directory -Force -Path $Rt | Out-Null

function Say($m)  { Write-Host "==> $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[!] $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "[x] $m" -ForegroundColor Red; exit 1 }
function Have($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }

# tools we download go first on PATH (also inherited by pm2 and the bot)
$env:Path = "$Rt\node;$Rt\ffmpeg;$Rt\git\cmd;$env:Path"
$env:PIDUSAGE_SILENT = 'true'

$arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
$nodeArch = switch ($arch) { 'AMD64' { 'x64' } 'ARM64' { 'arm64' } 'x86' { 'x86' } default { 'x64' } }

function Download($url, $out) {
  Say "Downloading $url"
  for ($i = 1; $i -le 3; $i++) {
    try { Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $out -ErrorAction Stop; return } catch { if ($i -eq 3) { throw } ; Start-Sleep 3 }
  }
}
function Expand($zip, $dest) {
  if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
  Expand-Archive -Path $zip -DestinationPath $dest -Force -ErrorAction Stop
}

function Test-Node {
  if (-not (Have 'node')) { return $false }
  & node -e "require('node:sqlite')" 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Install-Node {
  $base = "https://nodejs.org/dist/latest-v$NodeLine.x"
  try { $sums = (Invoke-WebRequest -UseBasicParsing "$base/SHASUMS256.txt" -ErrorAction Stop).Content } catch { Die "Could not reach nodejs.org: $_" }
  $m = [regex]::Match($sums, "([0-9a-f]{64})\s+(node-v[\d.]+-win-$nodeArch\.zip)")
  if (-not $m.Success) { Die "No Node.js build for Windows $nodeArch" }
  $zip = Join-Path $Rt $m.Groups[2].Value
  try { Download "$base/$($m.Groups[2].Value)" $zip } catch { Die "Node.js download failed: $_" }
  if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLower() -ne $m.Groups[1].Value) { Remove-Item $zip; Die 'Node.js download is corrupted (checksum mismatch). Run again.' }
  $tmp = Join-Path $Rt 'node-tmp'
  try { Expand $zip $tmp } catch { Die "Could not extract Node.js: $_" }
  if (Test-Path "$Rt\node") { Remove-Item -Recurse -Force "$Rt\node" }
  Move-Item (Get-ChildItem $tmp -Directory | Select-Object -First 1).FullName "$Rt\node" -ErrorAction Stop
  Remove-Item -Recurse -Force $tmp, $zip
}

function Install-FFmpeg {
  # gyan.dev essentials build (x64; runs on Windows 11 ARM through emulation)
  $url = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
  $zip = Join-Path $Rt 'ffmpeg.zip'
  Download $url $zip
  try {
    $want = ((Invoke-WebRequest -UseBasicParsing "$url.sha256" -ErrorAction Stop).Content -split '\s+')[0].Trim().ToLower()
    if ($want -and (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower() -ne $want) { Remove-Item $zip; throw 'ffmpeg checksum mismatch' }
  } catch { if ("$_" -like '*mismatch*') { throw } }
  $tmp = Join-Path $Rt 'ffmpeg-tmp'
  Expand $zip $tmp
  New-Item -ItemType Directory -Force -Path "$Rt\ffmpeg" | Out-Null
  Get-ChildItem $tmp -Recurse -Include 'ffmpeg.exe', 'ffprobe.exe' | Copy-Item -Destination "$Rt\ffmpeg" -Force
  Remove-Item -Recurse -Force $tmp, $zip
}

function Install-Git {
  # portable MinGit from the official git-for-windows release
  $suffix = switch ($nodeArch) { 'arm64' { 'arm64' } 'x86' { '32-bit' } default { '64-bit' } }
  $rel = Invoke-RestMethod -UseBasicParsing 'https://api.github.com/repos/git-for-windows/git/releases/latest' -ErrorAction Stop
  $asset = $rel.assets | Where-Object { $_.name -match "^MinGit-[\d.]+-$suffix\.zip$" } | Select-Object -First 1
  if (-not $asset) { throw "no MinGit build for $suffix" }
  $zip = Join-Path $Rt 'mingit.zip'
  Download $asset.browser_download_url $zip
  Expand $zip "$Rt\git"
  Remove-Item $zip
}

function Get-Pm2 { Join-Path $Root 'node_modules\.bin\pm2.cmd' }

function Ensure-Deps {
  if (-not (Test-Node)) {
    Say "Installing Node.js $NodeLine LTS (portable, no admin needed)..."
    Install-Node
    if (-not (Test-Node)) { Die 'Node.js was installed but does not work.' }
  }
  Say "Node.js $(& node -v)"

  if (-not (Have 'ffmpeg')) {
    Say 'Installing ffmpeg (needed for stickers, audio and video tools)...'
    try { Install-FFmpeg } catch { Warn "ffmpeg could not be installed: $_ . Stickers/audio tools will not work." }
  }
  if (-not (Have 'git')) {
    Say 'Installing git (needed for .update)...'
    try { Install-Git } catch { Warn "git could not be installed: $_ . The .update command will not work." }
  }

  # reinstall npm packages only when package.json changed
  $hashFile = Join-Path $Rt 'deps.sha256'
  $hash = (Get-FileHash (Join-Path $Root 'package.json') -Algorithm SHA256).Hash
  $old = if (Test-Path $hashFile) { (Get-Content $hashFile -Raw).Trim() } else { '' }
  if ($hash -ne $old -or -not (Test-Path (Get-Pm2))) {
    Say 'Installing npm packages (first run takes a few minutes)...'
    & npm install --omit=dev --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
      Warn 'npm install failed, retrying without install scripts...'
      & npm install --omit=dev --no-audit --no-fund --ignore-scripts
      if ($LASTEXITCODE -ne 0) { Die 'npm install failed. Check your internet connection and run again.' }
    }
    Set-Content -Path $hashFile -Value $hash
  }
}

function Ensure-Config {
  $cfg = Join-Path $Root 'config.env'
  if (Test-Path $cfg) { return }
  Say 'Creating config.env'
  $num = ''
  try { $num = Read-Host 'Your WhatsApp number with country code (owner), e.g. 919876543210 [Enter to skip]' } catch {}
  $num = ($num -replace '[^0-9]', '')
  $lines = @('# created by install.cmd - edit and restart to apply', 'PREFIX=.', 'VPS=true')
  if ($num) { $lines += "SUDO=$num" }
  [IO.File]::WriteAllText($cfg, (($lines -join "`n") + "`n"))
}

function Start-Bot {
  $pm2 = Get-Pm2
  if (-not (Test-Path $pm2)) { Die 'pm2 is missing; run: install.cmd install' }
  $nodeExe = (Get-Command node).Source
  & $pm2 delete hermit-md 2>$null | Out-Null
  Say 'Starting Hermit-MD (scan the QR code below if this is the first login)'
  Write-Host '    Close this window or press Ctrl+C to detach; the bot keeps running.' -ForegroundColor DarkGray
  Write-Host '    Stop it with: install.cmd stop    View logs: install.cmd logs' -ForegroundColor DarkGray
  & $pm2 start index.js --name hermit-md --cwd $Root --interpreter $nodeExe --attach
}

switch ($Action) {
  'install' { Ensure-Deps; Ensure-Config; Say 'Done. Start the bot with: install.cmd' }
  'start'   { Ensure-Deps; Ensure-Config; Start-Bot }
  'restart' { Ensure-Deps; Start-Bot }
  'stop'    { $pm2 = Get-Pm2; if (Test-Path $pm2) { & $pm2 delete hermit-md } ; Say 'Stopped.' }
  'logs'    { & (Get-Pm2) logs hermit-md }
  default   { Die "Unknown action '$Action'. Use: start | install | stop | restart | logs" }
}
exit 0
#__PS_END__
::BATCH_END
# ======================================================================
#  Linux / macOS / Termux part (POSIX sh). Windows never reaches this.
# ======================================================================
NODE_LINE=22
ACTION=${1:-start}
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1
cd "$ROOT" || exit 1
RT="$ROOT/.runtime"
mkdir -p "$RT"
PATH="$RT/node/bin:$RT/ffmpeg:$PATH"
export PATH
PIDUSAGE_SILENT=true
export PIDUSAGE_SILENT

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

OS=$(uname -s)
ARCH=$(uname -m)
IS_TERMUX=0
[ -n "${TERMUX_VERSION:-}" ] && IS_TERMUX=1
case "${PREFIX:-}" in *com.termux*) IS_TERMUX=1 ;; esac

# root helper for system packages (not used on Termux / Homebrew)
SUDO=""
if [ "$IS_TERMUX" = 0 ] && [ "$OS" != Darwin ] && [ "$(id -u)" != 0 ]; then
  if have sudo; then SUDO=sudo; elif have doas; then SUDO=doas; fi
fi

PM=""
if [ "$IS_TERMUX" = 1 ]; then PM=pkg
elif [ "$OS" = Darwin ]; then have brew && PM=brew
else
  for p in apt-get dnf yum pacman zypper apk; do
    if have "$p"; then PM=$p; break; fi
  done
fi

APT_UPDATED=0
pm_install() {
  [ -n "$PM" ] || return 1
  case $PM in
    pkg)     pkg install -y "$@" || { pkg update -y && pkg install -y "$@"; } ;;
    brew)    brew install "$@" ;;
    apt-get) if [ "$APT_UPDATED" = 0 ]; then $SUDO apt-get update -y || true; APT_UPDATED=1; fi
             $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "$@" ;;
    dnf)     $SUDO dnf install -y "$@" ;;
    yum)     $SUDO yum install -y "$@" ;;
    pacman)  $SUDO pacman -Sy --noconfirm --needed "$@" ;;
    zypper)  $SUDO zypper -n install "$@" ;;
    apk)     $SUDO apk add --no-cache "$@" ;;
    *)       return 1 ;;
  esac
}

fetch() { # url outfile
  say "Downloading $1"
  if have curl; then curl -fL --retry 3 -o "$2" "$1"
  elif have wget; then wget -O "$2" "$1"
  else return 1; fi
}
fetch_text() { if have curl; then curl -fsSL "$1"; else wget -qO- "$1"; fi; }
sha256_of() {
  if have sha256sum; then sha256sum "$1" | cut -d' ' -f1
  elif have shasum; then shasum -a 256 "$1" | cut -d' ' -f1
  else echo ""; fi
}

node_ok() { have node && node -e "require('node:sqlite')" >/dev/null 2>&1; }

install_node_tarball() {
  case $ARCH in
    x86_64|amd64)  A=x64 ;;
    aarch64|arm64) A=arm64 ;;
    armv7l|armv8l) A=armv7l ;;
    ppc64le)       A=ppc64le ;;
    s390x)         A=s390x ;;
    *) die "No Node.js $NODE_LINE build for CPU '$ARCH'. Install Node.js >= 22.13 manually and run again." ;;
  esac
  BASE="https://nodejs.org/dist/latest-v$NODE_LINE.x"
  if [ "$OS" = Darwin ]; then PLAT=darwin-$A
  else
    PLAT=linux-$A
    GLIBC=$(getconf GNU_LIBC_VERSION 2>/dev/null | awk '{print $2}')
    if [ -z "$GLIBC" ] && { ldd --version 2>&1 | grep -qi musl || ls /lib/ld-musl-* >/dev/null 2>&1; }; then
      [ "$A" = x64 ] || die "No musl Node.js build for $ARCH. Install nodejs >= 22.13 with your package manager."
      SUFFIX=-musl
    elif [ -n "$GLIBC" ] && [ "$(printf '%s\n' "$GLIBC" 2.28 | sort -t. -k1,1n -k2,2n | head -n1)" != 2.28 ]; then
      # glibc older than 2.28 (e.g. CentOS 7, Ubuntu 18.04): official builds need 2.28
      [ "$A" = x64 ] || die "glibc $GLIBC is too old for Node.js $NODE_LINE on $ARCH."
      SUFFIX=-glibc-217
    fi
  fi
  SUMS=$(fetch_text "$BASE/SHASUMS256.txt") || die "Could not reach nodejs.org"
  VER=$(printf '%s\n' "$SUMS" | grep -o "node-v[0-9.]*-$PLAT\.tar\.gz" | head -n1 | sed 's/^node-\(v[0-9.]*\)-.*/\1/')
  [ -n "$VER" ] || die "No Node.js build found for $PLAT"
  if [ -n "${SUFFIX:-}" ]; then
    BASE="https://unofficial-builds.nodejs.org/download/release/$VER"
    SUMS=$(fetch_text "$BASE/SHASUMS256.txt") || die "Could not reach unofficial-builds.nodejs.org"
  fi
  FILE="node-$VER-$PLAT${SUFFIX:-}.tar.gz"
  WANT=$(printf '%s\n' "$SUMS" | awk -v f="$FILE" '$2==f {print $1}')
  fetch "$BASE/$FILE" "$RT/$FILE" || die "Node.js download failed"
  GOT=$(sha256_of "$RT/$FILE")
  if [ -n "$WANT" ] && [ -n "$GOT" ] && [ "$WANT" != "$GOT" ]; then rm -f "$RT/$FILE"; die "Node.js download is corrupted (checksum mismatch). Run again."; fi
  rm -rf "$RT/node" "$RT/node-tmp" && mkdir -p "$RT/node-tmp"
  tar -xzf "$RT/$FILE" -C "$RT/node-tmp" || die "Could not extract Node.js"
  mv "$RT/node-tmp"/node-* "$RT/node" && rm -rf "$RT/node-tmp" "$RT/$FILE"
}

install_ffmpeg_static() {
  mkdir -p "$RT/ffmpeg"
  if [ "$OS" = Darwin ]; then
    fetch "https://evermeet.cx/ffmpeg/getrelease/zip" "$RT/ffmpeg.zip" || return 1
    (cd "$RT/ffmpeg" && unzip -o -q ../ffmpeg.zip) || return 1
    rm -f "$RT/ffmpeg.zip"
  else
    case $ARCH in x86_64|amd64) F=amd64 ;; aarch64|arm64) F=arm64 ;; armv7l|armv8l) F=armhf ;; i?86) F=i686 ;; *) return 1 ;; esac
    fetch "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-$F-static.tar.xz" "$RT/ffmpeg.tar.xz" || return 1
    tar -xJf "$RT/ffmpeg.tar.xz" -C "$RT" || return 1
    for d in "$RT"/ffmpeg-*-static; do cp "$d/ffmpeg" "$d/ffprobe" "$RT/ffmpeg/" 2>/dev/null; rm -rf "$d"; done
    rm -f "$RT/ffmpeg.tar.xz"
  fi
  hash -r 2>/dev/null
  have ffmpeg
}

ensure_deps() {
  [ "$IS_TERMUX" = 1 ] && say "Termux detected"
  [ -z "$PM" ] && [ "$OS" = Darwin ] && warn "Homebrew not found (https://brew.sh); downloading portable tools instead."
  have curl || have wget || pm_install curl || die "Please install curl or wget first."

  if ! node_ok; then
    say "Installing Node.js $NODE_LINE LTS..."
    case "$IS_TERMUX:$PM" in
      1:*)     pm_install nodejs ;;   # Termux packages are current Node, with sqlite
      0:apk)   pm_install nodejs npm ;;
      0:brew)  pm_install node@$NODE_LINE && PATH="$(brew --prefix node@$NODE_LINE)/bin:$PATH" ;;
    esac
    hash -r 2>/dev/null
    node_ok || { install_node_tarball; hash -r 2>/dev/null; }
    node_ok || die "Node.js >= 22.13 is required but could not be installed."
  fi
  say "Node.js $(node -v) ($(command -v node))"

  if ! have ffmpeg; then
    say "Installing ffmpeg (needed for stickers, audio and video tools)..."
    { pm_install ffmpeg || pm_install ffmpeg-free || install_ffmpeg_static; } && hash -r 2>/dev/null ||
      warn "ffmpeg could not be installed. Stickers/audio tools will not work."
  fi
  if ! have git; then
    say "Installing git (needed for .update)..."
    pm_install git || warn "git could not be installed. The .update command will not work."
  fi

  # reinstall npm packages only when package.json changed
  HASH=$(sha256_of package.json)
  if [ ! -x node_modules/.bin/pm2 ] || [ -z "$HASH" ] || [ "$HASH" != "$(cat "$RT/deps.sha256" 2>/dev/null)" ]; then
    say "Installing npm packages (first run takes a few minutes)..."
    if ! npm install --omit=dev --no-audit --no-fund; then
      # e.g. Termux: sharp has no Android build; Baileys falls back to jimp without it
      warn "npm install failed, retrying without install scripts..."
      npm install --omit=dev --no-audit --no-fund --ignore-scripts || die "npm install failed. Check your internet connection and run again."
    fi
    [ -n "$HASH" ] && printf '%s\n' "$HASH" > "$RT/deps.sha256"
  fi
}

ensure_config() {
  [ -f config.env ] && return
  say "Creating config.env"
  NUM=""
  if [ -t 0 ]; then
    printf 'Your WhatsApp number with country code (owner), e.g. 919876543210 [Enter to skip]: '
    read -r NUM || NUM=""
  fi
  NUM=$(printf '%s' "$NUM" | tr -cd '0-9')
  {
    echo "# created by install.cmd - edit and restart to apply"
    echo "PREFIX=."
    echo "VPS=true"
    [ -n "$NUM" ] && echo "SUDO=$NUM"
  } > config.env
}

PM2="$ROOT/node_modules/.bin/pm2"
start_bot() {
  [ -x "$PM2" ] || die "pm2 is missing; run: sh install.cmd install"
  "$PM2" delete hermit-md >/dev/null 2>&1
  [ "$IS_TERMUX" = 1 ] && have termux-wake-lock && termux-wake-lock
  say "Starting Hermit-MD (scan the QR code below if this is the first login)"
  printf '    Ctrl+C detaches; the bot keeps running.\n    Stop: sh install.cmd stop    Logs: sh install.cmd logs\n'
  "$PM2" start index.js --name hermit-md --cwd "$ROOT" --interpreter "$(command -v node)" --attach
}

case $ACTION in
  install) ensure_deps; ensure_config; say "Done. Start the bot with: sh install.cmd" ;;
  start)   ensure_deps; ensure_config; start_bot ;;
  restart) ensure_deps; start_bot ;;
  stop)    [ -x "$PM2" ] && "$PM2" delete hermit-md; say "Stopped." ;;
  logs)    "$PM2" logs hermit-md ;;
  *)       die "Unknown action '$ACTION'. Use: start | install | stop | restart | logs" ;;
esac
