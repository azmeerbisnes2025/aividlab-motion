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
