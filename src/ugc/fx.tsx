// Explainer-style overlays for UGC / talking-head edits (reference: Malaysian
// "tutorial explainer" reels). Each one is driven by a tiny spec object, so any
// LLM, including small Chinese models, only has to pick a type and write text.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fitSize, useLayout, useTheme } from "../lib/kit";
import { asset } from "../scenes";

type S = Record<string, any>;
const isVideo = (src?: string) => !!src && /\.(mp4|mov|webm|m4v)$/i.test(src);

const useVis = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inP = spring({ frame, fps, config: { damping: 14, stiffness: 170 } });
  const outP = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { vis: Math.min(inP, outP), inP, outP, frame, fps };
};

const pop = (frame: number, fps: number, delay: number) => spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });

const shadow = (u: number) => `0 ${4 * u}px ${18 * u}px rgba(0,0,0,.55)`;

/* GLITCH: huge word with RGB split + slice jitter ("IKLAN") */
export const Glitch: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, height, width } = useLayout();
  const { vis, frame } = useVis();
  const text = String(o.text ?? "").toUpperCase();
  const jitter = frame < 10 || random(`gl${Math.floor(frame / 3)}`) < 0.14 ? 1 : 0;
  const dx = jitter * (random(`gx${frame}`) - 0.5) * 36 * u;
  const off = (5 + jitter * 16) * u;
  const size = fitSize(text, 240 * u, 0.38);
  const band = random(`gb${Math.floor(frame / 2)}`) * 80;
  const layer = (color: string, x: number, extra: React.CSSProperties = {}) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color, transform: `translateX(${x + dx}px)`, ...extra }}>{text}</div>
  );
  return (
    <div style={{ position: "absolute", left: 0, width, top: height * (o.position === "top" ? 0.12 : o.position === "bottom" ? 0.62 : 0.34), height: size * 1.4, fontFamily: t.display, fontWeight: 900, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1, transform: `scale(${1.35 - 0.35 * vis})`, opacity: vis }}>
      {layer("#00e5ff", -off, { mixBlendMode: "screen", opacity: 0.9 })}
      {layer("#ff2d55", off, { mixBlendMode: "screen", opacity: 0.9 })}
      {layer("#ffffff", 0, { textShadow: shadow(u) })}
      {jitter ? layer("#ffffff", 22 * u, { clipPath: `inset(${band}% 0 ${Math.max(0, 88 - band)}% 0)` }) : null}
      {o.sub && (
        <div style={{ position: "absolute", top: size * 1.3, left: 0, right: 0, textAlign: "center", fontFamily: t.body, fontWeight: 700, fontSize: 44 * u, color: "#fff", textShadow: shadow(u), letterSpacing: 0 }}>{o.sub}</div>
      )}
    </div>
  );
};

/* EMPHASIS: white line + boxed highlight line ("PRODUCTION" / "YANG BESAR") */
export const Emphasis: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, height, pad } = useLayout();
  const { vis, frame, fps } = useVis();
  const top = height * (o.position === "top" ? 0.14 : o.position === "center" ? 0.4 : 0.58);
  const l1 = String(o.text ?? "").toUpperCase();
  const l2 = String(o.highlight ?? "").toUpperCase();
  const p1 = pop(frame, fps, 0);
  const p2 = pop(frame, fps, 5);
  const wipe = interpolate(frame, [4, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: pad * 0.5, right: pad * 0.5, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * u, opacity: vis > 0.02 ? 1 : 0, transform: `translateY(${(1 - vis) * 20 * u}px)` }}>
      {l1 && (
        <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: fitSize(l1, 110 * u, 0.5), color: "#fff", lineHeight: 1, textAlign: "center", transform: `scale(${0.6 + 0.4 * p1})`, opacity: Math.min(1, p1 * 1.5), WebkitTextStroke: `${3 * u}px rgba(0,0,0,.35)`, paintOrder: "stroke fill", textShadow: shadow(u) }}>{l1}</div>
      )}
      {l2 && (
        <div style={{ position: "relative", transform: `scale(${0.6 + 0.4 * p2}) rotate(-1.5deg)`, opacity: Math.min(1, p2 * 1.5) }}>
          <div style={{ position: "absolute", inset: 0, background: t.accent, borderRadius: 10 * u, transformOrigin: "left", transform: `scaleX(${wipe})`, boxShadow: `0 ${10 * u}px ${30 * u}px rgba(0,0,0,.35)` }} />
          <div style={{ position: "relative", fontFamily: t.display, fontWeight: 900, fontSize: fitSize(l2, 104 * u, 0.5), color: t.onAccent, lineHeight: 1.05, padding: `${8 * u}px ${24 * u}px`, textAlign: "center" }}>{l2}</div>
        </div>
      )}
    </div>
  );
};

/* NUMBER: numbered point badge ("1" + "SATU GAMBAR") */
export const NumberPoint: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, height, pad } = useLayout();
  const { vis, frame, fps } = useVis();
  const c = pop(frame, fps, 0);
  const b = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 150 } });
  const label = String(o.text ?? "").toUpperCase();
  const D = 128 * u;
  const top = height * (o.position === "top" ? 0.14 : o.position === "center" ? 0.42 : 0.62);
  return (
    <div style={{ position: "absolute", left: pad * 0.5, right: 0, top, display: "flex", flexDirection: "column", gap: 10 * u, opacity: vis > 0.02 ? 1 : 0, transform: `translateX(${(1 - Math.min(vis, 1)) * -30 * u}px)` }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", zIndex: 2, width: D, height: D, flexShrink: 0, borderRadius: "50%", background: t.accent, border: `${6 * u}px solid #fff`, color: t.onAccent, fontFamily: t.display, fontWeight: 900, fontSize: 72 * u, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${c}) rotate(${(1 - c) * -90}deg)`, boxShadow: shadow(u) }}>
          {String(o.value ?? "1").slice(0, 3)}
        </div>
        <div style={{ marginLeft: -D * 0.3, paddingLeft: D * 0.45, paddingRight: 40 * u, paddingTop: 16 * u, paddingBottom: 16 * u, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 900, fontSize: fitSize(label, 72 * u, 0.55), lineHeight: 1, borderRadius: `0 ${14 * u}px ${14 * u}px 0`, transformOrigin: "left", transform: `scaleX(${b})`, whiteSpace: "nowrap", boxShadow: shadow(u) }}>
          <span style={{ opacity: b > 0.6 ? 1 : 0 }}>{label}</span>
        </div>
      </div>
      {o.sub && <div style={{ marginLeft: D * 0.2, fontFamily: t.body, fontWeight: 700, fontSize: 40 * u, color: "#fff", textShadow: shadow(u), opacity: b }}>• {o.sub}</div>}
    </div>
  );
};

/* CARDS: 1-3 framed images in a row with a title ("Paling penting") */
export const Cards: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, width, height, pad } = useLayout();
  const { vis, frame, fps } = useVis();
  const imgs: string[] = (o.images ?? []).slice(0, 3);
  const n = Math.max(1, imgs.length);
  const gap = 24 * u;
  const cw = Math.min(420 * u, (width - pad - gap * (n - 1)) / n);
  const rot = n === 1 ? [0] : n === 2 ? [-4, 4] : [-5, 0, 5];
  return (
    <AbsoluteFill style={{ opacity: vis > 0.02 ? 1 : 0 }}>
      {o.text && (
        <div style={{ position: "absolute", left: pad * 0.5, right: pad * 0.5, top: height * 0.2, textAlign: "center", fontFamily: t.display, fontWeight: 900, fontSize: fitSize(o.text, 92 * u, 0.5), color: "#fff", textShadow: `0 0 ${30 * u}px ${t.accent}aa, ${shadow(u)}`, transform: `translateY(${(1 - vis) * -30 * u}px)` }}>{o.text}</div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.34, display: "flex", justifyContent: "center", gap }}>
        {imgs.map((src, i) => {
          const p = pop(frame, fps, 4 + i * 5);
          return (
            <div key={i} style={{ width: cw, height: cw * 1.3, borderRadius: 20 * u, border: `${8 * u}px solid #fff`, overflow: "hidden", background: "#111", transform: `translateY(${(1 - p) * 120 * u}px) rotate(${rot[i] * p}deg) scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 1.5), boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,.55)` }}>
              {isVideo(src) ? (
                <OffthreadVideo src={asset(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Img src={asset(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + frame / 900})` }} />
              )}
            </div>
          );
        })}
      </div>
      {o.sub && (
        <div style={{ position: "absolute", left: pad * 0.5, right: pad * 0.5, top: height * 0.34 + cw * 1.3 + 50 * u, textAlign: "center", fontFamily: t.body, fontWeight: 700, fontSize: 44 * u, color: "#fff", textShadow: shadow(u), opacity: vis }}>{o.sub}</div>
      )}
    </AbsoluteFill>
  );
};

/* FLOW: boxes joined by arrows ("HOOK → PROOF → USP") */
export const Flow: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, height, pad, width } = useLayout();
  const { vis, frame, fps } = useVis();
  const items: string[] = (o.items ?? []).slice(0, 5);
  const vertical = items.length > 3 && height > width;
  const fs = Math.min(56 * u, (width - pad * 1.5) / Math.max(1, items.join("").length) * 1.25);
  return (
    <AbsoluteFill style={{ opacity: vis > 0.02 ? 1 : 0, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 * u, padding: pad * 0.5 }}>
      {o.text && <div style={{ fontFamily: t.display, fontWeight: 800, fontSize: fitSize(o.text, 72 * u, 0.5), color: "#fff", textShadow: `0 0 ${24 * u}px ${t.accent}bb, ${shadow(u)}`, opacity: vis, textAlign: "center" }}>{o.text}</div>}
      <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", alignItems: "center", gap: 14 * u }}>
        {items.map((it, i) => {
          const p = pop(frame, fps, 4 + i * 7);
          const a = interpolate(frame, [8 + i * 7, 14 + i * 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ color: "#fff", fontFamily: t.display, fontWeight: 900, fontSize: 60 * u, opacity: a, transform: `${vertical ? "rotate(90deg) " : ""}translateX(${(1 - a) * -20 * u}px)`, textShadow: shadow(u) }}>→</div>}
              <div style={{ background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 900, fontSize: vertical ? 60 * u : fs, padding: `${18 * u}px ${28 * u}px`, borderRadius: 14 * u, textTransform: "uppercase", whiteSpace: "nowrap", transform: `scale(${p})`, boxShadow: `0 0 ${30 * u}px ${t.accent}66, ${shadow(u)}` }}>{it}</div>
            </React.Fragment>
          );
        })}
      </div>
      {o.sub && <div style={{ fontFamily: t.body, fontWeight: 600, fontSize: 40 * u, color: "#fff", opacity: vis, textShadow: shadow(u), textAlign: "center" }}>{o.sub}</div>}
    </AbsoluteFill>
  );
};

/* FOCUS: product in a tilted white card with animated corner brackets */
export const Focus: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, width, height, pad } = useLayout();
  const { vis, frame, fps } = useVis();
  const p = pop(frame, fps, 0);
  const W = width * 0.62;
  const br = interpolate(frame, [4, 18], [60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * u;
  const L = 70 * u;
  const bw = 9 * u;
  const corner = (k: number) => {
    const top = k < 2, left = k % 2 === 0;
    return (
      <div key={k} style={{ position: "absolute", width: L, height: L, [top ? "top" : "bottom"]: -30 * u - br, [left ? "left" : "right"]: -30 * u - br, borderColor: "#fff", borderStyle: "solid", borderWidth: 0, [top ? "borderTopWidth" : "borderBottomWidth"]: bw, [left ? "borderLeftWidth" : "borderRightWidth"]: bw, borderRadius: 6 * u, filter: `drop-shadow(0 0 ${12 * u}px ${t.accent})`, opacity: vis } as React.CSSProperties} />
    );
  };
  return (
    <AbsoluteFill style={{ opacity: vis > 0.02 ? 1 : 0 }}>
      <div style={{ position: "absolute", left: (width - W) / 2, top: height * 0.16, width: W, height: W }}>
        <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 26 * u, overflow: "hidden", transform: `rotate(${-3 * p}deg) scale(${0.6 + 0.4 * p})`, boxShadow: `0 0 ${60 * u}px ${t.accent}88, 0 ${30 * u}px ${70 * u}px rgba(0,0,0,.5)` }}>
          {o.src && <Img src={asset(o.src)} style={{ width: "100%", height: "100%", objectFit: "contain", transform: `scale(${1 + frame / 1200})` }} />}
        </div>
        {[0, 1, 2, 3].map(corner)}
      </div>
      {o.text && <div style={{ position: "absolute", left: pad * 0.5, right: pad * 0.5, top: height * 0.16 + W + 70 * u, textAlign: "center", fontFamily: t.display, fontWeight: 900, fontSize: fitSize(o.text, 80 * u, 0.5), color: "#fff", textShadow: shadow(u), opacity: vis }}>{o.text}</div>}
      {o.sub && <div style={{ position: "absolute", left: pad * 0.5, right: pad * 0.5, top: height * 0.16 + W + 170 * u, textAlign: "center", fontFamily: t.body, fontWeight: 600, fontSize: 40 * u, color: "#fff", textShadow: shadow(u), opacity: vis }}>{o.sub}</div>}
    </AbsoluteFill>
  );
};

/* SCREEN: phone mockup showing a screenshot (auto-scrolls if tall) */
export const Screen: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, width, height, pad } = useLayout();
  const { vis, frame } = useVis();
  const { durationInFrames } = useVideoConfig();
  const W = Math.min(width * 0.56, height * 0.3);
  const H = W * 2.05;
  const scroll = interpolate(frame, [15, durationInFrames - 10], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: vis > 0.02 ? 1 : 0 }}>
      {o.text && <div style={{ position: "absolute", left: pad * 0.5, right: pad * 0.5, top: height * 0.07, textAlign: "center", fontFamily: t.display, fontWeight: 900, fontSize: fitSize(o.text, 80 * u, 0.5), color: "#fff", textShadow: `0 0 ${24 * u}px ${t.accent}aa, ${shadow(u)}`, opacity: vis }}>{o.text}</div>}
      <div style={{ position: "absolute", left: (width - W) / 2, top: height * 0.17, width: W, height: H, borderRadius: 54 * u, border: `${14 * u}px solid #0b0b0e`, background: "#000", overflow: "hidden", transform: `translateY(${(1 - vis) * 200 * u}px) rotate(${(1 - vis) * 6}deg)`, boxShadow: `0 0 0 ${3 * u}px #333, 0 ${40 * u}px ${90 * u}px rgba(0,0,0,.6), 0 0 ${60 * u}px ${t.accent}55` }}>
        {o.src && (isVideo(o.src) ? (
          <OffthreadVideo src={asset(o.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Img src={asset(o.src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${scroll}%` }} />
        ))}
        <div style={{ position: "absolute", top: 14 * u, left: "50%", width: W * 0.3, height: 26 * u, marginLeft: -W * 0.15, borderRadius: 20 * u, background: "#0b0b0e" }} />
      </div>
    </AbsoluteFill>
  );
};

/* BANNER: stacked power banners over the presenter (ref: "MALAS NAK EDIT VIDEO?",
   "3 PERKARA", "JANGAN TINGGALKAN SOLAT SUNAT TARAWIH"). Solid colour box, bold
   condensed text, hard offset shadow, slight alternating rotation. */
export const TONES: Record<string, { bg: string; fg: string }> = {
  lime: { bg: "#b6f02b", fg: "#0c0d10" },
  yellow: { bg: "#ffd21f", fg: "#141414" },
  orange: { bg: "#ff7a1a", fg: "#2a0e00" },
  pink: { bg: "#ff3d9a", fg: "#ffffff" },
  red: { bg: "#ff2d55", fg: "#ffffff" },
  violet: { bg: "#8b7cff", fg: "#0c0d10" },
  cyan: { bg: "#37e0d0", fg: "#06211f" },
  black: { bg: "#101216", fg: "#ffffff" },
  white: { bg: "#ffffff", fg: "#101216" },
};
export const TONE_NAMES = Object.keys(TONES);
export const toneOf = (name?: string) => TONES[TONE_NAMES.includes(name ?? "") ? name as string : "yellow"];

const wrapLines = (text: string, max = 16, cap = 4) => {
  const flat = String(text ?? "").trim();
  if (!flat) return [];
  const explicit = flat.split("\n").map((l) => l.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit.slice(0, cap);
  const words = flat.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if (`${cur} ${w}`.trim().length > max && cur) {
      out.push(cur.trim());
      cur = w;
      if (out.length === cap - 1) break;
    } else cur = `${cur} ${w}`.trim();
  }
  if (cur) out.push(cur.trim());
  return out.slice(0, cap);
};

export const Banner: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, height, pad } = useLayout();
  const { vis, frame, fps } = useVis();
  const tone = toneOf(o.tone);
  const lines = wrapLines(String(o.text ?? ""), o.tight ? 22 : 16);
  if (!lines.length) return null;
  const top = height * (o.position === "top" ? 0.16 : o.position === "bottom" ? 0.66 : 0.42);
  return (
    <div style={{ position: "absolute", left: pad * 0.4, right: pad * 0.4, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 * u, opacity: vis > 0.02 ? 1 : 0 }}>
      {lines.map((ln, i) => {
        const p = spring({ frame: frame - i * 5, fps, config: { damping: 11, stiffness: 200, mass: 0.7 } });
        const rot = [-2.6, 1.9, -1.3, 0.9][i] ?? 0;
        const dark = tone.bg === "#101216";
        return (
          <div
            key={i}
            style={{
              background: tone.bg,
              color: tone.fg,
              fontFamily: t.impact,
              fontSize: fitSize(ln.toUpperCase(), 92 * u, 0.62),
              lineHeight: 1.04,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              padding: `${10 * u}px ${26 * u}px`,
              borderRadius: 12 * u,
              transform: `translateY(${(1 - p) * -70 * u}px) scale(${0.5 + 0.5 * p}) rotate(${rot + (1 - p) * -6}deg)`,
              opacity: Math.min(1, p * 1.6),
              boxShadow: `${7 * u}px ${7 * u}px 0 ${dark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.9)"}, 0 ${16 * u}px ${36 * u}px rgba(0,0,0,.5)`,
              whiteSpace: "nowrap",
            }}
          >
            {ln}
          </div>
        );
      })}
      {o.sub && (
        <div style={{ marginTop: 6 * u, fontFamily: t.body, fontWeight: 800, fontSize: 40 * u, color: "#fff", textShadow: shadow(u), textTransform: "uppercase", letterSpacing: "0.04em", opacity: vis }}>
          {o.sub}
        </div>
      )}
    </div>
  );
};

/* KICKER: topic pill pinned to a top corner (ref: "🌙 TIPS RAMADAN", "05/05"). */
export const Kicker: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, height, pad } = useLayout();
  const { vis, frame } = useVis();
  const tone = toneOf(o.tone);
  const label = String(o.text ?? "").trim();
  if (!label) return null;
  const right = String(o.position ?? "top-left").endsWith("right");
  return (
    <div style={{ position: "absolute", top: height * 0.075, [right ? "right" : "left"]: pad * 0.5, transform: `translateY(${(1 - vis) * -50 * u}px)`, opacity: vis }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12 * u,
          background: tone.bg,
          color: tone.fg,
          fontFamily: t.body,
          fontWeight: 900,
          fontSize: 40 * u,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          padding: `${12 * u}px ${28 * u}px`,
          borderRadius: 999,
          transform: `rotate(-2deg) translateX(${Math.sin(frame / 14) * 4 * u}px)`,
          boxShadow: `${5 * u}px ${5 * u}px 0 rgba(0,0,0,.85), 0 ${12 * u}px ${30 * u}px rgba(0,0,0,.45)`,
          whiteSpace: "nowrap",
        }}
      >
        {o.emoji ? <span style={{ fontSize: "1.15em" }}>{String(o.emoji).slice(0, 4)}</span> : null}
        {label}
      </div>
    </div>
  );
};

/* SPLIT: media on the top half; the presenter is pushed to the bottom half by UGC.tsx */
export const SplitTop: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const { u, width, height } = useLayout();
  const { vis, frame } = useVis();
  const H = height * 0.5;
  const glow = 0.6 + 0.4 * Math.sin(frame / 6);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height: H, overflow: "hidden", transform: `translateY(${(vis - 1) * H}px)` }}>
      <div style={{ position: "absolute", inset: 0, background: "#111" }}>
        {o.src && (isVideo(o.src) ? (
          <OffthreadVideo src={asset(o.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Img src={asset(o.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + frame / 700})` }} />
        ))}
      </div>
      {(o.play || (isVideo(o.src) && o.play !== false)) && (
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 150 * u, height: 150 * u, marginLeft: -75 * u, marginTop: -75 * u, borderRadius: "50%", background: "rgba(0,0,0,.55)", border: `${5 * u}px solid ${t.accent}`, boxShadow: `0 0 ${40 * glow * u}px ${t.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 0, height: 0, marginLeft: 12 * u, borderTop: `${30 * u}px solid transparent`, borderBottom: `${30 * u}px solid transparent`, borderLeft: `${48 * u}px solid #fff` }} />
        </div>
      )}
      {o.text && (
        <div style={{ position: "absolute", left: 0, bottom: 26 * u, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 900, fontSize: fitSize(o.text, 52 * u, 0.55), padding: `${12 * u}px ${30 * u}px`, borderRadius: `0 ${14 * u}px ${14 * u}px 0`, transform: `translateX(${(1 - vis) * -100}%)` }}>{o.text}</div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6 * u, background: t.accent, boxShadow: `0 0 ${20 * u}px ${t.accent}` }} />
    </div>
  );
};
