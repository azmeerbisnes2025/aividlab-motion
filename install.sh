#!/usr/bin/env bash
# aividlab-motion installer (Linux / macOS / WSL)
#   curl -fsSL https://raw.githubusercontent.com/azmeerbisnes2025/aividlab-motion/main/install.sh | bash
# Env: MOTION_DIR (default ~/aividlab-motion), MOTION_NO_WHISPER=1 to skip UGC captions deps
set -euo pipefail

# Whole script lives in main() so `curl | bash` reads it fully before running
# (apt/npm would otherwise swallow the rest of the piped script from stdin).
main() {

REPO="https://github.com/azmeerbisnes2025/aividlab-motion.git"
DIR="${MOTION_DIR:-$HOME/aividlab-motion}"
NODE_VER="22.12.0"
G='\033[1;32m'; Y='\033[1;33m'; R='\033[1;31m'; N='\033[0m'
say()  { printf "${G}==>${N} %s\n" "$*"; }
warn() { printf "${Y}!! ${N} %s\n" "$*"; }
die()  { printf "${R}XX ${N} %s\n" "$*"; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

OS="$(uname -s)"; ARCH="$(uname -m)"
SUDO=""; if [ "$(id -u)" != "0" ] && have sudo; then SUDO="sudo"; fi

printf "\n${G}aividlab-motion${N} — motion graphic + UGC auto-edit  (aividlab.shop)\n\n"

# ---------- system packages ----------
if [ "$OS" = "Linux" ]; then
  if have apt-get; then
    say "Pasang pakej sistem (git, ffmpeg, python3, lib Chrome)…"
    $SUDO apt-get update -qq </dev/null || true
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git curl ffmpeg python3 python3-venv ca-certificates \
      libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2 libxrandr2 libxkbcommon0 libxfixes3 \
      libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 fonts-noto-color-emoji \
      </dev/null >/dev/null 2>&1 || \
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git curl ffmpeg python3 python3-venv libnss3 libgbm1 libasound2t64 </dev/null >/dev/null 2>&1 || \
      warn "Sebahagian pakej gagal dipasang — teruskan juga"
  elif have dnf; then
    $SUDO dnf install -y -q git curl ffmpeg python3 nss atk at-spi2-atk libgbm alsa-lib libxkbcommon >/dev/null 2>&1 || warn "dnf: sebahagian pakej gagal"
  else
    warn "Package manager tak dikenali. Pastikan git, ffmpeg, python3 dah ada."
  fi
elif [ "$OS" = "Darwin" ]; then
  if ! have brew; then die "Pasang Homebrew dulu: https://brew.sh  lepas tu jalankan semula command ini."; fi
  say "Pasang pakej (git, ffmpeg, python)…"
  brew install git ffmpeg python@3.12 >/dev/null 2>&1 || true
fi

have git    || die "git tiada"
have ffmpeg || die "ffmpeg tiada — pasang ffmpeg dulu"

# ---------- node ----------
NODE_OK=0
if have node; then
  MAJ="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$MAJ" -ge 18 ] && NODE_OK=1
fi
NODE_BIN=""
if [ $NODE_OK = 0 ]; then
  say "Pasang Node.js $NODE_VER (local, tak sentuh sistem)…"
  case "$OS-$ARCH" in
    Linux-x86_64) P="linux-x64";; Linux-aarch64|Linux-arm64) P="linux-arm64";;
    Darwin-arm64) P="darwin-arm64";; Darwin-x86_64) P="darwin-x64";;
    *) die "Platform $OS-$ARCH tak disokong";;
  esac
  mkdir -p "$HOME/.aividlab-motion"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VER/node-v$NODE_VER-$P.tar.gz" | tar -xz -C "$HOME/.aividlab-motion"
  NODE_BIN="$HOME/.aividlab-motion/node-v$NODE_VER-$P/bin"
  export PATH="$NODE_BIN:$PATH"
fi
say "Node $(node -v)"

# ---------- repo ----------
if [ -d "$DIR/.git" ]; then
  say "Update repo di $DIR…"
  git -C "$DIR" pull -q --ff-only || warn "git pull gagal (ada perubahan local?) — guna versi sedia ada"
else
  say "Clone repo ke $DIR…"
  git clone -q --depth 1 "$REPO" "$DIR"
fi
cd "$DIR"

say "npm install (1-3 minit)…"
npm ci --no-audit --no-fund --loglevel=error || npm install --no-audit --no-fund --loglevel=error
say "Muat turun headless Chrome untuk render…"
npx --yes remotion browser ensure >/dev/null

# ---------- python / whisper (UGC captions + auto-cut) ----------
PY=""
if [ "${MOTION_NO_WHISPER:-0}" != "1" ] && have python3; then
  say "Setup Whisper (caption auto + potong senyap)…"
  python3 -m venv "$DIR/.venv" && "$DIR/.venv/bin/pip" install -q --upgrade pip && \
    "$DIR/.venv/bin/pip" install -q faster-whisper && PY="$DIR/.venv/bin/python" || \
    warn "faster-whisper gagal — video motion graphic OK, tapi UGC caption tak jalan"
fi

# ---------- `motion` command ----------
BIN="$HOME/.local/bin"; mkdir -p "$BIN"
cat > "$BIN/motion" <<EOF
#!/usr/bin/env bash
${NODE_BIN:+export PATH="$NODE_BIN:\$PATH"}
${PY:+export MOTION_PYTHON="\${MOTION_PYTHON:-$PY}"}
exec node "$DIR/bin/motion.mjs" "\$@"
EOF
chmod +x "$BIN/motion"
case ":$PATH:" in *":$BIN:"*) ;; *)
  for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
    [ -f "$rc" ] && ! grep -q 'aividlab-motion' "$rc" && printf '\n# aividlab-motion\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$rc"
  done
  export PATH="$BIN:$PATH";;
esac

# ---------- AI agent skills ----------
SK_TARGETS=""
[ -d "$HOME/.hermes" ] && SK_TARGETS="$SK_TARGETS $HOME/.hermes/skills/creative"
for prof in "$HOME"/.hermes/profiles/*/; do [ -d "$prof" ] && SK_TARGETS="$SK_TARGETS ${prof%/}/skills/creative"; done
[ -d "$HOME/.claude" ] && SK_TARGETS="$SK_TARGETS $HOME/.claude/skills"
[ -d "$HOME/.openclaw" ] && SK_TARGETS="$SK_TARGETS $HOME/.openclaw/skills"
for d in $SK_TARGETS; do
  mkdir -p "$d/aividlab-motion"
  sed "s#~/aividlab-motion#$DIR#g" skill/SKILL.md > "$d/aividlab-motion/SKILL.md"
  say "Skill AI agent dipasang: $d/aividlab-motion"
done

# ---------- smoke test ----------
say "Test render 1 frame…"
if motion still examples/demo-aividlab.json --frame 40 -o "$DIR/out/test.png" >/dev/null 2>&1; then
  say "BERJAYA ✅  Gambar test: $DIR/out/test.png"
else
  warn "Test render gagal. Jalankan:  motion doctor"
fi

cat <<EOF

${G}Siap!${N} Buka terminal baru, kemudian cuba:

  motion schema                                   # senarai scene (tampal ke AI)
  motion render $DIR/examples/demo-aividlab.json  # video demo
  motion ugc video-saya.mp4 --headline "Stop scroll!" --cta "Beli sekarang"

Panduan penuh: $DIR/docs/PANDUAN-BM.md
EOF
}

main "$@" </dev/null
