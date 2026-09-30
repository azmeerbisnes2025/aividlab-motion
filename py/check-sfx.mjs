// Unit check for the SFX layer (no render needed). Run: node py/check-sfx.mjs
import { normalizeSpec } from "../src/spec/normalize.js";

const cases = [
  ["hook default", [{ type: "hook", headline: "Jom" }], { src: "sfx/rumble.mp3", volume: 1, at: 0, duck: true }],
  ["stat default", [{ type: "stat", value: "5,000", label: "user" }], { src: "sfx/ding.mp3", volume: 1, at: 0, duck: true }],
  ["steps default", [{ type: "steps", headline: "Cara", steps: ["satu", "dua"] }], { src: "sfx/pop.mp3", volume: 1, at: 0, duck: true }],
  ["cta default", [{ type: "cta", headline: "Beli", button: "Klik" }], { src: "sfx/whoosh.mp3", volume: 1, at: 0, duck: true }],
  ["silent types", [{ type: "kinetic", lines: ["a", "b"] }, { type: "image", src: "x.png" }], undefined],
  // `false` (not undefined) so a 2nd normalise pass can't re-add the type default
  ["opt out", [{ type: "hook", headline: "Jom", sfx: false }], false],
  ["explicit name", [{ type: "image", src: "x.png", sfx: "pop" }], { src: "sfx/pop.mp3", volume: 1, at: 0, duck: true }],
  ["object form", [{ type: "hook", headline: "Jom", sfx: { name: "ding", volume: 0.8, at: 0.3 } }], { src: "sfx/ding.mp3", volume: 0.8, at: 0.3, duck: true }],
  ["alias sound", [{ type: "hook", headline: "Jom", sound: "ding" }], { src: "sfx/ding.mp3", volume: 1, at: 0, duck: true }],
  ["custom file", [{ type: "hook", headline: "Jom", sfx: "my-hit.mp3" }], { src: "my-hit.mp3", volume: 1, at: 0, duck: true, custom: true }],
  ["case-insensitive", [{ type: "hook", headline: "Jom", sfx: "DING" }], { src: "sfx/ding.mp3", volume: 1, at: 0, duck: true }],
  ["duck false", [{ type: "hook", headline: "Jom", sfx: { name: "ding", duck: false } }], { src: "sfx/ding.mp3", volume: 1, at: 0, duck: false }],
  ["ugc no default", [{ type: "ugc", src: "c.mp4" }], undefined],
];

let fails = 0;
for (const [name, scenes, want] of cases) {
  const r = normalizeSpec({ scenes });
  const got = r.spec.scenes[0].sfx;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name} ${ok ? "" : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
}

// music ducking window must reference the sfx range: full spec with hook + image sfx
const r2 = normalizeSpec({
  scenes: [
    { type: "hook", headline: "Jom", duration: 2 },
    { type: "image", src: "x.png", sfx: { name: "pop", at: 0.5 }, duration: 3 },
    { type: "ugc", src: "c.mp4", duration: 4 },
  ],
});
const sfxScenes = r2.spec.scenes.filter((s) => s.sfx);
console.log(`${sfxScenes.length === 2 ? "PASS" : "FAIL"} two scenes carry sfx (got ${sfxScenes.length})`);
if (sfxScenes.length !== 2) fails++;
if (r2.warnings.length) console.log("warnings:", r2.warnings.join(" | "));

// idempotency: the CLI normalises twice. `music:false` and `sfx:false` must survive.
const p1 = normalizeSpec({ music: false, scenes: [{ type: "hook", headline: "Jom", sfx: false }] }).spec;
const p2 = normalizeSpec(p1).spec;
const idem = p2.music === false && p2.scenes[0].sfx === false;
console.log(`${idem ? "PASS" : "FAIL"} music:false + sfx:false survive re-normalise (music=${JSON.stringify(p2.music)} sfx=${JSON.stringify(p2.scenes[0].sfx)})`);
if (!idem) fails++;

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
