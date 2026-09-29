import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Backdrop, Card, EASE, Pill, Rise, WordReveal, fitSize, resolveAccent, useFadeOut, useLayout, useSpring, useTheme } from "../lib/kit";

export const asset = (src?: string) => (!src ? "" : /^(https?:|data:)/.test(src) ? src : staticFile(src.replace(/^\/+/, "")));

type S = Record<string, any>;

const Center: React.FC<{ children: React.ReactNode; gap?: number; align?: "center" | "flex-start" }> = ({ children, gap = 36, align = "center" }) => {
  const { pad, u } = useLayout();
  return (
    <AbsoluteFill style={{ padding: pad, justifyContent: "center", alignItems: align, flexDirection: "column", gap: gap * u }}>
      {children}
    </AbsoluteFill>
  );
};

const Sub: React.FC<{ text?: string; delay?: number; size?: number; align?: "center" | "left" }> = ({ text, delay = 14, size = 40, align = "center" }) => {
  const t = useTheme();
  const { u } = useLayout();
  if (!text) return null;
  return (
    <Rise delay={delay} style={{ fontFamily: t.body, fontWeight: 500, fontSize: size * u, color: t.muted, textAlign: align, lineHeight: 1.35, maxWidth: 880 * u }}>
      {text}
    </Rise>
  );
};

/* ---------------- HOOK: scroll-stopper opener ---------------- */
export const Hook: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const { u, landscape } = useLayout();
  const frame = useCurrentFrame();
  const shake = frame < 10 ? Math.sin(frame * 2.4) * (10 - frame) * 1.4 * u : 0;
  const flash = interpolate(frame, [0, 6], [0.55, 0], { extrapolateRight: "clamp" });
  const size = fitSize(s.headline, (landscape ? 150 : 160) * u, 0.45);
  const emo = useSpring(4, { damping: 9, stiffness: 180 });
  return (
    <AbsoluteFill>
      <Backdrop variant="mesh" seed={2} />
      <Center>
        {s.emoji && (
          <div style={{ fontSize: 150 * u, transform: `scale(${emo}) rotate(${(1 - emo) * -30}deg)` }}>{s.emoji}</div>
        )}
        <div style={{ transform: `translateX(${shake}px)` }}>
          <WordReveal text={s.headline} size={size} weight={900} highlight={s.highlight} stagger={2} />
        </div>
        <Sub text={s.sub} delay={12} size={44} />
      </Center>
      <AbsoluteFill style={{ background: t.accent, opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

/* ---------------- KINETIC TYPOGRAPHY ---------------- */
export const Kinetic: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u, landscape } = useLayout();
  const lines: string[] = s.lines;
  const per = Math.max(10, Math.floor((durationInFrames - 12) / lines.length));
  const cam = interpolate(frame, [0, durationInFrames], [1, 1.08]);
  return (
    <AbsoluteFill>
      <Backdrop variant="grid" seed={3} />
      <Center gap={18}>
        <div style={{ transform: `scale(${cam})`, display: "flex", flexDirection: "column", gap: 10 * u, alignItems: "center" }}>
          {lines.map((ln, i) => {
            const big = i % 2 === 0;
            const accent = i === lines.length - 1 && lines.length > 1;
            return (
              <WordReveal
                key={i}
                text={ln}
                delay={i * per * 0.55}
                size={fitSize(ln, (big ? (landscape ? 130 : 140) : 96) * u, 0.5)}
                weight={big ? 900 : 700}
                font={big ? t.impact : t.display}
                uppercase={big && t.impact !== t.display}
                color={accent ? t.accent : big ? t.text : t.muted}
                highlight={s.highlight}
              />
            );
          })}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- LOGO REVEAL ---------------- */
export const Logo: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const p = useSpring(4, { damping: 12, stiffness: 120 });
  const ring = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp", easing: EASE.out });
  const sweep = interpolate(frame, [18, 42], [-120, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const L = 300 * u;
  return (
    <AbsoluteFill>
      <Backdrop variant="spot" seed={5} />
      <Center gap={44}>
        <div style={{ position: "relative", width: L, height: L }}>
          <svg width={L * 1.5} height={L * 1.5} style={{ position: "absolute", left: -L * 0.25, top: -L * 0.25 }}>
            <circle cx={L * 0.75} cy={L * 0.75} r={L * 0.7} fill="none" stroke={t.accent} strokeWidth={4 * u}
              strokeDasharray={Math.PI * 2 * L * 0.7} strokeDashoffset={(1 - ring) * Math.PI * 2 * L * 0.7}
              transform={`rotate(-90 ${L * 0.75} ${L * 0.75})`} strokeLinecap="round" opacity={0.9} />
          </svg>
          <div style={{ width: L, height: L, borderRadius: t.radius * 1.4 * u, overflow: "hidden", transform: `scale(${p})`, boxShadow: `0 0 ${120 * u}px ${t.accent}55`, position: "relative" }}>
            {s.src ? <Img src={asset(s.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: t.accent }} />}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,.55) 50%, transparent 60%)`, transform: `translateX(${sweep}%)` }} />
          </div>
        </div>
        {s.headline && <WordReveal text={s.headline} size={fitSize(s.headline, 110 * u)} weight={900} delay={14} />}
        <Sub text={s.sub} delay={22} />
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- STAT COUNTER ---------------- */
export const Stat: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u } = useLayout();
  const c = interpolate(frame, [6, Math.min(durationInFrames * 0.6, 55)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const val = (s.value * c).toLocaleString("en-US", { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals });
  const done = useSpring(Math.min(durationInFrames * 0.6, 55), { damping: 8, stiffness: 200 });
  const txt = `${s.prefix}${val}${s.suffix}`;
  return (
    <AbsoluteFill>
      <Backdrop variant="mesh" seed={7} />
      <Center gap={24}>
        <Rise><Pill>{s.label || "Fakta"}</Pill></Rise>
        <div style={{ fontFamily: t.impact, fontSize: fitSize(txt, 260 * u, 0.45), color: resolveAccent(t, s.accent), lineHeight: 1, fontVariantNumeric: "tabular-nums", transform: `scale(${1 + done * 0.06 - (done > 0.99 ? 0.06 : 0)})`, textShadow: `0 0 ${80 * u}px ${resolveAccent(t, s.accent)}66` }}>
          {txt}
        </div>
        <Sub text={s.sub} delay={20} size={46} />
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- PRODUCT SHOWCASE ---------------- */
export const Product: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u, landscape, width } = useLayout();
  const p = useSpring(0, { damping: 14 });
  const float = Math.sin(frame / 18) * 12 * u;
  const rot = interpolate(frame, [0, durationInFrames], [-4, 4]);
  const imgSize = (landscape ? 620 : 680) * u;
  const img = s.src ? (
    <div style={{ position: "relative", transform: `translateY(${float + (1 - p) * 200 * u}px) rotate(${rot}deg) scale(${0.7 + p * 0.3})`, opacity: p }}>
      <div style={{ position: "absolute", inset: "12%", background: t.accent, filter: `blur(${120 * u}px)`, opacity: 0.45, borderRadius: "50%" }} />
      <Img src={asset(s.src)} style={{ width: imgSize, height: imgSize, objectFit: "contain", position: "relative", filter: `drop-shadow(0 ${40 * u}px ${60 * u}px rgba(0,0,0,.5))` }} />
    </div>
  ) : null;
  const text = (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 * u, alignItems: landscape ? "flex-start" : "center", maxWidth: landscape ? width * 0.42 : undefined }}>
      <WordReveal text={s.headline} size={fitSize(s.headline, 104 * u)} weight={900} delay={8} align={landscape ? "left" : "center"} />
      <Sub text={s.sub} delay={16} align={landscape ? "left" : "center"} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 * u, justifyContent: landscape ? "flex-start" : "center" }}>
        {(s.features as string[]).map((f, i) => (
          <Rise key={i} delay={22 + i * 5}>
            <Pill size={30 * u} bg={`${t.accent}22`} color={t.text}>
              <span style={{ color: t.accent }}>✦</span> {f}
            </Pill>
          </Rise>
        ))}
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Backdrop variant="spot" seed={9} />
      <AbsoluteFill style={{ padding: 80 * u, flexDirection: landscape ? "row" : "column", justifyContent: "center", alignItems: "center", gap: 50 * u }}>
        {img}
        {text}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- BULLETS ---------------- */
export const Bullets: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const { u } = useLayout();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items: string[] = s.items;
  const gap = Math.max(5, Math.min(12, Math.floor((durationInFrames * 0.5) / Math.max(1, items.length))));
  return (
    <AbsoluteFill>
      <Backdrop variant="grid" seed={11} />
      <Center gap={40}>
        {s.headline && <WordReveal text={s.headline} size={fitSize(s.headline, 96 * u)} weight={900} highlight={s.highlight} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 * u, width: "100%", maxWidth: 900 * u }}>
          {items.map((it, i) => {
            const d = 10 + i * gap;
            const tick = interpolate(frame - d, [6, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const mark = s.icon === "number" ? String(i + 1) : s.icon === "arrow" ? "→" : s.icon === "dot" ? "•" : "";
            return (
              <Rise key={i} delay={d} y={0} style={{ transform: undefined }}>
                <SlideIn delay={d}>
                  <Card style={{ display: "flex", alignItems: "center", gap: 26 * u, padding: `${26 * u}px ${34 * u}px` }}>
                    <div style={{ width: 62 * u, height: 62 * u, flexShrink: 0, borderRadius: 18 * u, background: t.accent, color: t.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.display, fontWeight: 900, fontSize: 34 * u }}>
                      {mark || (
                        <svg width={34 * u} height={34 * u} viewBox="0 0 24 24">
                          <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={t.onAccent} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={26} strokeDashoffset={26 * (1 - tick)} />
                        </svg>
                      )}
                    </div>
                    <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 44 * u, color: t.text, lineHeight: 1.2 }}>{it}</div>
                  </Card>
                </SlideIn>
              </Rise>
            );
          })}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const SlideIn: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const p = useSpring(delay);
  const { u } = useLayout();
  return <div style={{ transform: `translateX(${(1 - p) * -140 * u}px)` }}>{children}</div>;
};

/* ---------------- COMPARE (before / after) ---------------- */
export const Compare: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { u, landscape } = useLayout();
  const wipe = interpolate(frame, [8, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  const Side = ({ d, good, i }: { d: S; good: boolean; i: number }) => (
    <Rise delay={10 + i * 10} style={{ flex: 1, display: "flex" }}>
      <Card style={{ flex: 1, padding: 40 * u, display: "flex", flexDirection: "column", gap: 20 * u, borderColor: good ? t.accent : undefined, borderWidth: good ? 3 : 1.5, opacity: good ? 1 : 0.78, background: good ? undefined : `${t.surface}88`, transform: good ? `scale(${1 + wipe * 0.04})` : undefined }}>
        <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 52 * u, color: good ? t.accent : t.muted, display: "flex", alignItems: "center", gap: 14 * u }}>
          <span>{good ? "✓" : "✕"}</span>
          <span style={{ textDecoration: !good && wipe > 0.5 ? "line-through" : undefined }}>{d.label}</span>
        </div>
        {d.src && <Img src={asset(d.src)} style={{ width: "100%", height: 360 * u, objectFit: "cover", borderRadius: t.radius * 0.6 * u, filter: good ? undefined : "grayscale(1)" }} />}
        {(d.items as string[]).map((x, j) => (
          <Rise key={j} delay={20 + i * 10 + j * 5} style={{ fontFamily: t.body, fontSize: 36 * u, color: good ? t.text : t.muted, fontWeight: 600 }}>
            {x}
          </Rise>
        ))}
      </Card>
    </Rise>
  );
  return (
    <AbsoluteFill>
      <Backdrop variant="mesh" seed={13} />
      <Center gap={36}>
        {s.headline && <WordReveal text={s.headline} size={fitSize(s.headline, 90 * u)} weight={900} />}
        <div style={{ display: "flex", flexDirection: landscape ? "row" : "column", gap: 26 * u, width: "100%", maxWidth: landscape ? 1600 * u : 920 * u, position: "relative" }}>
          <Side d={s.left} good={false} i={0} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${wipe})`, zIndex: 5, width: 110 * u, height: 110 * u, borderRadius: "50%", background: t.accent2, color: "#fff", fontFamily: t.impact, fontSize: 46 * u, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 ${10 * u}px ${t.bg}` }}>VS</div>
          <Side d={s.right} good={true} i={1} />
        </div>
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- QUOTE / TESTIMONIAL ---------------- */
export const Quote: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const { u } = useLayout();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop variant="spot" seed={15} />
      <Center gap={40}>
        <Card style={{ padding: `${70 * u}px ${60 * u}px`, maxWidth: 940 * u, display: "flex", flexDirection: "column", gap: 34 * u, position: "relative" }}>
          <div style={{ position: "absolute", top: -70 * u, left: 40 * u, fontFamily: "Georgia, serif", fontSize: 260 * u, lineHeight: 1, color: t.accent, opacity: 0.9 }}>“</div>
          <div style={{ display: "flex", gap: 8 * u }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const p = spring({ frame: frame - 6 - i * 3, fps: 30, config: { damping: 9, stiffness: 200 } });
              return <span key={i} style={{ fontSize: 50 * u, transform: `scale(${p})`, display: "inline-block", color: i < s.rating ? "#ffc53d" : `${t.text}33` }}>★</span>;
            })}
          </div>
          <WordReveal text={s.quote} size={fitSize(s.quote, 62 * u, 0.55)} weight={700} align="left" stagger={1.5} delay={8} lineHeight={1.25} font={t.body} />
          <Rise delay={24} style={{ display: "flex", alignItems: "center", gap: 22 * u }}>
            {s.avatar ? (
              <Img src={asset(s.avatar)} style={{ width: 90 * u, height: 90 * u, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 90 * u, height: 90 * u, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.display, fontWeight: 900, fontSize: 40 * u, color: t.onAccent }}>
                {(s.author || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontFamily: t.display, fontWeight: 800, fontSize: 38 * u, color: t.text }}>{s.author}</div>
              {s.role && <div style={{ fontFamily: t.body, fontSize: 30 * u, color: t.muted }}>{s.role}</div>}
            </div>
          </Rise>
        </Card>
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- STEPS ---------------- */
export const Steps: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u } = useLayout();
  const items: string[] = s.items;
  const per = Math.floor((durationInFrames * 0.65) / Math.max(1, items.length));
  const line = interpolate(frame, [10, 10 + per * items.length], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop variant="grid" seed={17} />
      <Center gap={50}>
        {s.headline && <WordReveal text={s.headline} size={fitSize(s.headline, 96 * u)} weight={900} />}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 44 * u, maxWidth: 880 * u, width: "100%" }}>
          <div style={{ position: "absolute", left: 44 * u, top: 44 * u, bottom: 44 * u, width: 6 * u, background: `${t.text}1a`, borderRadius: 6 }}>
            <div style={{ width: "100%", height: `${line * 100}%`, background: `linear-gradient(${t.accent}, ${t.accent2})`, borderRadius: 6 }} />
          </div>
          {items.map((it, i) => {
            const d = 10 + i * per;
            const p = spring({ frame: frame - d, fps: 30, config: { damping: 11, stiffness: 180 } });
            const on = frame >= d;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 34 * u, position: "relative" }}>
                <div style={{ width: 94 * u, height: 94 * u, flexShrink: 0, borderRadius: "50%", background: on ? t.accent : t.surface, color: on ? t.onAccent : t.muted, border: `3px solid ${t.accent}`, fontFamily: t.impact, fontSize: 48 * u, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + p * 0.4})` }}>
                  {i + 1}
                </div>
                <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 46 * u, color: t.text, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 60 * u}px)` }}>{it}</div>
              </div>
            );
          })}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- CHART ---------------- */
export const Chart: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const data: { label: string; value: number }[] = s.data;
  const max = Math.max(...data.map((d) => d.value), 1e-9);
  const dec = Math.min(2, Math.max(0, ...data.map((d) => (String(d.value).split(".")[1] || "").length)));
  const H = 700 * u;
  const colors = [t.muted, t.accent3, t.accent2, t.accent];
  return (
    <AbsoluteFill>
      <Backdrop variant="grid" seed={19} />
      <Center gap={50}>
        {s.headline && <WordReveal text={s.headline} size={fitSize(s.headline, 90 * u)} weight={900} />}
        <Card style={{ padding: `${50 * u}px ${40 * u}px ${30 * u}px`, width: "100%", maxWidth: 940 * u }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: H, gap: 18 * u }}>
            {data.map((d, i) => {
              const p = spring({ frame: frame - 10 - i * 5, fps: 30, config: { damping: 18, stiffness: 90 } });
              const h = (d.value / max) * (H - 110 * u) * p;
              const best = d.value === max;
              const c = best ? t.accent : colors[i % 3];
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * u }}>
                  <div style={{ fontFamily: t.impact, fontSize: 44 * u, color: best ? t.accent : t.text, opacity: p }}>
                    {(d.value * p).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}{s.suffix}
                  </div>
                  <div style={{ width: "100%", height: h, background: `linear-gradient(180deg, ${c}, ${c}66)`, borderRadius: `${16 * u}px ${16 * u}px ${4 * u}px ${4 * u}px`, boxShadow: best ? `0 0 ${60 * u}px ${t.accent}66` : undefined }} />
                  <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 30 * u, color: t.muted, whiteSpace: "nowrap" }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- PRICE / OFFER ---------------- */
export const Price: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const slam = useSpring(14, { damping: 8, stiffness: 220, mass: 0.6 });
  const strike = interpolate(frame, [8, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeRot = Math.sin(frame / 8) * 6;
  return (
    <AbsoluteFill>
      <Backdrop variant="mesh" seed={21} />
      <Center gap={30}>
        <WordReveal text={s.headline} size={fitSize(s.headline, 100 * u)} weight={900} />
        {s.oldPrice && (
          <Rise delay={4} style={{ position: "relative", fontFamily: t.display, fontWeight: 700, fontSize: 70 * u, color: t.muted }}>
            {s.oldPrice}
            <div style={{ position: "absolute", left: -8 * u, right: -8 * u, top: "52%", height: 7 * u, background: t.accent2, transformOrigin: "left", transform: `scaleX(${strike}) rotate(-6deg)`, borderRadius: 4 }} />
          </Rise>
        )}
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: t.impact, fontSize: fitSize(s.price, 230 * u, 0.5), color: t.accent, lineHeight: 1, transform: `scale(${0.3 + slam * 0.7})`, opacity: Math.min(1, slam * 2), textShadow: `0 0 ${90 * u}px ${t.accent}77` }}>
            {s.price}
          </div>
          {s.badge && (
            <div style={{ position: "absolute", right: -150 * u, top: -110 * u, transform: `rotate(${12 + badgeRot}deg) scale(${slam})`, background: t.accent2, color: "#fff", borderRadius: "50%", width: 170 * u, height: 170 * u, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: t.impact, fontSize: 38 * u, lineHeight: 1.05, padding: 14 * u, boxShadow: `0 ${20 * u}px ${50 * u}px rgba(0,0,0,.4)` }}>
              {s.badge}
            </div>
          )}
        </div>
        <Sub text={s.sub} delay={24} size={42} />
      </Center>
    </AbsoluteFill>
  );
};

/* ---------------- IMAGE (Ken Burns) ---------------- */
export const ImageScene: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u, pad } = useLayout();
  const k = interpolate(frame, [0, durationInFrames], [0, 1]);
  const scale = s.move === "out" ? 1.18 - k * 0.14 : 1.04 + k * 0.14;
  const tx = s.move === "left" ? -k * 6 : s.move === "right" ? k * 6 : 0;
  return (
    <AbsoluteFill style={{ background: t.bg }}>
      {s.src && <Img src={asset(s.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale}) translateX(${tx}%)` }} />}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 45%, ${t.bg}ee 100%)` }} />
      {(s.headline || s.sub) && (
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: pad, paddingBottom: pad * 2.2, gap: 20 * u }}>
          {s.headline && <WordReveal text={s.headline} size={fitSize(s.headline, 96 * u)} weight={900} align="left" delay={6} />}
          <Sub text={s.sub} align="left" delay={14} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/* ---------------- CTA ---------------- */
export const CTA: React.FC<{ s: S }> = ({ s }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const b = useSpring(16, { damping: 10, stiffness: 160 });
  const pulse = 1 + Math.max(0, Math.sin((frame - 30) / 6)) * 0.04 * (frame > 30 ? 1 : 0);
  const shine = ((frame * 3) % 260) - 80;
  const tap = interpolate(frame % 45, [0, 10, 20], [1, 0.85, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop variant="mesh" seed={23} />
      <Center gap={44}>
        <WordReveal text={s.headline} size={fitSize(s.headline, 118 * u, 0.5)} weight={900} highlight={s.highlight} />
        <Sub text={s.sub} delay={10} size={42} />
        <div style={{ transform: `scale(${b * pulse})`, position: "relative" }}>
          <div style={{ position: "relative", overflow: "hidden", background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 900, fontSize: 58 * u, padding: `${34 * u}px ${80 * u}px`, borderRadius: 999, boxShadow: `0 ${24 * u}px ${70 * u}px ${t.accent}66` }}>
            {s.button} →
            <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", left: `${shine}%`, background: "linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent)" }} />
          </div>
          {frame > 30 && <div style={{ position: "absolute", right: -30 * u, bottom: -70 * u, fontSize: 110 * u, transform: `scale(${tap}) rotate(-15deg)` }}>👆</div>}
        </div>
        {s.url && (
          <Rise delay={26}>
            <Pill size={36 * u}>🌐 {s.url}</Pill>
          </Rise>
        )}
      </Center>
    </AbsoluteFill>
  );
};

export const _unused = { Card, useFadeOut, EASE };
