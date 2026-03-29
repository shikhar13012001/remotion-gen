import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// Re-export VideoBackground so existing consumers keep working
export { VideoBackground } from "./videoOverlays";
export type { VideoBackgroundProps } from "./videoOverlays";

// ─── Grain overlay ─────────────────────────────────────────────────────────

export interface GrainOverlayProps { frame: number; opacity?: number; }

export const GrainOverlay: React.FC<GrainOverlayProps> = ({ frame, opacity = 0.04 }) => {
  const id = `grain-${frame}`;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id={id} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4"
            seed={frame} stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </div>
  );
};

// ─── Vignette overlay ──────────────────────────────────────────────────────

export interface VignetteOverlayProps { intensity?: number; }

export const VignetteOverlay: React.FC<VignetteOverlayProps> = ({ intensity = 0.6 }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    background: `radial-gradient(ellipse 90% 90% at 50% 50%, transparent 28%, rgba(0,0,0,${intensity}) 100%)`,
  }} />
);

// ─── Bottom readability gradient ───────────────────────────────────────────

export interface BottomReadabilityGradientProps { bg: string; }

export const BottomReadabilityGradient: React.FC<BottomReadabilityGradientProps> = ({ bg }) => (
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
    background: `linear-gradient(to bottom, transparent 0%, ${bg}cc 42%, ${bg} 100%)`,
    pointerEvents: "none",
  }} />
);

// ─── Letterbox overlay ─────────────────────────────────────────────────────

export interface LetterboxOverlayProps { height: number; frame: number; }

export const LetterboxOverlay: React.FC<LetterboxOverlayProps> = ({ height, frame }) => {
  if (height <= 0) return null;
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height,
        background: "#000", zIndex: 10, opacity }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height,
        background: "#000", zIndex: 10, opacity }} />
    </>
  );
};

// ─── Progress dots ─────────────────────────────────────────────────────────

export interface ProgressDotsProps { total: number; active: number; frame: number; }

export const ProgressDots: React.FC<ProgressDotsProps> = ({ total, active, frame }) => {
  if (total <= 1) return null;
  return (
    <div style={{
      position: "absolute", bottom: 52, left: 0, right: 0,
      display: "flex", justifyContent: "center", gap: 10,
      opacity: interpolate(frame, [0, 12], [0, 0.55], { extrapolateRight: "clamp" }),
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: "50%",
          background: i === active ? "#f0f0f0" : "rgba(255,255,255,0.22)",
        }} />
      ))}
    </div>
  );
};
