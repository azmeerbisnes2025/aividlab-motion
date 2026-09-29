#!/usr/bin/env node
// aividlab-motion CLI
//   motion render <spec.json> [-o out.mp4] [--ratio 9:16] [--theme aividlab] [--draft]
//   motion validate <spec.json>          -> prints normalized spec + warnings
//   motion still <spec.json> [--frame 45] [-o out.png]
//   motion ugc <clip.mp4> [--headline ".."] [--cta ".."] [-o out.mp4]   -> one-shot UGC auto-edit
//   motion schema                         -> prints the spec cheat-sheet for LLMs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { normalizeSpec, totalFrames, SCENE_TYPES, THEME_LIST, RATIOS, CAPTION_STYLES } from "../src/spec/normalize.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (n, d) => {
  const i = argv.findIndex((a) => a === `--${n}` || (n === "out" && a === "-o"));
  return i >= 0 ? argv[i + 1] : d;
};
const has = (n) => argv.includes(`--${n}`);
const log = (...a) => console.error("[motion]", ...a);

function readSpec(p) {
  const txt = fs.readFileSync(p, "utf8");
  // tolerate ```json fences and trailing commas that LLMs love
  const clean = txt.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(clean);
}

/** Copy local files referenced by the spec into public/_run/ so Remotion can serve them. */
function stageAssets(spec, baseDir) {
  const runDir = path.join(PUBLIC, "_run");
  fs.mkdirSync(runDir, { recursive: true });
  const stage = (src) => {
    if (!src || /^(https?:|data:)/.test(src)) return src;
    if (fs.existsSync(path.join(PUBLIC, src))) return src;
    const abs = path.isAbsolute(src) ? src : path.resolve(baseDir, src);
    if (!fs.existsSync(abs)) {
      log(`WARN asset not found: ${src}`);
      return src;
    }
    const name = `${Buffer.from(abs).toString("base64url").slice(-24)}${path.extname(abs)}`;
    const dst = path.join(runDir, name);
    // NOTE: bundler copies public/ into the bundle and does NOT follow symlinks -> hardlink or copy
    try { if (fs.lstatSync(dst).isSymbolicLink()) fs.unlinkSync(dst); } catch {}
    if (!fs.existsSync(dst)) {
      try { fs.linkSync(abs, dst); } catch { fs.copyFileSync(abs, dst); }
    }
    return `_run/${name}`;
  };
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object")
      for (const k of Object.keys(o)) {
        if (["src", "avatar"].includes(k) && typeof o[k] === "string") o[k] = stage(o[k]);
        else walk(o[k]);
      }
  };
  walk(spec);
  return spec;
}

/** For every ugc scene: probe, transcribe, compute jump-cuts. */
function prepUGC(spec) {
  for (const s of spec.scenes) {
    if (s.type !== "ugc" || !s.src || s.segments) continue;
    const abs = /^_run\//.test(s.src) ? path.join(PUBLIC, s.src) : s.src;
    const args = [path.join(ROOT, "py/ugc_prep.py"), abs, "--model", process.env.MOTION_WHISPER || "small"];
    if (s.language) args.push("--lang", s.language);
    if (!s.autoCut) args.push("--no-cut");
    if (s.captions === "off") args.push("--no-captions");
    log(`transcribing + auto-cut ${path.basename(abs)} …`);
    const r = spawnSync(process.env.MOTION_PYTHON || "python3", args, { encoding: "utf8", maxBuffer: 64 << 20 });
    if (r.status !== 0) throw new Error(`ugc_prep failed: ${r.stderr.slice(-800)}`);
    const j = JSON.parse(r.stdout);
    s.srcDuration = j.duration;
    s.videoWidth = j.width;
    s.videoHeight = j.height;
    s.words = j.words;
    let segs = j.segments.map((g) => ({ from: Math.max(g.from, s.trimStart || 0), to: Math.min(g.to, s.trimEnd ?? j.duration) })).filter((g) => g.to - g.from > 0.2);
    if (!segs.length) segs = [{ from: s.trimStart || 0, to: s.trimEnd ?? j.duration }];
    s.segments = segs;
    s.duration = segs.reduce((a, g) => a + (g.to - g.from), 0);
    log(`  ${j.words.length} words, ${segs.length} cuts, ${j.duration.toFixed(1)}s -> ${s.duration.toFixed(1)}s (lang ${j.language})`);
  }
  return spec;
}

function prepare(specPath, overrides = {}) {
  const raw = typeof specPath === "string" ? readSpec(specPath) : specPath;
  Object.assign(raw, overrides);
  const baseDir = typeof specPath === "string" ? path.dirname(path.resolve(specPath)) : process.cwd();
  const first = normalizeSpec(raw);
  first.warnings.forEach((w) => log("fix:", w));
  let spec = stageAssets(first.spec, baseDir);
  spec = prepUGC(spec);
  spec = normalizeSpec(spec).spec; // re-normalise after durations are known
  return spec;
}

async function render(spec, out, { still = false, frame = 30, draft = false } = {}) {
  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, renderStill, selectComposition } = await import("@remotion/renderer");
  log("bundling …");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.tsx"), publicDir: PUBLIC, webpackOverride: (c) => c });
  const inputProps = { spec };
  const comp = await selectComposition({ serveUrl, id: "Motion", inputProps });
  const conc = Number(process.env.MOTION_CONCURRENCY || Math.max(1, Math.min(4, os.cpus().length - 1)));
  if (still) {
    await renderStill({ serveUrl, composition: comp, inputProps, output: out, frame: Math.min(frame, comp.durationInFrames - 1) });
  } else {
    let last = -1;
    await renderMedia({
      serveUrl,
      composition: comp,
      inputProps,
      codec: "h264",
      outputLocation: out,
      concurrency: conc,
      crf: draft ? 28 : 18,
      scale: draft ? 0.5 : 1,
      pixelFormat: "yuv420p",
      audioCodec: "aac",
      onProgress: ({ progress }) => {
        const p = Math.floor(progress * 10);
        if (p !== last) { last = p; log(`render ${p * 10}%`); }
      },
    });
  }
  log(`done -> ${out} (${comp.width}x${comp.height}, ${(comp.durationInFrames / comp.fps).toFixed(1)}s)`);
  console.log(JSON.stringify({ ok: true, output: path.resolve(out), width: comp.width, height: comp.height, seconds: +(comp.durationInFrames / comp.fps).toFixed(2) }));
}

function cheatSheet() {
  return `aividlab-motion spec (JSON). Only pick from these; the engine owns all design.
top: { ratio: ${Object.keys(RATIOS).join("|")}, theme: ${THEME_LIST.join("|")}, transition: fade|slide|wipe|zoom|none,
       music?: "file.mp3", voiceover?: "vo.mp3", watermark?: true, progressBar?: false, scenes: [...] }
scene types: ${Object.keys(SCENE_TYPES).join(", ")}
  hook     {headline, sub?, emoji?, highlight?}
  kinetic  {lines:[2-5 short lines], highlight?}
  logo     {src?, headline?, sub?}
  stat     {value:"12,000+", label, sub?}
  product  {src, headline, sub?, features:[<=4]}
  bullets  {headline, items:[<=6], icon?: check|number|arrow|dot}
  compare  {headline?, left:{label, items[]}, right:{label, items[]}}
  quote    {quote, author, role?, rating?:1-5, avatar?}
  steps    {headline, steps:[<=4]}
  chart    {headline, data:[{label,value}], suffix?}
  price    {headline, price, oldPrice?, badge?, sub?}
  image    {src, headline?, sub?, move?: in|out|left|right}
  cta      {headline, button, url?, sub?}
  ugc      {src:"clip.mp4", captions?: ${CAPTION_STYLES.join("|")}|off, captionPosition?: middle|bottom|top,
            autoCut?: true, autoZoom?: true, language?: "ms", overlays?: [
              {type: headline|sticker|lowerThird|stat|cta|broll|progress, at: sec, duration?: sec, text?, sub?, value?, src?, emoji?, position?}]}
every scene: duration? (seconds, auto if omitted), transition?
Keep text SHORT: headline <= 8 words, bullet <= 6 words.`;
}

async function main() {
  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log("usage: motion render|validate|still|ugc|schema ... (see README)");
    return;
  }
  if (cmd === "schema") return console.log(cheatSheet());
  if (cmd === "doctor") {
    const chk = (name, ok, hint) => console.log(`${ok ? "✅" : "❌"} ${name}${ok ? "" : `  →  ${hint}`}`);
    const run = (c, a) => spawnSync(c, a, { encoding: "utf8" });
    const nodeMaj = Number(process.versions.node.split(".")[0]);
    chk(`Node ${process.versions.node}`, nodeMaj >= 18, "perlu Node 18+ — jalankan semula install.sh");
    chk("ffmpeg", run("ffmpeg", ["-version"]).status === 0, "pasang ffmpeg (apt install ffmpeg / brew install ffmpeg)");
    chk("node_modules", fs.existsSync(path.join(ROOT, "node_modules/remotion")), `cd ${ROOT} && npm install`);
    const chrome = fs.existsSync(path.join(ROOT, "node_modules/.remotion"));
    chk("headless Chrome", chrome, `cd ${ROOT} && npx remotion browser ensure`);
    const py = process.env.MOTION_PYTHON || "python3";
    chk(`faster-whisper (${py}) — untuk UGC caption`, run(py, ["-c", "import faster_whisper"]).status === 0, "pip install faster-whisper  (atau jalankan semula install.sh)");
    console.log(`CPU: ${os.cpus().length} core, RAM: ${(os.totalmem() / 2 ** 30).toFixed(1)} GB ${os.totalmem() < 4 * 2 ** 30 ? "(⚠️ < 4GB, guna --draft)" : ""}`);
    return;
  }
  const input = argv[1];
  if (!input) throw new Error("missing input file");
  const overrides = {};
  if (flag("ratio")) overrides.ratio = flag("ratio");
  if (flag("theme")) overrides.theme = flag("theme");

  if (cmd === "validate") {
    const raw = readSpec(input);
    Object.assign(raw, overrides);
    const r = normalizeSpec(raw);
    console.log(JSON.stringify({ warnings: r.warnings, seconds: +(totalFrames(r.spec) / r.spec.fps).toFixed(2), spec: r.spec }, null, 2));
    return;
  }
  if (cmd === "render" || cmd === "still") {
    const spec = prepare(input, overrides);
    const out = flag("out", path.join(ROOT, "out", `${path.basename(input).replace(/\.json$/, "")}.${cmd === "still" ? "png" : "mp4"}`));
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    return render(spec, out, { still: cmd === "still", frame: Number(flag("frame", 30)), draft: has("draft") });
  }
  if (cmd === "sheet") {
    // visual QA: one still per scene (at 75% of the scene) tiled into one PNG
    const spec = prepare(input, overrides);
    const { bundle } = await import("@remotion/bundler");
    const { renderStill, selectComposition } = await import("@remotion/renderer");
    const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.tsx"), publicDir: PUBLIC });
    const comp = await selectComposition({ serveUrl, id: "Motion", inputProps: { spec } });
    const tr = spec.transition === "none" ? 0 : Math.round(spec.transitionDuration * spec.fps);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sheet-"));
    let start = 0;
    const files = [];
    for (let i = 0; i < spec.scenes.length; i++) {
      const len = Math.round(spec.scenes[i].duration * spec.fps);
      const f = Math.min(comp.durationInFrames - 1, start + Math.floor(len * 0.75));
      const o = path.join(tmp, `${String(i).padStart(2, "0")}.png`);
      await renderStill({ serveUrl, composition: comp, inputProps: { spec }, output: o, frame: f, scale: 0.4 });
      files.push(o);
      start += len - tr;
    }
    const out = flag("out", path.join(ROOT, "out", "sheet.png"));
    const cols = Math.min(5, files.length);
    const rows = Math.ceil(files.length / cols);
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "1", "-i", path.join(tmp, "%02d.png"), "-vf", `tile=${cols}x${rows}:padding=8:color=white`, "-frames:v", "1", out]);
    if (r.status !== 0) throw new Error(String(r.stderr));
    console.log(JSON.stringify({ ok: true, output: path.resolve(out), scenes: files.length }));
    return;
  }
  if (cmd === "ugc") {
    // one-shot: raw clip -> hook + auto-cut captioned UGC + CTA end card
    const clip = path.resolve(input);
    const scenes = [];
    if (flag("headline")) scenes.push({ type: "hook", headline: flag("headline"), duration: 1.8 });
    const overlays = [{ type: "progress" }];
    if (flag("sticker")) overlays.push({ type: "sticker", text: flag("sticker"), at: 0.5, duration: 2.5 });
    scenes.push({ type: "ugc", src: clip, captions: flag("captions", "pop"), language: flag("lang"), overlays });
    if (flag("cta")) scenes.push({ type: "cta", headline: flag("cta"), button: flag("button", "Daftar Sekarang"), url: flag("url", "aividlab.shop") });
    const spec = prepare({ ratio: flag("ratio", "9:16"), theme: flag("theme", "aividlab"), transition: "zoom", scenes });
    const out = flag("out", path.join(ROOT, "out", `${path.basename(clip, path.extname(clip))}-edit.mp4`));
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    if (has("save-spec")) fs.writeFileSync(out.replace(/\.mp4$/, ".spec.json"), JSON.stringify(spec, null, 2));
    return render(spec, out, { draft: has("draft") });
  }
  throw new Error(`unknown command ${cmd}`);
}

main().catch((e) => {
  console.error("[motion] ERROR", e.message);
  process.exit(1);
});
