// Spec normalizer / auto-fixer. Plain ESM JS so both the Node CLI and the
// Remotion bundle can import it. Philosophy: weak LLMs make predictable
// mistakes (wrong type names, ms vs s, too-long text, missing fields).
// We FIX instead of failing, and report every fix as a warning.

export const RATIOS = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "16:9": { width: 1920, height: 1080 },
};

export const THEME_LIST = ["aividlab", "midnight", "sunset", "luxe", "candy", "mono"];
export const TRANSITIONS = ["fade", "slide", "wipe", "zoom", "none"];
export const CAPTION_STYLES = ["pop", "karaoke", "boxed", "minimal"];

// scene type -> { aliases, defaults(duration s), textLimits }
export const SCENE_TYPES = {
  hook: { aliases: ["opener", "intro", "headline", "title"], dur: 2.5 },
  kinetic: { aliases: ["kinetic_text", "kinetictypography", "typography", "text", "words"], dur: 3.5 },
  logo: { aliases: ["logoreveal", "logo_reveal", "brand", "outro_logo"], dur: 2.5 },
  stat: { aliases: ["counter", "statcounter", "number", "stats"], dur: 3 },
  product: { aliases: ["productshowcase", "showcase", "hero", "image_feature"], dur: 4 },
  bullets: { aliases: ["list", "features", "bulletlist", "checklist", "benefits"], dur: 4 },
  compare: { aliases: ["beforeafter", "before_after", "split", "vs", "splitcompare"], dur: 4 },
  quote: { aliases: ["testimonial", "review"], dur: 4 },
  steps: { aliases: ["howto", "how_to", "process", "timeline"], dur: 4.5 },
  chart: { aliases: ["bars", "barchart", "graph"], dur: 4 },
  price: { aliases: ["pricetag", "offer", "promo", "discount"], dur: 3.5 },
  image: { aliases: ["kenburns", "photo", "broll", "picture"], dur: 3 },
  cta: { aliases: ["calltoaction", "call_to_action", "outro", "end"], dur: 3 },
  ugc: { aliases: ["video", "clip", "talkinghead", "talking_head", "footage"], dur: 0 },
};

const OVERLAY_TYPES = {
  lowerThird: ["lowerthird", "lower_third", "nametag", "name"],
  sticker: ["badge", "emoji", "tag", "label"],
  stat: ["counter", "number"],
  cta: ["button", "calltoaction"],
  broll: ["image", "cutaway", "photo"],
  headline: ["title", "text", "hook", "callout"],
  progress: ["progressbar", "bar"],
};

const LIMITS = { headline: 60, line: 42, sub: 90, item: 48, quote: 180 };

const canon = (s) => String(s ?? "").toLowerCase().replace(/[\s-]/g, "");

function resolveType(raw, table) {
  const c = canon(raw);
  for (const [k, v] of Object.entries(table)) {
    const aliases = Array.isArray(v) ? v : v.aliases;
    if (canon(k) === c || aliases.map(canon).includes(c)) return k;
  }
  return null;
}

function clip(str, max, path, warn) {
  if (str == null) return str;
  let s = String(str).trim();
  if (s.length > max) {
    const cut = s.slice(0, max);
    s = cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 8)).trim() + "…";
    warn(`${path}: text too long, trimmed to ${max} chars`);
  }
  return s;
}

// LLMs often emit milliseconds or strings like "3s".
function seconds(v, fallback, path, warn) {
  if (v == null || v === "") return fallback;
  let n = typeof v === "string" ? parseFloat(v.replace(/[^\d.]/g, "")) : Number(v);
  if (typeof v === "string" && /ms/i.test(v)) n = n / 1000;
  if (!isFinite(n) || n <= 0) {
    warn(`${path}: invalid duration '${v}', using ${fallback}s`);
    return fallback;
  }
  if (n > 120) {
    warn(`${path}: ${n} looks like milliseconds, converted`);
    n = n / 1000;
  }
  return Math.min(Math.max(n, 0.8), 60);
}

const arr = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);

function textList(v, max, lim, path, warn) {
  let list = arr(v);
  if (list.length === 1 && typeof list[0] === "string" && list[0].includes("\n"))
    list = list[0].split("\n");
  list = list
    .map((x) => (typeof x === "object" && x ? x.text ?? x.title ?? x.label ?? "" : x))
    .map((x) => String(x).trim())
    .filter(Boolean);
  if (list.length > max) {
    warn(`${path}: ${list.length} items, keeping first ${max}`);
    list = list.slice(0, max);
  }
  return list.map((x, i) => clip(x, lim, `${path}[${i}]`, warn));
}

function normScene(s, i, warn) {
  const p = `scenes[${i}]`;
  if (typeof s === "string") s = { type: "kinetic", text: s };
  const type = resolveType(s.type ?? s.kind ?? s.template, SCENE_TYPES);
  if (!type) {
    warn(`${p}: unknown type '${s.type}', rendering as 'kinetic'`);
  }
  const t = type ?? "kinetic";
  const o = { type: t };
  const headline = s.headline ?? s.title ?? s.text ?? s.heading;
  const sub = s.sub ?? s.subtitle ?? s.subheadline ?? s.caption ?? s.description;
  o.duration = seconds(s.duration ?? s.seconds ?? s.dur, SCENE_TYPES[t].dur || 5, `${p}.duration`, warn);
  if (s.transition) {
    const tr = canon(s.transition);
    o.transition = TRANSITIONS.includes(tr) ? tr : "fade";
  }
  if (s.accent) o.accent = ["accent", "accent2", "accent3"].includes(s.accent) ? s.accent : "accent";

  switch (t) {
    case "hook":
      o.headline = clip(headline ?? "Tengok ni!", LIMITS.headline, `${p}.headline`, warn);
      o.sub = clip(sub, LIMITS.sub, `${p}.sub`, warn);
      o.emoji = s.emoji ? String(s.emoji).slice(0, 4) : undefined;
      o.highlight = s.highlight ? String(s.highlight) : undefined;
      break;
    case "kinetic": {
      let lines = s.lines ?? s.words ?? headline;
      if (typeof lines === "string") lines = lines.split(/\n|(?<=[.!?])\s+/);
      o.lines = textList(lines, 5, LIMITS.line, `${p}.lines`, warn);
      if (!o.lines.length) o.lines = ["…"];
      o.highlight = s.highlight ? String(s.highlight) : undefined;
      break;
    }
    case "logo":
      o.src = s.src ?? s.logo ?? s.image ?? "aividlab-logo.png";
      o.headline = clip(headline ?? s.brand, 30, `${p}.headline`, warn);
      o.sub = clip(sub ?? s.tagline, 60, `${p}.sub`, warn);
      break;
    case "stat": {
      const raw = s.value ?? s.number ?? s.stat ?? 0;
      const m = String(raw).match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
      o.value = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
      o.prefix = s.prefix ?? (m ? m[1] : "");
      o.suffix = s.suffix ?? (m ? m[3] : "");
      o.decimals = Number.isInteger(o.value) ? 0 : Math.min(2, (String(o.value).split(".")[1] || "").length);
      o.label = clip(s.label ?? headline ?? "", LIMITS.sub, `${p}.label`, warn);
      o.sub = clip(sub, LIMITS.sub, `${p}.sub`, warn);
      break;
    }
    case "product":
      o.src = s.src ?? s.image ?? s.img;
      o.headline = clip(headline ?? "", LIMITS.headline, `${p}.headline`, warn);
      o.sub = clip(sub, LIMITS.sub, `${p}.sub`, warn);
      o.features = textList(s.features ?? s.bullets ?? s.items, 4, LIMITS.item, `${p}.features`, warn);
      if (!o.src) warn(`${p}: product has no image, showing text layout`);
      break;
    case "bullets":
      o.headline = clip(headline, LIMITS.headline, `${p}.headline`, warn);
      o.items = textList(s.items ?? s.bullets ?? s.points ?? s.features, 6, LIMITS.item, `${p}.items`, warn);
      o.icon = ["check", "dot", "number", "arrow"].includes(s.icon) ? s.icon : "check";
      break;
    case "compare": {
      const L = s.left ?? s.before ?? {};
      const R = s.right ?? s.after ?? {};
      const side = (x, def, k) => ({
        label: clip((typeof x === "string" ? x : x.label ?? x.title) ?? def, 24, `${p}.${k}.label`, warn),
        items: textList(typeof x === "string" ? [] : x.items ?? x.points, 4, 36, `${p}.${k}.items`, warn),
        src: typeof x === "string" ? undefined : x.src ?? x.image,
      });
      o.headline = clip(headline, LIMITS.headline, `${p}.headline`, warn);
      o.left = side(L, "Sebelum", "left");
      o.right = side(R, "Selepas", "right");
      break;
    }
    case "quote":
      o.quote = clip(s.quote ?? s.text ?? headline ?? "", LIMITS.quote, `${p}.quote`, warn);
      o.author = clip(s.author ?? s.name, 40, `${p}.author`, warn);
      o.role = clip(s.role ?? sub, 50, `${p}.role`, warn);
      o.rating = Math.max(0, Math.min(5, Math.round(Number(s.rating ?? s.stars ?? 5))));
      o.avatar = s.avatar;
      break;
    case "steps":
      o.headline = clip(headline, LIMITS.headline, `${p}.headline`, warn);
      o.items = textList(s.steps ?? s.items, 4, LIMITS.item, `${p}.steps`, warn);
      break;
    case "chart": {
      const data = arr(s.data ?? s.bars ?? s.values).slice(0, 6).map((d, j) =>
        typeof d === "number"
          ? { label: String(j + 1), value: d }
          : { label: clip(String(d.label ?? d.name ?? j + 1), 14, `${p}.data[${j}]`, warn), value: Number(d.value ?? d.v ?? 0) || 0 },
      );
      o.headline = clip(headline, LIMITS.headline, `${p}.headline`, warn);
      o.data = data.length ? data : [{ label: "A", value: 1 }];
      o.suffix = s.suffix ?? "";
      break;
    }
    case "price":
      o.headline = clip(headline ?? "Promo", LIMITS.headline, `${p}.headline`, warn);
      o.price = String(s.price ?? s.now ?? "").slice(0, 16);
      o.oldPrice = s.oldPrice ?? s.old_price ?? s.was ? String(s.oldPrice ?? s.old_price ?? s.was).slice(0, 16) : undefined;
      o.badge = clip(s.badge ?? s.discount, 16, `${p}.badge`, warn);
      o.sub = clip(sub, LIMITS.sub, `${p}.sub`, warn);
      break;
    case "image":
      o.src = s.src ?? s.image ?? s.img;
      o.headline = clip(headline, LIMITS.headline, `${p}.headline`, warn);
      o.sub = clip(sub, LIMITS.sub, `${p}.sub`, warn);
      o.move = ["in", "out", "left", "right"].includes(s.move) ? s.move : "in";
      if (!o.src) warn(`${p}: image scene missing src`);
      break;
    case "cta":
      o.headline = clip(headline ?? "Cuba sekarang", LIMITS.headline, `${p}.headline`, warn);
      o.button = clip(s.button ?? s.cta ?? s.action ?? "Daftar Sekarang", 28, `${p}.button`, warn);
      o.url = s.url ? String(s.url).replace(/^https?:\/\//, "").slice(0, 40) : undefined;
      o.sub = clip(sub, LIMITS.sub, `${p}.sub`, warn);
      break;
    case "ugc": {
      o.src = s.src ?? s.video ?? s.file;
      if (!o.src) warn(`${p}: ugc scene missing src`);
      o.trimStart = Math.max(0, Number(s.trimStart ?? s.start ?? 0) || 0);
      o.trimEnd = s.trimEnd ?? s.end ? Number(s.trimEnd ?? s.end) : undefined;
      o.captions = s.captions === false || s.captions === "off" ? "off" : CAPTION_STYLES.includes(s.captions) ? s.captions : "pop";
      o.captionPosition = ["bottom", "middle", "top"].includes(s.captionPosition) ? s.captionPosition : "middle";
      o.autoCut = s.autoCut !== false; // remove dead air by default
      o.autoZoom = s.autoZoom !== false; // punch-in jump cuts
      o.volume = s.volume == null ? 1 : Math.max(0, Math.min(2, Number(s.volume)));
      o.language = s.language;
      o.overlays = arr(s.overlays).map((ov, j) => normOverlay(ov, `${p}.overlays[${j}]`, warn)).filter(Boolean);
      // filled by the CLI pre-pass:
      o.words = s.words;
      o.segments = s.segments;
      o.srcDuration = s.srcDuration;
      o.videoWidth = s.videoWidth;
      o.videoHeight = s.videoHeight;
      if (s.segments) o.duration = s.segments.reduce((a, g) => a + (g.to - g.from), 0);
      else if (s.duration == null) o.duration = 0; // CLI must probe
      break;
    }
  }
  return o;
}

function normOverlay(ov, p, warn) {
  const t = resolveType(ov.type, OVERLAY_TYPES);
  if (!t) {
    warn(`${p}: unknown overlay '${ov.type}', dropped`);
    return null;
  }
  return {
    type: t,
    at: Math.max(0, Number(ov.at ?? ov.start ?? 0) || 0),
    duration: seconds(ov.duration, t === "progress" ? 999 : 2.5, `${p}.duration`, warn),
    text: clip(ov.text ?? ov.headline ?? ov.title ?? ov.label, 50, `${p}.text`, warn),
    sub: clip(ov.sub ?? ov.role, 50, `${p}.sub`, warn),
    value: ov.value,
    src: ov.src ?? ov.image,
    position: ["top", "center", "bottom", "top-left", "top-right"].includes(ov.position) ? ov.position : undefined,
    emoji: ov.emoji,
  };
}

export function normalizeSpec(input) {
  const warnings = [];
  const warn = (m) => warnings.push(m);
  let spec = typeof input === "string" ? JSON.parse(input) : input ?? {};
  if (Array.isArray(spec)) spec = { scenes: spec };

  const ratio = RATIOS[String(spec.ratio ?? spec.aspect ?? "9:16").replace("x", ":")] ? String(spec.ratio ?? spec.aspect ?? "9:16").replace("x", ":") : (warn(`ratio '${spec.ratio}' unsupported, using 9:16`), "9:16");
  const theme = THEME_LIST.includes(canon(spec.theme)) ? canon(spec.theme) : (spec.theme && warn(`theme '${spec.theme}' unknown, using aividlab`), "aividlab");
  const transition = TRANSITIONS.includes(canon(spec.transition)) ? canon(spec.transition) : "slide";

  const scenes = arr(spec.scenes).map((s, i) => normScene(s, i, warn));
  if (!scenes.length) {
    warn("no scenes given, added placeholder");
    scenes.push(normScene({ type: "hook", headline: "aividlab.shop" }, 0, warn));
  }

  const music = spec.music
    ? typeof spec.music === "string"
      ? { src: spec.music, volume: 0.35 }
      : { src: spec.music.src, volume: Math.min(1, Math.max(0, Number(spec.music.volume ?? 0.35))) }
    : undefined;
  const voiceover = spec.voiceover
    ? typeof spec.voiceover === "string"
      ? { src: spec.voiceover, volume: 1 }
      : { src: spec.voiceover.src, volume: Number(spec.voiceover.volume ?? 1) }
    : undefined;

  return {
    spec: {
      title: spec.title ? String(spec.title).slice(0, 80) : "aividlab-motion",
      ratio,
      ...RATIOS[ratio],
      fps: [24, 25, 30, 60].includes(Number(spec.fps)) ? Number(spec.fps) : 30,
      theme,
      transition,
      transitionDuration: Math.min(1, Math.max(0.2, Number(spec.transitionDuration ?? 0.45))),
      watermark: spec.watermark !== false,
      watermarkText: spec.watermarkText ? String(spec.watermarkText).slice(0, 30) : "aividlab.shop",
      progressBar: spec.progressBar === true,
      music,
      voiceover,
      scenes,
    },
    warnings,
  };
}

export function totalFrames(spec) {
  const f = spec.fps;
  const tr = spec.transition === "none" ? 0 : Math.round(spec.transitionDuration * f);
  let total = 0;
  spec.scenes.forEach((s, i) => {
    total += Math.max(1, Math.round(s.duration * f));
    const t = (s.transition ?? spec.transition) === "none";
    if (i > 0 && !t) total -= tr;
  });
  return Math.max(1, total);
}
