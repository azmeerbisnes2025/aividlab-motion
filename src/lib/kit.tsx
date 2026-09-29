import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing, random } from "remotion";
import { Theme } from "./theme";

export const ThemeCtx = React.createContext<Theme>(null as unknown as Theme);
export const useTheme = () => React.useContext(ThemeCtx);

/** Layout helper: scales everything off the short edge so 9:16, 1:1, 16:9 all look right. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const short = Math.min(width, height);
  const u = short / 1080; // 1 unit = 1px at 1080 short edge
  const portrait = height > width * 1.1;
  const landscape = width > height * 1.1;
  return { width, height, u, portrait, landscape, pad: 80 * u };
};

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

/** Standard spring used everywhere, so motion feels consistent. */
export const useSpring = (delay = 0, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140, mass: 0.8, ...cfg } });
};

export const useFadeOut = (frames = 10) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - frames, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/** Rise + fade + slight blur in. The signature entrance. */
export const Rise: React.FC<{ delay?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties; blur?: boolean }> = ({
  delay = 0,
  y = 40,
  children,
  style,
  blur = true,
}) => {
  const p = useSpring(delay);
  const { u } = useLayout();
  return (
    <div
      style={{
        transform: `translateY(${(1 - p) * y * u}px)`,
        opacity: Math.min(1, p * 1.4),
        filter: blur ? `blur(${(1 - Math.min(1, p)) * 12}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Word-by-word reveal with mask; highlight words matching `highlight` (case-insens). */
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  size: number;
  weight?: number;
  font?: string;
  color?: string;
  highlight?: string;
  align?: "left" | "center";
  lineHeight?: number;
  uppercase?: boolean;
}> = ({ text, delay = 0, stagger = 3, size, weight = 800, font, color, highlight, align = "center", lineHeight = 1.05, uppercase }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hl = (highlight ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        fontFamily: font ?? t.display,
        fontSize: size,
        fontWeight: weight,
        lineHeight,
        color: color ?? t.text,
        textAlign: align,
        letterSpacing: "-0.02em",
        textTransform: uppercase ? "uppercase" : undefined,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.26,
      }}
    >
      {words.map((w, i) => {
        const p = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 18, stiffness: 170, mass: 0.7 } });
        const isHl = hl.some((h) => w.toLowerCase().replace(/[^\p{L}\p{N}%]/gu, "").includes(h.replace(/[^\p{L}\p{N}%]/gu, "")) && h.length > 1);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.08, marginBottom: -size * 0.08 }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 6}deg)`,
                color: isHl ? t.accent : undefined,
                position: "relative",
              }}
            >
              {isHl && (
                <span
                  style={{
                    position: "absolute",
                    left: "-4%",
                    right: "-4%",
                    bottom: "8%",
                    height: "22%",
                    background: t.accent2,
                    opacity: 0.35,
                    transformOrigin: "left",
                    transform: `scaleX(${interpolate(frame - delay - i * stagger, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out })})`,
                    zIndex: -1,
                    borderRadius: 6,
                  }}
                />
              )}
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Animated background: gradient mesh blobs + grid + film grain. Never static. */
export const Backdrop: React.FC<{ variant?: "mesh" | "grid" | "spot" | "plain"; seed?: number }> = ({ variant = "mesh", seed = 1 }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { width, height, u } = useLayout();
  const blobs = [t.accent2, t.accent3, t.accent].map((c, i) => {
    const r = random(`b${seed}${i}`);
    const x = width * (0.2 + 0.6 * r) + Math.sin(frame / (40 + i * 13) + i) * 120 * u;
    const y = height * (0.2 + 0.6 * random(`y${seed}${i}`)) + Math.cos(frame / (50 + i * 11) + i) * 140 * u;
    return { c, x, y, s: (600 + i * 180) * u };
  });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${t.bg} 0%, ${t.bg2} 100%)`, overflow: "hidden" }}>
      {variant !== "plain" &&
        blobs.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x - b.s / 2,
              top: b.y - b.s / 2,
              width: b.s,
              height: b.s,
              borderRadius: "50%",
              background: b.c,
              opacity: variant === "spot" ? 0.18 : 0.22 - i * 0.04,
              filter: `blur(${160 * u}px)`,
            }}
          />
        ))}
      {(variant === "grid" || variant === "mesh") && (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${t.text}10 1px, transparent 1px), linear-gradient(90deg, ${t.text}10 1px, transparent 1px)`,
            backgroundSize: `${90 * u}px ${90 * u}px`,
            backgroundPosition: `0 ${(frame * 0.6 * u) % (90 * u)}px`,
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            opacity: variant === "grid" ? 0.9 : 0.45,
          }}
        />
      )}
      <Grain amount={t.grain} />
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{ amount: number }> = ({ amount }) => {
  const frame = useCurrentFrame();
  const id = `g${frame % 4}`;
  return (
    <AbsoluteFill style={{ opacity: amount, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 4} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Pill / chip */
export const Pill: React.FC<{ children: React.ReactNode; color?: string; bg?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color,
  bg,
  size = 30,
  style,
}) => {
  const t = useTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.4,
        padding: `${size * 0.35}px ${size * 0.8}px`,
        borderRadius: 999,
        background: bg ?? `${t.text}14`,
        border: `1.5px solid ${t.text}22`,
        color: color ?? t.text,
        fontFamily: t.body,
        fontWeight: 700,
        fontSize: size,
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Glass card */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const t = useTheme();
  const { u } = useLayout();
  const light = isLight(t.bg);
  return (
    <div
      style={{
        background: light ? `${t.surface}ee` : `${t.surface}cc`,
        border: `1.5px solid ${t.text}${light ? "14" : "1c"}`,
        borderRadius: t.radius * u,
        boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,${light ? 0.12 : 0.45})`,
        backdropFilter: "blur(20px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

export const resolveAccent = (t: Theme, a?: string) => (a === "accent2" ? t.accent2 : a === "accent3" ? t.accent3 : t.accent);

/** Fit headline size to text length so long lines never overflow. */
export const fitSize = (text: string | undefined, base: number, minRatio = 0.5) => {
  const len = (text ?? "").length;
  if (len <= 14) return base;
  const r = Math.max(minRatio, Math.sqrt(14 / len) * 1.08);
  return base * Math.min(1, r);
};
