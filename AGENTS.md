# AGENTS.md — aividlab-motion

Instructions for ANY AI coding agent (Codex, Claude Code, OpenClaw, Gemini CLI, OpenCode, Cursor, Hermes…).

This repo renders motion-graphic videos and auto-edits UGC clips. **Never write animation code.** Write a JSON spec, run the `motion` CLI.

## Setup (once)
```bash
command -v motion || curl -fsSL https://raw.githubusercontent.com/azmeerbisnes2025/aividlab-motion/main/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"
motion doctor        # all ✅ (whisper only needed for UGC captions)
```

## Make a motion graphic video
1. `motion schema` → allowed scene types + fields. Use ONLY these.
2. Write spec to `~/aividlab-motion/out/<name>.json`:
   `{"ratio":"9:16","theme":"aividlab","transition":"slide","scenes":[...]}`
3. `motion validate <spec>` → read auto-fix warnings. **`seconds` in the output is the real length** — transitions overlap scenes (~0.45 s each), so it is shorter than the sum of scene durations. Add ~0.5 s per scene if you need an exact length.
4. `motion sheet <spec> -o <name>-sheet.png` → look at it (one frame per scene) and fix clipped/ugly text.
5. `motion render <spec> -o <name>.mp4` — full 1080p takes ~2–10 min per 30 s depending on CPU (run in background if your tool allows). `--draft` = half-res preview, ~1–2 min.
6. Give the user the absolute path of the MP4.

## Auto-edit a UGC / talking-head clip
```bash
motion ugc clip.mp4 --headline "Stop scroll!" --sticker "PROMO" --cta "Beli sekarang" --lang ms -o out.mp4
```
Or put `{"type":"ugc","src":"clip.mp4","captions":"pop","overlays":[...]}` inside a spec to mix with motion scenes.

**Explainer / tutorial edit** (presenter talking + motion graphics popping over them — the viral "cikgu" reel style): use the overlay types `glitch, emphasis, number, cards, flow, focus, screen, split, banner, kicker` (fields in `motion schema`, full example `examples/explainer-ugc.json`). One overlay every ~2 s, match each to what the speaker is saying (read the transcript: `motion render` prints it; or run `--draft` first). The engine blurs the presenter behind big overlays, hides captions while text overlays show, and plays a matching SFX.
**Power-banner stack** (Malaysian talking-head reel style — `examples/banner-stack.json`): `banner` stacks 1-4 solid-colour boxes of bold condensed text over the presenter's chest, each with a hard offset shadow and a slight alternating rotation ("MALAS NAK EDIT VIDEO?", "3 PERKARA"). `kicker` pins a topic pill to a top corner ("🌙 TIPS RAMADAN"). Both accept a palette token `tone: lime|yellow|orange|pink|red|violet|cyan|black|white` (default yellow) — the LLM never writes raw hex.
Whisper mishears brand words → add `"captionFix": {"ivylab":"aividlab"}` to the ugc scene (case-insensitive, multi-word ok).
**Promo / tutorial reel** (presenter talks start→end across 2-3 clips, real app screenshots via `split`/`screen` over them, short `cta` at the end): copy `examples/tutorial-promo-multiclip.json`. `motion transcript` each clip; overlay `at` is per clip.

## Craft rules
- The user's requested length/content always wins. Default when unspecified: 6–10 scenes, 20–35 s. First `hook` (≤6 words + `highlight`), last `cta`.
- Short text: headline ≤ 8 words, list items ≤ 6 words, `kinetic` lines ≤ 4 words.
- Themes: aividlab (default), midnight, sunset, luxe, candy, mono. Ratios: 9:16, 1:1, 4:5, 16:9.
- For `ugc` scenes don't set duration; overlay `at` is seconds on the cut timeline.
- Local image/video paths may be absolute or relative to the spec file. `-o` is relative to your current directory — prefer absolute paths.
- A small `aividlab.shop` watermark is ON by default. For the user's own brand: `"watermarkText": "mybrand.my"`, or `"watermark": false` to remove.
- Background music is ON by default (built-in instrumental, auto-lowered while a UGC clip speaks). Own track: `"music": "song.mp3"`; silent: `"music": false`.
- Sound effects: built-in `whoosh | ding | pop | rumble` (in `public/sfx/`). `hook→rumble, stat→ding, price→ding, steps→pop, cta→whoosh` play automatically; any scene can set `"sfx": "pop"`, `"sfx": false` to opt out, or `"sfx": {"name":"ding","volume":0.8,"at":0.3}`. The BGM dips under each SFX so it punches through.
- Never invent URLs, domains, prices or phone numbers the user didn't give. No URL given → omit `url` and keep the default watermark.

## Don't
- Don't edit `src/` to "improve" design unless the user asks — the locked design is the point.
- Don't render full-res repeatedly to test; use `sheet` / `--draft`.
