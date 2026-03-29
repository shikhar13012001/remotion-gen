import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { VignetteOverlay } from "../lib/overlays";
import { TOKEN } from "../../packages/video-renderer/src/tokens";
import type { Pacing } from "../lib/tokens";

export interface TransitionWipeSceneProps {
  label:            string;
  accent:           string;
  durationInFrames: number;
  pacing:           Pacing;
}

export const TransitionWipeScene: React.FC<TransitionWipeSceneProps> = ({
  label, accent, durationInFrames, pacing,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // White flash at frame 0 — 2 frames to white then cut
  const flashOp = interpolate(frame, [0, 1, 3], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeIn  = interpolate(frame, [2, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineProgress = spring({
    frame: Math.max(0, frame - 4), fps,
    config: { damping: pacing.damping + 4, stiffness: pacing.stiffness * 0.8 },
    durationInFrames: 20,
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 240]);

  const textProg = spring({
    frame: Math.max(0, frame - 10), fps,
    config: { damping: pacing.damping, stiffness: pacing.stiffness },
    durationInFrames: 14,
  });

  return (
    <AbsoluteFill style={{ background: "#0d0d0d", alignItems: "center", justifyContent: "center" }}>
      {/* White flash overlay */}
      {flashOp > 0 && (
        <div style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: flashOp, zIndex: 10 }} />
      )}

      <div style={{
        opacity: Math.min(fadeIn, fadeOut),
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20, zIndex: 2,
      }}>
        {/* Accent line */}
        <div style={{ width: lineWidth, height: 1, background: accent, opacity: 0.8 }} />

        {/* Section label */}
        <div style={{
          fontFamily: TOKEN.sans, fontSize: 22, fontWeight: 400,
          color: TOKEN.dim, letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          opacity: interpolate(textProg, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(textProg, [0, 1], [10, 0])}px)`,
        }}>
          {label}
        </div>

        {/* Second accent line below */}
        <div style={{ width: lineWidth * 0.4, height: 1, background: `${accent}66` }} />
      </div>

      <VignetteOverlay intensity={0.6} />
    </AbsoluteFill>
  );
};
