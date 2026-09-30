# aividlab-motion 🎬

**Motion graphic + UGC auto-edit engine — AI-agent-proof.**
By [aividlab.shop](https://aividlab.shop)

Any LLM (Claude, GPT, DeepSeek, Qwen, GLM, Kimi…) writes a **short JSON spec**. The engine renders **studio-grade MP4** — kinetic typography, stat counters, product showcases, before/after, testimonials, charts, price slams, CTA — plus **auto-edited UGC** (auto jump-cut dead air, word-level TikTok captions, punch-in zoom, motion overlays).

> Why it works with weak models: the LLM never writes animation code. Design (fonts, colours, easing, spacing, timing) is locked inside the engine. The spec normaliser auto-fixes typical LLM mistakes (wrong type names, ms vs s, too-long text, ```json fences, trailing commas).

## Features
- **14 scene templates**: `hook kinetic logo stat product bullets compare quote steps chart price image cta ugc`
- **UGC auto-edit**: local Whisper (free) → word timestamps → cut silence → punch-in every other cut → captions (`pop | karaoke | boxed | minimal`)
- **Overlays on UGC**: `headline sticker lowerThird stat cta broll progress`
- **6 themes**: `aividlab midnight sunset luxe candy mono`
- **Ratios**: `9:16 1:1 4:5 16:9` — every layout adapts
- **Transitions**: `slide fade wipe zoom none`
- Music / voiceover tracks, watermark, progress bar
- **Sound effects**: built-in `whoosh | ding | pop | rumble`; `hook→rumble, stat→ding, price→ding, steps→pop, cta→whoosh` auto-play, any scene can override (`"sfx": "pop"`, or `"sfx": false`), BGM auto-ducks under each hit
- `sheet` command → contact sheet PNG so an agent can visually QA before full render

## Install (1 command)
```bash
curl -fsSL https://raw.githubusercontent.com/azmeerbisnes2025/aividlab-motion/main/install.sh | bash
motion doctor
```
🇲🇾 **Panduan Bahasa Melayu:** [docs/PANDUAN-BM.md](docs/PANDUAN-BM.md) · **Prompt AI siap:** [docs/PROMPT-AI.md](docs/PROMPT-AI.md)

### Manual
```bash
git clone https://github.com/azmeerbisnes2025/aividlab-motion && cd aividlab-motion
npm install
npx remotion browser ensure
pip install faster-whisper   # only for UGC auto-edit
# requires ffmpeg on PATH
```

## Use
```bash
node bin/motion.mjs schema                              # cheat-sheet to paste into any LLM
node bin/motion.mjs validate spec.json                  # normalise + list auto-fixes
node bin/motion.mjs sheet spec.json -o sheet.png        # quick visual QA
node bin/motion.mjs render spec.json -o out.mp4 [--ratio 1:1] [--theme luxe] [--draft]
node bin/motion.mjs ugc clip.mp4 --headline "Stop scroll!" --cta "Cuba sekarang" -o edit.mp4
```

### Minimal spec
```json
{
  "ratio": "9:16", "theme": "aividlab",
  "scenes": [
    { "type": "hook", "headline": "Video iklan siap 60 saat", "highlight": "60 saat" },
    { "type": "ugc", "src": "talking.mp4", "captions": "pop",
      "overlays": [{ "type": "sticker", "text": "HOT", "at": 0.5 }] },
    { "type": "cta", "headline": "Cuba hari ni", "button": "Daftar", "url": "aividlab.shop" }
  ]
}
```
See `examples/` for full specs.

## Env
- `MOTION_WHISPER` — whisper model (`tiny|base|small|medium`, default `small`)
- `MOTION_PYTHON` — python binary with faster-whisper
- `MOTION_CONCURRENCY` — render threads

## AI agents (Hermes, Claude Code, Codex, OpenClaw, Gemini CLI, OpenCode, Cursor…)
Read [`AGENTS.md`](AGENTS.md). Any agent that can run a terminal works — just tell it:
> *install https://github.com/azmeerbisnes2025/aividlab-motion and follow its AGENTS.md*

The installer also drops a skill into `~/.hermes`, `~/.claude/skills`, `~/.codex/skills`, `~/.openclaw/skills` when present.

## Hermes skill file
`skill/SKILL.md` — copy to `~/.hermes/skills/creative/aividlab-motion/SKILL.md`.

## License
MIT © aividlab.shop — templates rendered with [Remotion](https://remotion.dev) (check Remotion's license for company use).
