import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { usePalette } from "../../context/PaletteContext";

interface HookSceneProps {
  text: string;
  highlightWords: string[];
  accent: string;
  durationInFrames: number;
}

export const HookScene: React.FC<HookSceneProps> = ({
  text,
  highlightWords,
  accent,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = usePalette();

  // Text entrance animation
  const textOpacity = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 200 },
    durationInFrames: 24,
  });

  const textScale = interpolate(frame, [0, 20], [0.85, 1], { extrapolateRight: "clamp" });

  // Word-by-word reveal
  const words = text.split(" ");

  return (
    <AbsoluteFill
      style={{
        background: palette.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        position: "relative",
      }}
    >
      {/* Accent glow background */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          opacity: interpolate(frame, [0, 30], [0.6, 0.3], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Main text */}
      <div
        style={{
          textAlign: "center",
          fontSize: "72px",
          fontWeight: 700,
          lineHeight: 1.15,
          color: palette.text,
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          maxWidth: "100%",
          letterSpacing: "-0.025em",
        }}
      >
        {words.map((word, i) => {
          const wordFrame = Math.max(0, frame - i * 3);
          const wordOp = interpolate(wordFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
          const wordY = interpolate(wordFrame, [0, 12], [24, 0], { extrapolateRight: "clamp" });

          const isHighlight = highlightWords.some(
            (hw) => hw.toLowerCase() === word.toLowerCase().replace(/[^\w]/g, "")
          );

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.25em",
                opacity: wordOp,
                transform: `translateY(${wordY}px)`,
                color: isHighlight ? accent : palette.text,
                fontWeight: isHighlight ? 800 : 700,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
