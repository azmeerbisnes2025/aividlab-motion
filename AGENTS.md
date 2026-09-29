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
3. `motion validate <spec>` → read auto-fix warnings.
4. `motion sheet <spec> -o <name>-sheet.png` → look at it (one frame per scene) and fix clipped/ugly text.
5. `motion render <spec> -o <name>.mp4` (long: 3–10 min; run in background if your tool allows). `--draft` = fast half-res preview.
6. Give the user the absolute path of the MP4.

## Auto-edit a UGC / talking-head clip
```bash
motion ugc clip.mp4 --headline "Stop scroll!" --sticker "PROMO" --cta "Beli sekarang" --lang ms -o out.mp4
```
Or put `{"type":"ugc","src":"clip.mp4","captions":"pop","overlays":[...]}` inside a spec to mix with motion scenes.

## Craft rules
- 6–10 scenes, 20–35 s. First `hook` (≤6 words + `highlight`), last `cta`.
- Short text: headline ≤ 8 words, list items ≤ 6 words, `kinetic` lines ≤ 4 words.
- Themes: aividlab (default), midnight, sunset, luxe, candy, mono. Ratios: 9:16, 1:1, 4:5, 16:9.
- For `ugc` scenes don't set duration; overlay `at` is seconds on the cut timeline.
- Local image/video paths may be absolute or relative to the spec file.

## Don't
- Don't edit `src/` to "improve" design unless the user asks — the locked design is the point.
- Don't render full-res repeatedly to test; use `sheet` / `--draft`.
