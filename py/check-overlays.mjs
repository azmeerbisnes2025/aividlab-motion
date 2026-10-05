// Self-check for the v2 explainer overlays (no render). Run: node py/check-overlays.mjs
import { normalizeSpec } from "../src/spec/normalize.js";

let fails = 0;
const ok = (cond, msg) => { if (!cond) fails++; console.log(`${cond ? "PASS" : "FAIL"} ${msg}`); };
const ovs = (list, extra = {}) => normalizeSpec({ scenes: [{ type: "ugc", src: "c.mp4", overlays: list, ...extra }] });

// 1. every new type + typical weak-model aliases resolve
const alias = { glitch: "RGB", emphasis: "punchline", number: "numbered", cards: "gallery", flow: "storyboard", focus: "spotlight", screen: "phone mockup", split: "split-screen" };
for (const [want, a] of Object.entries(alias)) {
  const r = ovs([{ type: want, text: "x", at: 1 }, { type: a, text: "x", at: 2 }]);
  const t = r.spec.scenes[0].overlays.map((o) => o.type);
  ok(t[0] === want && t[1] === want, `type '${want}' and alias '${a}' -> ${t.join(",")}`);
}
// 2. exact name wins over another table's alias ("number" was stat's alias)
ok(ovs([{ type: "number", value: 1, text: "Satu", at: 0 }]).spec.scenes[0].overlays[0].type === "number", "exact 'number' is not swallowed by stat alias");
ok(ovs([{ type: "counter", value: 9, at: 0 }]).spec.scenes[0].overlays[0].type === "stat", "'counter' still maps to stat");

// 3. fields
const f = ovs([
  { type: "emphasis", text: "Production", highlight: "yang besar", at: 0 },
  { type: "flow", items: ["hook", "proof", "usp", "cta", "x", "too many"], at: 2 },
  { type: "cards", images: ["a.png", "b.png", "c.png", "d.png"], at: 4 },
  { type: "cards", src: "only.png", at: 6 },
]).spec.scenes[0].overlays;
ok(f[0].highlight === "yang besar", "emphasis.highlight kept");
ok(f[1].items.length === 5, `flow.items capped at 5 (got ${f[1].items.length})`);
ok(f[2].images.length === 3, `cards.images capped at 3 (got ${f[2].images.length})`);
ok(f[3].images.length === 1 && f[3].images[0] === "only.png", "cards accepts single src");

// 4. overlay default sfx + opt-out + idempotent re-normalise
const s1 = ovs([{ type: "glitch", text: "IKLAN", at: 0 }, { type: "number", text: "a", at: 2, sfx: false }, { type: "headline", text: "h", at: 3 }]);
const o1 = s1.spec.scenes[0].overlays;
ok(o1[0].sfx?.src === "sfx/rumble.mp3", "glitch defaults to rumble");
ok(!o1[1].sfx, "sfx:false silences an overlay");
ok(!o1[2].sfx, "headline (no default) stays silent");
const again = normalizeSpec(s1.spec).spec.scenes[0].overlays;
ok(again[0].sfx?.src === "sfx/rumble.mp3", `re-normalise keeps sfx src (got ${again[0].sfx?.src})`);
ok(normalizeSpec({ scenes: [{ type: "hook", sfx: { name: "ding", volume: 0 } }] }).spec.scenes[0].sfx.volume === 0, "volume 0 is respected (not reset to 1)");

// 5. overlays past the cut clip get squeezed in, not lost
const seg = [{ from: 0, to: 3 }, { from: 4, to: 7.9 }]; // 6.9 s after cut
const sq = ovs([{ type: "glitch", text: "A", at: 0 }, { type: "flow", items: ["a", "b"], at: 6.8 }, { type: "cards", images: ["x.png"], at: 8.5 }], { segments: seg });
const q = sq.spec.scenes[0].overlays;
const L = 6.9;
ok(q.every((o) => o.at < L - 0.5 && o.at + o.duration <= L + 1e-6), `all overlays inside ${L}s clip: ${q.map((o) => `${o.type}@${o.at}+${o.duration}`).join(" ")}`);
ok(q.every((o, i) => i === 0 || q[i - 1].at + q[i - 1].duration <= o.at + 1e-6), "no two overlays overlap after squeeze");
ok(sq.warnings.some((w) => /squeezed/.test(w)), "squeeze is reported as a warning");

// 6. captionFix passes through as a plain string map
const cf = ovs([], { captionFix: { ivylab: "aividlab", "ai ajian": "AI agent" } }).spec.scenes[0].captionFix;
ok(cf && cf.ivylab === "aividlab" && cf["ai ajian"] === "AI agent", "captionFix kept");
ok(ovs([], { captionFix: ["bad"] }).spec.scenes[0].captionFix === undefined, "captionFix array rejected");

// 7. banner / kicker resolve (incl. aliases) and carry tone + tight
const r7 = ovs([
  { type: "banner", text: "MAKAN 1 SAMPAI 3 JAM?", tone: "red", tight: true, at: 0 },
  { type: "power banner", text: "x", at: 2 },
  { type: "kicker", text: "TIPS RAMADAN", emoji: "🌙", tone: "yellow", position: "top-right", at: 0.3 },
  { type: "topic", text: "y", at: 1 },
]);
const t7 = r7.spec.scenes[0].overlays;
ok(t7[0].type === "banner", `banner resolves (got ${t7[0].type})`);
ok(t7[1].type === "banner", `alias "power banner" -> banner (got ${t7[1].type})`);
ok(t7[2].type === "kicker", `kicker resolves (got ${t7[2].type})`);
ok(t7[3].type === "kicker", `alias "topic" -> kicker (got ${t7[3].type})`);
ok(t7[0].tone === "red", `banner.tone kept (got ${t7[0].tone})`);
ok(t7[0].tight === true, "banner.tight kept");
ok(t7[0].sfx?.src === "sfx/pop.mp3", `banner default sfx pop (got ${t7[0].sfx?.src})`);
ok(t7[2].sfx?.src === "sfx/pop.mp3", `kicker default sfx pop (got ${t7[2].sfx?.src})`);
ok(t7[0].text === "MAKAN 1 SAMPAI 3 JAM?", "banner text kept verbatim");
ok(ovs([{ type: "banner", text: "x", tone: "#ff0000", at: 0 }]).spec.scenes[0].overlays[0].tone === undefined, "raw hex tone rejected (locked palette)");
ok(ovs([{ type: "banner", text: "x", tone: "mauve", at: 0 }]).spec.scenes[0].overlays[0].tone === undefined, "unknown tone name rejected");
// idempotent: re-normalise keeps tone
const again7 = normalizeSpec(r7.spec).spec.scenes[0].overlays;
ok(again7[0].tone === "red" && again7[0].tight === true, "re-normalise keeps tone + tight");

console.log(fails ? `\\n${fails} FAILED` : "\\nALL PASS");
process.exit(fails ? 1 : 0);
