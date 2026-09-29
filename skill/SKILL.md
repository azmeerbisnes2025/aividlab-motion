---
name: aividlab-motion
description: Use when the user wants a motion graphic video, promo/ad video, kinetic typography, animated explainer, or wants to auto-edit a UGC/talking-head clip (jump cuts, TikTok captions, overlays) into MP4. Agent writes a short JSON spec; the aividlab-motion engine renders studio-quality video. Works with any LLM.
version: 1.0.0
author: aividlab.shop
license: MIT
metadata:
  hermes:
    tags: [video, motion-graphics, remotion, ugc, captions, ads]
    related_skills: []
---

# aividlab-motion

## Overview
Repo: `/root/aividlab-motion` (GitHub `azmeerbisnes2025/aividlab-motion`). Remotion engine with LOCKED design. You never write animation code. You write a JSON spec and run the CLI. The normaliser auto-fixes wrong type names, durations, and over-long text, and prints each fix as `[motion] fix: ...`.

## When to Use
- "buat video motion graphic / promo / iklan / explainer"
- "edit video UGC ni", "letak caption", "potong senyap", "tambah motion kat video ni"
- Don't use for: generating real footage (use video gen models), then pass that footage as a `ugc`/`image` scene.

## Workflow
1. `cd /root/aividlab-motion && export PATH=/root/.hermes/node/bin:$PATH`
2. `node bin/motion.mjs schema` → read the allowed fields.
3. Write spec to `out/<name>.json`. Local file paths (absolute or relative to the spec) are auto-staged.
4. `node bin/motion.mjs validate out/<name>.json` → fix anything listed in warnings you don't like.
5. `node bin/motion.mjs sheet out/<name>.json -o out/<name>-sheet.png` → vision-check one frame per scene.
6. Render: `node bin/motion.mjs render out/<name>.json -o out/<name>.mp4` (run with background=true + notify_on_complete; about 1-3 min per 30 s at 1080p on 4 vCPU). `--draft` gives half-res preview.
7. Deliver with `MEDIA:/root/aividlab-motion/out/<name>.mp4`.

One-shot UGC: `node bin/motion.mjs ugc clip.mp4 --headline "Hook" --sticker "HOT" --cta "Cuba sekarang" --lang ms -o out/x.mp4`

## Spec craft (what makes it look pro)
- 6-10 scenes for 20-35 s. Start with `hook` (≤ 6 words + `highlight`), end with `cta`.
- Alternate density: text-heavy (bullets/steps) → punchy (stat/price/kinetic).
- `kinetic` lines ≤ 4 words each, 2-4 lines.
- `ugc`: don't set duration; auto-cut decides. Overlay `at` = seconds AFTER the cut (output timeline).
- For UGC + motion: hook → ugc (captions pop + 2-3 overlays) → stat/compare → cta.
- Themes: aividlab (lime/violet dark, default brand), midnight (tech), sunset (F&B/fashion), luxe (premium gold serif), candy (beauty, light), mono (editorial).

## Common Pitfalls
1. Missing `PATH=/root/.hermes/node/bin` → `node: not found`.
2. Foreground render can be interrupted → always use background + notify.
3. Whisper `small` takes about 40 s per 10 s clip on CPU. Use `MOTION_WHISPER=base` for speed.
4. Chart values with decimals are shown as given; keep ≤ 6 bars.
5. Images: product scene looks best with transparent PNG (cut-out).

## Verification Checklist
- [ ] `validate` shows no unexpected warnings
- [ ] `sheet` PNG checked visually (no clipped text)
- [ ] ffprobe output: correct resolution, duration, audio stream if UGC/music
