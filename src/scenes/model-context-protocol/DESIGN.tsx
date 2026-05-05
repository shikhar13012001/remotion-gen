import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import tokensJson from "../../../data/output/design_tokens.json";

// ── Token adapter — reads data/output/design_tokens.json, never copied constants ──
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const t = tokensJson;

export const DESIGN = {
  bg:         t.background,
  surface:    t.surface,
  textOn:     t.textOn,
  textMuted:  t.textMuted,
  accent:     t.accent,
  accentDim:  hexToRgba(t.accent, 0.25),
  accentGlow: hexToRgba(t.accent, 0.08),
  border:     t.border,
  grid:       "rgba(0,0,0,0.06)",
  fontDisplay: t.fontDisplay,
  fontBody:    t.fontBody,
  fontMono:    t.fontMono,
  // Typography scales for 1080×1920
  display: { fontSize: "72px",  fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.025em" },
  body:    { fontSize: "40px",  fontWeight: 400, lineHeight: 1.5, letterSpacing: "0px"     },
  caption: { fontSize: "20px",  fontWeight: 400, lineHeight: 1.4, letterSpacing: "0.12em" },
  stat:    { fontSize: "140px", fontWeight: 700, lineHeight: 1,   letterSpacing: "-0.04em" },
} as const;

// ── Common scene props ─────────────────────────────────────────────────────────
export interface SceneProps {
  text: string;
  highlightWords: string[];
  dataValue: number | null;
  durationInFrames: number;
}

// ── Background Components (light-surface versions) ─────────────────────────────
export const BgSignal: React.FC = () => (
  <AbsoluteFill style={{
    background: DESIGN.bg,
    backgroundImage: `linear-gradient(${DESIGN.grid} 1px, transparent 1px),
                      linear-gradient(90deg, ${DESIGN.grid} 1px, transparent 1px)`,
    backgroundSize: "54px 54px",
  }} />
);

export const BgFlare: React.FC = () => (
  <AbsoluteFill style={{ background: DESIGN.bg, overflow: "hidden" }}>
    <div style={{
      position: "absolute", width: "600px", height: "600px",
      background: `radial-gradient(circle, ${DESIGN.accentGlow} 0%, transparent 65%)`,
      borderRadius: "50%", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)", filter: "blur(80px)",
      pointerEvents: "none",
    }} />
  </AbsoluteFill>
);

export const BgClean: React.FC = () => (
  <AbsoluteFill style={{ background: DESIGN.bg }} />
);

// ── Word-reveal utility ────────────────────────────────────────────────────────
export function matchWord(word: string, highlights: string[]): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[^\w]/g, "");
  return highlights.some(hw =>
    hw.toLowerCase().split(/\s+/).some(part => clean(part) === clean(word))
  );
}

interface WordRevealProps {
  words: string[];
  highlightWords: string[];
  frame: number;
  startFrame?: number;
  stagger?: number;
  fontSize: string;
  fontWeight: number;
  fontFamily?: string;
  lineHeight?: number;
  color?: string;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  words, highlightWords, frame, startFrame = 0, stagger = 3,
  fontSize, fontWeight, fontFamily, lineHeight = 1.5, color = DESIGN.textOn,
}) => (
  <div style={{ fontSize, fontWeight, lineHeight, color, fontFamily: fontFamily ?? DESIGN.fontBody }}>
    {words.map((word, i) => {
      const wf = Math.max(0, frame - (startFrame + i * stagger));
      const op = interpolate(wf, [0, 10], [0, 1], { extrapolateRight: "clamp" });
      const y  = interpolate(wf, [0, 10], [6, 0],  { extrapolateRight: "clamp" });
      const isHL = matchWord(word, highlightWords);
      return (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.25em",
          opacity: op, transform: `translateY(${y}px)`,
          color: isHL ? DESIGN.accent : color,
          fontWeight: isHL ? (fontWeight >= 600 ? 700 : fontWeight + 100) : fontWeight,
        }}>
          {word}
        </span>
      );
    })}
  </div>
);
