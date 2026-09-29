import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Img } from "remotion";
import { useLayout, useTheme, Pill, EASE } from "../lib/kit";
import { asset } from "../scenes";

type Word = { w: string; s: number; e: number };
type Seg = { from: number; to: number };
type S = Record<string, any>;

/** Map source-time words onto the cut output timeline. */
const mapWords = (words: Word[] = [], segs: Seg[]) => {
  const out: Word[] = [];
  let acc = 0;
  for (const g of segs) {
    for (const w of words) {
      if (w.s >= g.from - 0.05 && w.e <= g.to + 0.05) out.push({ w: w.w, s: acc + Math.max(0, w.s - g.from), e: acc + Math.min(g.to, w.e) - g.from });
    }
    acc += g.to - g.from;
  }
  return out;
};

/** Group words into short caption pages (TikTok style: 1-4 words). */
const pages = (words: Word[], maxWords = 3, maxChars = 18) => {
  const res: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const len = cur.map((x) => x.w).join(" ").length + w.w.length;
    const gap = cur.length ? w.s - cur[cur.length - 1].e : 0;
    if (cur.length && (cur.length >= maxWords || len > maxChars || gap > 0.45 || /[.!?,]$/.test(cur[cur.length - 1].w))) {
      res.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) res.push(cur);
  return res;
};

const Captions: React.FC<{ words: Word[]; style: string; position: string }> = ({ words, style, position }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, height } = useLayout();
  const now = frame / fps;
  const pg = pages(words, style === "minimal" ? 6 : 3, style === "minimal" ? 34 : 18);
  const idx = pg.findIndex((p, i) => now >= p[0].s - 0.05 && now < (pg[i + 1]?.[0].s ?? p[p.length - 1].e + 0.6));
  if (idx < 0) return null;
  const page = pg[idx];
  const start = page[0].s;
  const pop = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 11, stiffness: 260, mass: 0.5 } });
  const top = position === "top" ? height * 0.14 : position === "bottom" ? height * 0.74 : height * 0.6;
  const size = (style === "minimal" ? 50 : 88) * u;
  return (
    <div style={{ position: "absolute", left: 60 * u, right: 60 * u, top, display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: size * 0.28, rowGap: 6 * u, transform: style === "pop" ? `scale(${0.75 + pop * 0.25})` : undefined }}>
      {page.map((w, i) => {
        const active = now >= w.s && now < w.e + 0.08;
        const spoken = now >= w.s;
        const txt = style === "minimal" ? w.w : w.w.toUpperCase();
        const base: React.CSSProperties = {
          fontFamily: style === "minimal" ? t.body : t.impact,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.1,
          letterSpacing: style === "minimal" ? 0 : "0.01em",
          display: "inline-block",
          WebkitTextStroke: style === "boxed" || style === "minimal" ? undefined : `${9 * u}px #000`,
          paintOrder: "stroke fill",
          textShadow: `0 ${6 * u}px ${20 * u}px rgba(0,0,0,.6)`,
        };
        if (style === "boxed")
          return (
            <span key={i} style={{ ...base, color: active ? t.onAccent : "#fff", background: active ? t.accent : "rgba(0,0,0,.72)", padding: `${4 * u}px ${16 * u}px`, borderRadius: 14 * u }}>
              {txt}
            </span>
          );
        if (style === "karaoke")
          return (
            <span key={i} style={{ ...base, color: spoken ? t.accent : "#fff" }}>
              {txt}
            </span>
          );
        if (style === "minimal")
          return (
            <span key={i} style={{ ...base, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,.55)", padding: `${2 * u}px ${10 * u}px`, borderRadius: 8 * u, textShadow: "none" }}>
              {txt}
            </span>
          );
        // pop (default)
        return (
          <span key={i} style={{ ...base, color: active ? t.accent : "#fff", transform: active ? `scale(1.12) rotate(-2deg)` : undefined }}>
            {txt}
          </span>
        );
      })}
    </div>
  );
};

/* ------------- motion-graphic overlays on top of UGC ------------- */
const Overlay: React.FC<{ o: S }> = ({ o }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { u, pad, height, width } = useLayout();
  const inP = spring({ frame, fps, config: { damping: 14, stiffness: 170 } });
  const outP = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vis = Math.min(inP, outP);
  switch (o.type) {
    case "lowerThird":
      return (
        <div style={{ position: "absolute", left: pad * 0.6, top: height * 0.72, transform: `translateX(${(1 - vis) * -120}%)`, display: "flex", flexDirection: "column", gap: 6 * u }}>
          <div style={{ background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 900, fontSize: 48 * u, padding: `${12 * u}px ${28 * u}px`, borderRadius: 12 * u, alignSelf: "flex-start" }}>{o.text}</div>
          {o.sub && <div style={{ background: "rgba(0,0,0,.72)", color: "#fff", fontFamily: t.body, fontWeight: 600, fontSize: 32 * u, padding: `${8 * u}px ${22 * u}px`, borderRadius: 10 * u, alignSelf: "flex-start" }}>{o.sub}</div>}
        </div>
      );
    case "sticker": {
      const pos = o.position ?? "top-right";
      const st: React.CSSProperties = { position: "absolute", top: pos.startsWith("top") ? height * 0.12 : pos === "center" ? height * 0.42 : height * 0.5, ...(pos.endsWith("left") ? { left: pad * 0.6 } : pos.endsWith("right") ? { right: pad * 0.6 } : { left: 0, right: 0, display: "flex", justifyContent: "center" }) };
      return (
        <div style={st}>
          <div style={{ transform: `scale(${vis}) rotate(${-8 + Math.sin(frame / 7) * 4}deg)`, background: t.accent2, color: "#fff", fontFamily: t.impact, fontSize: 52 * u, padding: `${14 * u}px ${30 * u}px`, borderRadius: 18 * u, boxShadow: `0 ${14 * u}px ${40 * u}px rgba(0,0,0,.45)`, display: "inline-block" }}>
            {o.emoji ? `${o.emoji} ` : ""}{o.text}
          </div>
        </div>
      );
    }
    case "headline":
      return (
        <div style={{ position: "absolute", left: pad * 0.6, right: pad * 0.6, top: o.position === "bottom" ? height * 0.7 : height * 0.1, display: "flex", justifyContent: "center", opacity: vis, transform: `translateY(${(1 - vis) * -40 * u}px)` }}>
          <div style={{ background: "#fff", color: "#000", fontFamily: t.display, fontWeight: 900, fontSize: 62 * u, lineHeight: 1.1, padding: `${16 * u}px ${30 * u}px`, borderRadius: 16 * u, textAlign: "center", boxShadow: `${10 * u}px ${10 * u}px 0 ${t.accent}` }}>
            {o.text}
          </div>
        </div>
      );
    case "stat": {
      const raw = String(o.value ?? o.text ?? "0");
      const m = raw.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
      const n = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
      const c = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp", easing: EASE.out });
      return (
        <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.16, display: "flex", justifyContent: "center", transform: `scale(${vis})` }}>
          <div style={{ background: "rgba(0,0,0,.72)", borderRadius: 28 * u, padding: `${20 * u}px ${44 * u}px`, textAlign: "center", border: `3px solid ${t.accent}` }}>
            <div style={{ fontFamily: t.impact, fontSize: 130 * u, color: t.accent, lineHeight: 1 }}>{m ? `${m[1]}${Math.round(n * c).toLocaleString()}${m[3]}` : raw}</div>
            {o.text && o.value != null && <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 34 * u, color: "#fff" }}>{o.text}</div>}
          </div>
        </div>
      );
    }
    case "cta":
      return (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: height * 0.12, display: "flex", justifyContent: "center", transform: `translateY(${(1 - vis) * 200 * u}px) scale(${1 + Math.max(0, Math.sin(frame / 5)) * 0.03})` }}>
          <div style={{ background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 900, fontSize: 52 * u, padding: `${24 * u}px ${56 * u}px`, borderRadius: 999, boxShadow: `0 ${16 * u}px ${50 * u}px rgba(0,0,0,.5)` }}>
            {o.text ?? "Cuba Sekarang"} →
          </div>
        </div>
      );
    case "broll":
      return (
        <div style={{ position: "absolute", left: width * 0.08, right: width * 0.08, top: height * 0.1, height: height * 0.42, borderRadius: t.radius * u, overflow: "hidden", transform: `scale(${0.85 + vis * 0.15}) rotate(${(1 - vis) * -4}deg)`, opacity: vis, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,.6)`, border: `${6 * u}px solid #fff` }}>
          {o.src && <Img src={asset(o.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + frame / 600})` }} />}
          {o.text && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24 * u, background: "linear-gradient(transparent, rgba(0,0,0,.8))", color: "#fff", fontFamily: t.display, fontWeight: 800, fontSize: 44 * u }}>{o.text}</div>}
        </div>
      );
    case "progress":
      return null; // handled globally
  }
  return null;
};

/* ------------- The UGC scene ------------- */
export const UGC: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const segs: Seg[] = s.segments?.length ? s.segments : [{ from: s.trimStart ?? 0, to: s.trimEnd ?? s.srcDuration ?? s.duration }];
  const words = React.useMemo(() => mapWords(s.words, segs), [s.words, segs]);
  const srcAR = s.videoWidth && s.videoHeight ? s.videoWidth / s.videoHeight : width / height;
  const outAR = width / height;
  const mismatch = Math.abs(srcAR - outAR) > 0.15;

  let acc = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {segs.map((g, i) => {
        const from = Math.round(acc * fps);
        const len = Math.max(1, Math.round((g.to - g.from) * fps));
        acc += g.to - g.from;
        // punch-in every other cut hides jump cuts (classic UGC edit)
        const zoom = s.autoZoom && segs.length > 1 && i % 2 === 1 ? 1.14 : 1;
        return (
          <Sequence key={i} from={from} durationInFrames={len} premountFor={Math.round(fps)}>
            <Clip src={asset(s.src)} startFrom={Math.round(g.from * fps)} zoom={zoom} mismatch={mismatch} volume={s.volume} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, transparent 20%, transparent 70%, rgba(0,0,0,.35) 100%)" }} />
      {(s.overlays as S[]).filter((o) => o.type !== "progress").map((o, i) => (
        <Sequence key={`o${i}`} from={Math.round(o.at * fps)} durationInFrames={Math.max(1, Math.round(o.duration * fps))} layout="none">
          <AbsoluteFill><Overlay o={o} /></AbsoluteFill>
        </Sequence>
      ))}
      {s.captions !== "off" && words.length > 0 && <Captions words={words} style={s.captions} position={s.captionPosition} />}
      {(s.overlays as S[]).some((o) => o.type === "progress") && (
        <div style={{ position: "absolute", left: 0, top: 0, height: 10 * u, width: `${(frame / Math.max(1, acc * fps)) * 100}%`, background: t.accent }} />
      )}
    </AbsoluteFill>
  );
};

const Clip: React.FC<{ src: string; startFrom: number; zoom: number; mismatch: boolean; volume: number }> = ({ src, startFrom, zoom, mismatch, volume }) => {
  const frame = useCurrentFrame();
  const drift = 1 + frame / 3000; // subtle life
  if (!src) return <AbsoluteFill style={{ background: "#222" }} />;
  return (
    <AbsoluteFill>
      {mismatch && (
        <AbsoluteFill style={{ filter: "blur(40px) brightness(.55)", transform: "scale(1.2)" }}>
          <OffthreadVideo src={src} startFrom={startFrom} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: `scale(${zoom * drift})` }}>
        <OffthreadVideo src={src} startFrom={startFrom} volume={volume} style={{ width: "100%", height: "100%", objectFit: mismatch ? "contain" : "cover" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
