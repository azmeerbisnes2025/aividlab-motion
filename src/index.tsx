import React from "react";
import { AbsoluteFill, Audio, Composition, registerRoot, Series, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { getTheme } from "./lib/theme";
import { ThemeCtx, useLayout, useTheme } from "./lib/kit";
import * as Sc from "./scenes";
import { UGC } from "./ugc/UGC";
import { normalizeSpec, totalFrames } from "./spec/normalize.js";
import demo from "../examples/demo-aividlab.json";

const MAP: Record<string, React.FC<{ s: any }>> = {
  hook: Sc.Hook,
  kinetic: Sc.Kinetic,
  logo: Sc.Logo,
  stat: Sc.Stat,
  product: Sc.Product,
  bullets: Sc.Bullets,
  compare: Sc.Compare,
  quote: Sc.Quote,
  steps: Sc.Steps,
  chart: Sc.Chart,
  price: Sc.Price,
  image: Sc.ImageScene,
  cta: Sc.CTA,
  ugc: UGC,
};

const zoomPresentation = () => ({
  component: ({ children, presentationDirection, presentationProgress }: any) => {
    const p = presentationProgress;
    const scale = presentationDirection === "entering" ? interpolate(p, [0, 1], [1.25, 1]) : interpolate(p, [0, 1], [1, 0.85]);
    const opacity = presentationDirection === "entering" ? p : 1 - p;
    return <AbsoluteFill style={{ transform: `scale(${scale})`, opacity, filter: `blur(${(presentationDirection === "entering" ? 1 - p : p) * 14}px)` }}>{children}</AbsoluteFill>;
  },
  props: {},
});

const pres = (name: string, i: number): any => {
  const dirs = ["from-right", "from-bottom", "from-left", "from-top"] as const;
  switch (name) {
    case "fade": return fade();
    case "wipe": return wipe({ direction: dirs[i % 4] });
    case "zoom": return zoomPresentation();
    default: return slide({ direction: i % 2 ? "from-bottom" : "from-right" });
  }
};

const Watermark: React.FC<{ text: string }> = ({ text }) => {
  const t = useTheme();
  const { u, pad } = useLayout();
  return (
    <div style={{ position: "absolute", right: pad * 0.5, top: pad * 0.5, fontFamily: t.body, fontWeight: 800, fontSize: 26 * u, color: "#fff", opacity: 0.8, background: "rgba(0,0,0,.35)", padding: `${8 * u}px ${18 * u}px`, borderRadius: 999, letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: 10 * u }}>
      <span style={{ width: 14 * u, height: 14 * u, borderRadius: "50%", background: t.accent, display: "inline-block" }} />
      {text}
    </div>
  );
};

const Progress: React.FC = () => {
  const t = useTheme();
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u } = useLayout();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 8 * u, width: `${(f / durationInFrames) * 100}%`, background: t.accent }} />;
};

export const Motion: React.FC<{ spec: any }> = ({ spec: raw }) => {
  const spec = React.useMemo(() => (raw && raw.width ? raw : normalizeSpec(raw).spec), [raw]);
  const theme = getTheme(spec.theme);
  const fps = spec.fps;
  const trF = Math.round(spec.transitionDuration * fps);
  return (
    <ThemeCtx.Provider value={theme}>
      <AbsoluteFill style={{ background: theme.bg }}>
        <TransitionSeries>
          {spec.scenes.map((s: any, i: number) => {
            const C = MAP[s.type] ?? Sc.Kinetic;
            const tr = s.transition ?? spec.transition;
            const els = [];
            if (i > 0 && tr !== "none") {
              els.push(
                <TransitionSeries.Transition
                  key={`t${i}`}
                  presentation={pres(tr, i)}
                  timing={tr === "slide" ? springTiming({ config: { damping: 200 }, durationInFrames: trF }) : linearTiming({ durationInFrames: trF })}
                />,
              );
            }
            els.push(
              <TransitionSeries.Sequence key={`s${i}`} durationInFrames={Math.max(1, Math.round(s.duration * fps))}>
                <C s={s} />
              </TransitionSeries.Sequence>,
            );
            return els;
          })}
        </TransitionSeries>
        {spec.music?.src && <Audio src={Sc.asset(spec.music.src)} volume={(f: number) => Math.min(1, f / 15) * Number(spec.music.volume)} loop />}
        {spec.voiceover?.src && <Audio src={Sc.asset(spec.voiceover.src)} volume={spec.voiceover.volume} />}
        {spec.progressBar && <Progress />}
        {spec.watermark && <Watermark text={spec.watermarkText} />}
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};

const Root: React.FC = () => {
  const d = normalizeSpec(demo).spec;
  return (
    <Composition
      id="Motion"
      component={Motion as any}
      durationInFrames={totalFrames(d)}
      fps={d.fps}
      width={d.width}
      height={d.height}
      defaultProps={{ spec: d }}
      calculateMetadata={({ props }: any) => {
        const s = normalizeSpec(props.spec).spec;
        return { durationInFrames: totalFrames(s), fps: s.fps, width: s.width, height: s.height, props: { spec: s } };
      }}
    />
  );
};

void Series;
registerRoot(Root);
