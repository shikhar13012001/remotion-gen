// ─── Design tokens ────────────────────────────────────────────────────────────
// Single source of truth for themes, pacing, and style configuration.
// `orb` field removed — hue is now derived via hueFromAccent() in ShortsComposition.

export const THEMES = {
  mysterious: { bg: "#050312", p1: "#a78bfa", p2: "#818cf8", accent: "#c084fc" },
  energetic:  { bg: "#0a0400", p1: "#f97316", p2: "#eab308", accent: "#ef4444" },
  inspiring:  { bg: "#020d1c", p1: "#38bdf8", p2: "#34d399", accent: "#fbbf24" },
  dark:       { bg: "#0a0800", p1: "#c8a96e", p2: "#8b7340", accent: "#c8a96e" },
  calm:       { bg: "#030f0a", p1: "#34d399", p2: "#6ee7b7", accent: "#60a5fa" },
} as const;

export type Theme   = (typeof THEMES)[keyof typeof THEMES];
export type MoodKey = keyof typeof THEMES;

export const PACING_CONFIG = {
  slow:   { damping: 22, stiffness: 70,  hookFrames: 120, ctaFrames: 120, premount: 12 },
  medium: { damping: 16, stiffness: 120, hookFrames: 90,  ctaFrames: 90,  premount: 8  },
  fast:   { damping: 10, stiffness: 180, hookFrames: 60,  ctaFrames: 75,  premount: 4  },
} as const;

export type Pacing = (typeof PACING_CONFIG)[keyof typeof PACING_CONFIG];

export const STYLE_CONFIG = {
  cinematic: { particleCount: 16, orbOpacity: 0.18, orbSpeed: 0.8,  letterboxH: 64, grainOpacity: 0.10 },
  bold:      { particleCount: 28, orbOpacity: 0.25, orbSpeed: 1.3,  letterboxH: 0,  grainOpacity: 0.06 },
  minimal:   { particleCount: 8,  orbOpacity: 0.10, orbSpeed: 0.55, letterboxH: 0,  grainOpacity: 0.04 },
  neon:      { particleCount: 36, orbOpacity: 0.32, orbSpeed: 1.6,  letterboxH: 0,  grainOpacity: 0.08 },
} as const;

export type StyleConf = (typeof STYLE_CONFIG)[keyof typeof STYLE_CONFIG];
export type StyleKey  = keyof typeof STYLE_CONFIG;
