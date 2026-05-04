import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { usePalette } from "../../context/PaletteContext";

interface CloseSceneProps {
  text: string;
  highlightWords: string[];
  accent: string;
  durationInFrames: number;
}

export const CloseScene: React.FC<CloseSceneProps> = ({
  text,
  highlightWords,
  accent,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const palette = usePalette();

  const words = text.split(" ");

  // Gentle fade-in and scale for the close
  const containerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const containerScale = interpolate(frame, [0, 20], [0.9, 1], { extrapolateRight: "clamp" });

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
      {/* Accent glow accent background */}
      <div
        style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          opacity: interpolate(frame, [0, 40], [0.4, 0.2], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Main text */}
      <div
        style={{
          textAlign: "center",
          fontSize: "56px",
          fontWeight: 700,
          lineHeight: 1.2,
          color: palette.text,
          opacity: containerOpacity,
          transform: `scale(${containerScale})`,
          maxWidth: "100%",
          letterSpacing: "-0.02em",
        }}
      >
        {words.map((word, i) => {
          const wordFrame = Math.max(0, frame - i * 3);
          const wordOp = interpolate(wordFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
          const wordY = interpolate(wordFrame, [0, 12], [16, 0], { extrapolateRight: "clamp" });

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
