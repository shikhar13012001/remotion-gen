import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TOKEN } from "../../../packages/video-renderer/src/tokens";
import { BgFlare } from "../../../packages/video-renderer/src/components/backgrounds/BgFlare";
import { GrainOverlay, VignetteOverlay } from "../../lib/overlays";

export interface HookSceneProps {
  text:             string;
  highlightWords:   string[];
  accent:           string;
  durationInFrames: number;
}

/**
 * HookScene — REITs video hook (sentence 1).
 * BgFlare + large serif text + animated accent underline.
 * "skyscraper" and "Zero" render in accent amber (#f0c040).
 */
export const HookScene: React.FC<HookSceneProps> = ({
  text, highlightWords, accent, durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Black hold for first 6 frames — then spring in
  const INTRO_HOLD = 6;
  const revealFrame = Math.max(0, frame - INTRO_HOLD);

  const enterProgress = spring({
    frame: revealFrame, fps,
    config: { damping: 18, stiffness: 200 },
    durationInFrames: 28,
  });

  const contentOp = interpolate(enterProgress, [0, 1], [0, 1]);
  const contentY  = interpolate(enterProgress, [0, 1], [28, 0]);

  // Accent line draws in after text settles
  const lineProgress = spring({
    frame: Math.max(0, revealFrame - 20), fps,
    config: { damping: 20, stiffness: 180 },
    durationInFrames: 18,
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 140]);

  // Fade out near end
  const FADEOUT = 10;
  const fadeOut = interpolate(
    frame,
    [durationInFrames - FADEOUT, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Accent glow pulse
  const glowPulse = 0.12 + Math.sin(frame * 0.05) * 0.04;

  const words = text.split(" ");

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <BgFlare frame={frame} startFrame={0} />

      {/* Soft accent radial glow behind text */}
      <div style={{
        position: "absolute",
        left: "50%", top: "48%",
        width: "70%", paddingTop: "70%",
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}${Math.round(glowPulse * 255).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />

      <div style={{
        opacity: contentOp,
        transform: `translateY(${contentY}px)`,
        padding: "0 72px",
        textAlign: "center",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 36,
      }}>
        {/* Main headline — word-by-word with accent highlights */}
        <div style={{
          fontFamily: TOKEN.serif,
          fontWeight: 800,
          fontSize: 80,
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          color: TOKEN.white,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0.22em",
        }}>
          {words.map((word, i) => {
            const wordDelay = i * 2;
            const wordProg  = spring({
              frame: Math.max(0, revealFrame - wordDelay), fps,
              config: { damping: 20, stiffness: 220 },
              durationInFrames: 16,
            });
            const wordOp = interpolate(wordProg, [0, 1], [0, 1]);
            const wordY  = interpolate(wordProg, [0, 1], [14, 0]);
            const clean  = word.toLowerCase().replace(/[^a-z0-9]/g, "");
            const isAccent = highlightWords.some(
              (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "") === clean,
            );
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: wordOp,
                  transform: `translateY(${wordY}px)`,
                  color: isAccent ? accent : TOKEN.white,
                  fontWeight: isAccent ? 800 : 700,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Accent underline */}
        <div style={{
          width: lineWidth,
          height: 3,
          background: accent,
          borderRadius: 2,
        }} />
      </div>

      <GrainOverlay frame={frame} opacity={0.06} />
      <VignetteOverlay intensity={0.6} />
    </AbsoluteFill>
  );
};
