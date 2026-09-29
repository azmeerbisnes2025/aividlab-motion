import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const inter = loadInter("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin"] });
const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const space = loadSpace("normal", { weights: ["500", "700"], subsets: ["latin"] });
const playfair = loadPlayfair("normal", { weights: ["700", "900"], subsets: ["latin"] });
const poppins = loadPoppins("normal", { weights: ["600", "800", "900"], subsets: ["latin"] });

export type Theme = {
  name: string;
  bg: string;
  bg2: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  accent3: string;
  onAccent: string;
  display: string; // headline font
  body: string;
  impact: string; // caption / slam font
  radius: number;
  grain: number;
};

/**
 * Design tokens are LOCKED here on purpose: the LLM only picks a theme name,
 * never raw colours or fonts. This is what keeps output from weak models clean.
 */
export const THEMES: Record<string, Theme> = {
  aividlab: {
    name: "aividlab",
    bg: "#0f1014",
    bg2: "#171923",
    surface: "#1c1f2b",
    text: "#e9ebf2",
    muted: "#9ba1b2",
    accent: "#bce85a",
    accent2: "#8b7cff",
    accent3: "#56cfe1",
    onAccent: "#0f1014",
    display: inter.fontFamily,
    body: inter.fontFamily,
    impact: anton.fontFamily,
    radius: 28,
    grain: 0.06,
  },
  midnight: {
    name: "midnight",
    bg: "#050816",
    bg2: "#0b1236",
    surface: "#121a45",
    text: "#f4f6ff",
    muted: "#8f9bd1",
    accent: "#4f8cff",
    accent2: "#b36bff",
    accent3: "#39e0c5",
    onAccent: "#ffffff",
    display: space.fontFamily,
    body: inter.fontFamily,
    impact: anton.fontFamily,
    radius: 24,
    grain: 0.05,
  },
  sunset: {
    name: "sunset",
    bg: "#1a0b16",
    bg2: "#3a1025",
    surface: "#4a1a30",
    text: "#fff4ec",
    muted: "#e0b3a8",
    accent: "#ff8a3d",
    accent2: "#ff4f7b",
    accent3: "#ffd23f",
    onAccent: "#1a0b16",
    display: poppins.fontFamily,
    body: poppins.fontFamily,
    impact: anton.fontFamily,
    radius: 32,
    grain: 0.07,
  },
  luxe: {
    name: "luxe",
    bg: "#0c0b09",
    bg2: "#1b1813",
    surface: "#24201a",
    text: "#f6efe1",
    muted: "#b3a68c",
    accent: "#d8b26e",
    accent2: "#f1dcae",
    accent3: "#8a6d3b",
    onAccent: "#0c0b09",
    display: playfair.fontFamily,
    body: inter.fontFamily,
    impact: playfair.fontFamily,
    radius: 6,
    grain: 0.08,
  },
  candy: {
    name: "candy",
    bg: "#fff5fb",
    bg2: "#ffe3f3",
    surface: "#ffffff",
    text: "#2a1036",
    muted: "#8a6b96",
    accent: "#ff3d9a",
    accent2: "#7a5cff",
    accent3: "#00c2a8",
    onAccent: "#ffffff",
    display: poppins.fontFamily,
    body: poppins.fontFamily,
    impact: poppins.fontFamily,
    radius: 36,
    grain: 0.03,
  },
  mono: {
    name: "mono",
    bg: "#f4f4f0",
    bg2: "#e8e8e2",
    surface: "#ffffff",
    text: "#0a0a0a",
    muted: "#6b6b66",
    accent: "#0a0a0a",
    accent2: "#ff3b1f",
    accent3: "#6b6b66",
    onAccent: "#f4f4f0",
    display: space.fontFamily,
    body: inter.fontFamily,
    impact: anton.fontFamily,
    radius: 0,
    grain: 0.04,
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export const getTheme = (name?: string): Theme => THEMES[name ?? "aividlab"] ?? THEMES.aividlab;
