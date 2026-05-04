import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TOKEN } from "../../../packages/video-renderer/src/tokens";
import { BgDeepField } from "../../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { GoldDivider } from "../../../packages/video-renderer/src/components/primitives/GoldDivider";
import { GrainOverlay, VignetteOverlay } from "../../lib/overlays";

export interface CloseSceneProps {
  text:             string;
  highlightWords:   string[];
  accent:           string;
  durationInFrames: number;
}

/**
 * CloseScene — REITs video close (sentence 17).
 * BgDeepField + word-by-word serif reveal + GoldDivider.
 * Echoes the hook: "skyscraper" rendered in accent color.
 */
export const CloseScene: React.FC<CloseSceneProps> = ({
  text, highlightWords, accent, durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame, fps,
    config: { damping: 18, stiffness: 160 },
    durationInFrames: 24,
  });

  const containerOp = interpolate(enterProgress, [0, 1], [0, 1]);
  const containerY  = interpolate(enterProgress, [0, 1], [32, 0]);

  const FADEOUT = 14;
  const fadeOut = interpolate(
    frame,
    [durationInFrames - FADEOUT, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const words = text.split(" ");

  return (
    <AbsoluteFill style={{
      alignItems: "center",
      justifyContent: "center",
      opacity: fadeOut,
    }}>
      <BgDeepField frame={frame} startFrame={0} />

      <div style={{
        opacity: containerOp,
        transform: `translateY(${containerY}px)`,
        padding: "0 80px",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 28,
      }}>
        {/* Divider draws in before text */}
        <GoldDivider frame={frame} startFrame={4} width={240} accentColor={accent} />

        {/* Word-by-word staggered reveal */}
        <div style={{
          fontFamily: TOKEN.serif,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.2,
          letterSpacing: "-0.018em",
          color: TOKEN.white,
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25em",
        }}>
          {words.map((word, i) => {
            const wordDelay = i * 3;
            const wordProg  = spring({
              frame: Math.max(0, frame - wordDelay), fps,
              config: { damping: 20, stiffness: 200 },
              durationInFrames: 14,
            });
            const wordOp = interpolate(wordProg, [0, 1], [0, 1]);
            const wordY  = interpolate(wordProg, [0, 1], [12, 0]);
            const clean  = word.toLowerCase().replace(/[^a-z0-9]/g, "");
            const isAccent = highlightWords.some(
              (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "") === clean
                || w.toLowerCase().includes(clean),
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

        {/* Trailing accent line */}
        <div style={{
          width: interpolate(
            spring({ frame: Math.max(0, frame - 16), fps,
              config: { damping: 18, stiffness: 160 }, durationInFrames: 18 }),
            [0, 1], [0, 80],
          ),
          height: 2,
          background: accent,
          opacity: 0.7,
        }} />
      </div>

      <GrainOverlay frame={frame} opacity={0.05} />
      <VignetteOverlay intensity={0.52} />
    </AbsoluteFill>
  );
};
