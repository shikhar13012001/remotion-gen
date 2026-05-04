import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { usePalette } from "../../context/PaletteContext";

export type Beat = "build" | "breathe" | "turn" | "reveal";

interface BodySceneProps {
  text: string;
  highlightWords: string[];
  dataValue: number | null;
  accent: string;
  durationInFrames: number;
  sceneIndex: number;
  beat: Beat;
  needsImage: boolean;
}

export const BodyScene: React.FC<BodySceneProps> = ({
  text,
  highlightWords,
  dataValue,
  accent,
  durationInFrames,
  beat,
  needsImage,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = usePalette();

  // Route based on beat type
  if (dataValue !== null && (beat === "breathe" || beat === "reveal")) {
    return <StatScene text={text} dataValue={dataValue} accent={accent} frame={frame} />;
  }

  if (beat === "breathe") {
    return <TextDominantScene text={text} highlightWords={highlightWords} accent={accent} frame={frame} />;
  }

  // Default: narrative text
  return <NarrativeScene text={text} highlightWords={highlightWords} accent={accent} frame={frame} />;
};

interface StatSceneProps {
  text: string;
  dataValue: number;
  accent: string;
  frame: number;
}

const StatScene: React.FC<StatSceneProps> = ({ text, dataValue, accent, frame }) => {
  const { fps } = useVideoConfig();
  const palette = usePalette();

  // Slam-in animation for the number
  const numberScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 250 },
    durationInFrames: 16,
  });

  const numberOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Extract suffix (% or other unit)
  const suffix = text.includes("%") ? "%" : "";
  const displayValue = suffix ? dataValue : dataValue;

  return (
    <AbsoluteFill
      style={{
        background: palette.background,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      {/* Large number with accent color */}
      <div
        style={{
          fontSize: "120px",
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
          opacity: numberOpacity,
          transform: `scale(${numberScale})`,
          marginBottom: "24px",
        }}
      >
        {displayValue}
        {suffix}
      </div>

      {/* Description text */}
      <div
        style={{
          fontSize: "42px",
          fontWeight: 400,
          color: palette.text,
          textAlign: "center",
          lineHeight: 1.3,
          maxWidth: "100%",
          opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

interface TextDominantSceneProps {
  text: string;
  highlightWords: string[];
  accent: string;
  frame: number;
}

const TextDominantScene: React.FC<TextDominantSceneProps> = ({
  text,
  highlightWords,
  accent,
  frame,
}) => {
  const { fps } = useVideoConfig();
  const palette = usePalette();

  // Gentle fade-in
  const opacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });

  const words = text.split(" ");

  return (
    <AbsoluteFill
      style={{
        background: palette.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 40px",
      }}
    >
      <div
        style={{
          fontSize: "64px",
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: "center",
          color: palette.text,
          opacity,
          maxWidth: "100%",
          letterSpacing: "-0.02em",
        }}
      >
        {words.map((word, i) => {
          const wordFrame = Math.max(0, frame - i * 2);
          const wordOp = interpolate(wordFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
          const wordY = interpolate(wordFrame, [0, 10], [16, 0], { extrapolateRight: "clamp" });

          const isHighlight = highlightWords.some(
            (hw) => hw.toLowerCase() === word.toLowerCase().replace(/[^\w]/g, "")
          );

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.2em",
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

interface NarrativeSceneProps {
  text: string;
  highlightWords: string[];
  accent: string;
  frame: number;
}

const NarrativeScene: React.FC<NarrativeSceneProps> = ({
  text,
  highlightWords,
  accent,
  frame,
}) => {
  const palette = usePalette();

  const words = text.split(" ");
  const containerOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: palette.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 40px",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          fontWeight: 400,
          lineHeight: 1.4,
          textAlign: "center",
          color: palette.text,
          opacity: containerOpacity,
          maxWidth: "100%",
        }}
      >
        {words.map((word, i) => {
          const wordFrame = Math.max(0, frame - i * 3);
          const wordOp = interpolate(wordFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
          const wordY = interpolate(wordFrame, [0, 10], [12, 0], { extrapolateRight: "clamp" });

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
                fontWeight: isHighlight ? 600 : 400,
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
