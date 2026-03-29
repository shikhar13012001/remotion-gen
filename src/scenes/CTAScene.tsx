import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Theme, Pacing, StyleConf } from "../lib/tokens";
import { GrainOverlay, VignetteOverlay, VideoBackground } from "../lib/overlays";
import { BgDeepField } from "../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const DISPLAY_FONT = TOKEN.serif;

export interface CTASceneProps {
  cta: string;
  theme: Theme;
  pacing: Pacing;
  styleConf: StyleConf;
  backgroundClip?: string;
  accent: string;
}

export const CTAScene: React.FC<CTASceneProps> = ({
  cta, theme: _theme, pacing, styleConf, backgroundClip, accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame, fps, config: { damping: pacing.damping, stiffness: pacing.stiffness },
    durationInFrames: 24,
  });
  const contentOp = interpolate(enterProgress, [0, 1], [0, 1]);
  const contentY  = interpolate(enterProgress, [0, 1], [20, 0]);

  const lineProgress = spring({
    frame: Math.max(0, frame - 8), fps,
    config: { damping: pacing.damping + 4, stiffness: pacing.stiffness * 0.9 },
    durationInFrames: 18,
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 60]);

  const fadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeIn }}>
      {backgroundClip ? (
        <VideoBackground clip={backgroundClip} scrimOpacity={0.65} imageMotion="static" durationInFrames={90} />
      ) : (
        <BgDeepField frame={frame} startFrame={0} />
      )}

      <div style={{
        zIndex: 2, opacity: contentOp,
        transform: `translateY(${contentY}px)`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 36,
        padding: "0 80px",
      }}>
        <div style={{ width: lineWidth, height: 2, background: accent }} />
        <div style={{
          fontSize: 64, fontWeight: 800, textAlign: "center",
          lineHeight: 1.1, fontFamily: DISPLAY_FONT,
          letterSpacing: "-0.02em", color: TOKEN.white,
        }}>
          {cta}
        </div>
      </div>

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.5} />
    </AbsoluteFill>
  );
};
