import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Theme, Pacing, StyleConf } from "../lib/tokens";
import {
  GrainOverlay,
  LetterboxOverlay,
  VignetteOverlay,
  VideoBackground,
} from "../lib/overlays";
import { sentenceFontSize } from "../lib/KaraokeBlock";
import { BgDeepField } from "../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const DISPLAY_FONT = TOKEN.serif;

export interface HookSceneProps {
  hook: string;
  theme: Theme;
  pacing: Pacing;
  styleConf: StyleConf;
  durationInFrames: number;
  backgroundClip?: string;
  accent: string;
}

export const HookScene: React.FC<HookSceneProps> = ({
  hook, theme: _theme, pacing, styleConf, durationInFrames, backgroundClip, accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const INTRO_BLACK = 6;
  const revealFrame = Math.max(0, frame - INTRO_BLACK);
  const progress    = spring({
    frame: revealFrame, fps,
    config: { damping: pacing.damping, stiffness: pacing.stiffness },
    durationInFrames: 28,
  });

  const opacity    = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [24, 0]);

  const lineProgress = spring({
    frame: Math.max(0, revealFrame - 20), fps,
    config: { damping: pacing.damping + 4, stiffness: pacing.stiffness * 0.9 },
    durationInFrames: 20,
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 120]);

  const FADEOUT_FRAMES = 10;
  const fadeOut = interpolate(
    frame, [durationInFrames - FADEOUT_FRAMES, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const words    = hook.split(" ").length;
  const fontSize = sentenceFontSize(words) * 1.35;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      {backgroundClip ? (
        <VideoBackground clip={backgroundClip} scrimOpacity={0.65}
          imageMotion="slow_zoom_in" durationInFrames={durationInFrames} />
      ) : (
        <BgDeepField frame={frame} startFrame={0} />
      )}

      <div style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        padding: "0 80px", textAlign: "center", zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
      }}>
        <div style={{
          fontSize, fontWeight: 800, lineHeight: 1.1,
          fontFamily: DISPLAY_FONT, letterSpacing: "-0.02em",
          color: TOKEN.white,
        }}>
          {hook}
        </div>
        <div style={{
          width: lineWidth, height: 2,
          background: accent,
        }} />
      </div>

      <LetterboxOverlay height={styleConf.letterboxH} frame={frame} />
      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.55} />
    </AbsoluteFill>
  );
};
