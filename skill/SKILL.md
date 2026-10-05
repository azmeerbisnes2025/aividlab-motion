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
Repo: `~/aividlab-motion` (GitHub `azmeerbisnes2025/aividlab-motion`), CLI `motion` (in `~/.local/bin`). If `motion` is missing, install: `curl -fsSL https://raw.githubusercontent.com/azmeerbisnes2025/aividlab-motion/main/install.sh | bash`. Remotion engine with LOCKED design. You never write animation code. You write a JSON spec and run the CLI. The normaliser auto-fixes wrong type names, durations, and over-long text, and prints each fix as `[motion] fix: ...`.

## When to Use
- "buat video motion graphic / promo / iklan / explainer"
- "edit video UGC ni", "letak caption", "potong senyap", "tambah motion kat video ni"
- Don't use for: generating real footage (use video gen models), then pass that footage as a `ugc`/`image` scene.

## Workflow
1. `export PATH=$HOME/.local/bin:$PATH && motion doctor` (all ✅ except whisper is fine for pure motion).
2. `motion schema` → read the allowed fields.
3. Write spec to `~/aividlab-motion/out/<name>.json`. Local file paths (absolute or relative to the spec) are auto-staged.
4. `motion validate out/<name>.json` → fix anything listed in warnings you don't like.
5. `motion sheet out/<name>.json -o out/<name>-sheet.png` → vision-check one frame per scene.
6. Render: `motion render out/<name>.json -o out/<name>.mp4` (run with background=true + notify_on_complete; about 1-3 min per 30 s at 1080p on 4 vCPU). `--draft` gives half-res preview.
7. Deliver with `MEDIA:<absolute path to mp4>`.

One-shot UGC: `motion ugc clip.mp4 --headline "Hook" --sticker "HOT" --cta "Cuba sekarang" --lang ms -o out/x.mp4`

Explainer edit (presenter talking + motion graphics over them, the viral tutorial-reel style):
1. `motion transcript clip.mp4 --lang ms` → lines with times on the CUT timeline.
2. One `ugc` scene with `captions:"boxed"`, and one overlay per ~2 s line, matched to what is said: `glitch` (hook word), `emphasis` (text + `highlight` box), `number` (point 1/2/3), `cards` (1-3 images), `flow` (Hook→Proof→USP), `focus` (product), `screen` (phone screenshot), `split` (demo media top half), `banner` (stacked power banners over the presenter's chest — Malaysian reel style, `tone: lime|yellow|orange|pink|red|violet|cyan|black|white`), `kicker` (topic pill pinned to a top corner, with `emoji`). Fields: `motion schema`; full examples `examples/explainer-ugc.json` + `examples/banner-stack.json`.
3. Engine blurs the presenter behind big overlays, hides captions under text overlays, plays a matching SFX, and squeezes overlays that run past the clip (warning).
4. Read the transcript for misheard brand words and add `"captionFix": {"ivylab":"aividlab","ai ajian":"AI agent"}` to the ugc scene.
5. Promo/tutorial reel across several talking clips + real app screenshots (`split`/`screen`) + 1.5-2 s `cta` end: copy `examples/tutorial-promo-multiclip.json`.

## Spec craft (what makes it look pro)
- 6-10 scenes for 20-35 s. Start with `hook` (≤ 6 words + `highlight`), end with `cta`.
- Alternate density: text-heavy (bullets/steps) → punchy (stat/price/kinetic).
- `kinetic` lines ≤ 4 words each, 2-4 lines.
- `ugc`: don't set duration; auto-cut decides. Overlay `at` = seconds AFTER the cut (output timeline).
- For UGC + motion: hook → ugc (captions pop + 2-3 overlays) → stat/compare → cta.
- Themes: aividlab (lime/violet dark, default brand), midnight (tech), sunset (F&B/fashion), luxe (premium gold serif), candy (beauty, light), mono (editorial).

## Common Pitfalls
1. `motion: command not found` → `export PATH=$HOME/.local/bin:$PATH` (or re-run installer).
2. Foreground render can be interrupted → always use background + notify.
3. Whisper `small` takes about 40 s per 10 s clip on CPU. Use `MOTION_WHISPER=base` for speed.
4. Chart values with decimals are shown as given; keep ≤ 6 bars.
5. Images: product scene looks best with transparent PNG (cut-out).
6. Video is never silent: built-in BGM plays by default and ducks under UGC speech. `"music": "x.mp3"` to replace, `"music": false` for silence.
7. SFX: built-in `whoosh | ding | pop | rumble`; `hook→rumble, stat→ding, price→ding, steps→pop, cta→whoosh` auto-play. Override per scene `"sfx": "pop"` or `"sfx": false`; advanced `{"sfx":{"name":"ding","volume":0.8,"at":0.3}}`.
8. Never invent URLs/domains/prices the user didn't give — no URL → omit `url`, keep default watermark.

## Verification Checklist
- [ ] `validate` shows no unexpected warnings
- [ ] `sheet` PNG checked visually (no clipped text)
- [ ] ffprobe output: correct resolution, duration, audio stream if UGC/music
