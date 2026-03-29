import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Theme, Pacing } from "../lib/tokens";

const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";

export interface TitleOverlayProps {
  title: string;
  theme: Theme;
  pacing: Pacing;
  accent: string;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  title, theme: _theme, pacing, accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame, fps,
    config: { damping: pacing.damping + 4, stiffness: pacing.stiffness * 0.8 },
    durationInFrames: 25,
  });
  const titleY  = interpolate(progress, [0, 1], [-42, 0]);
  const titleOp = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div style={{
      position: "absolute", top: 80, left: 0, right: 0,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      opacity: titleOp, transform: `translateY(${titleY}px)`, pointerEvents: "none",
    }}>
      <div style={{
        fontSize: 32, fontWeight: 800, textAlign: "center", padding: "0 80px",
        lineHeight: 1.2, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.72)",
        fontFamily: DISPLAY_FONT,
      }}>
        {title}
      </div>
      <div style={{
        width: interpolate(progress, [0, 1], [0, 40]),
        height: 2,
        background: accent,
      }} />
    </div>
  );
};
