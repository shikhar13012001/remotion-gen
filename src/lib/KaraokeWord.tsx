import React from "react";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

export interface KaraokeWordProps {
  word: string;
  isActive: boolean;
  isPast: boolean;
  isHighlighted: boolean;
  fontSize: number;
  accent: string;
}

export const KaraokeWord: React.FC<KaraokeWordProps> = ({
  word, isActive, isPast, isHighlighted, fontSize, accent,
}) => {
  const color = isActive
    ? accent
    : isPast
    ? TOKEN.dim
    : TOKEN.faint;

  return (
    <span
      style={{
        display: "inline-block",
        lineHeight: 1.35,
        ...(isHighlighted ? {
          background: accent + "26",
          borderRadius: 4,
          padding: "4px 8px",
        } : {}),
      }}
    >
      <span style={{
        fontSize,
        fontWeight: isHighlighted ? 800 : isActive ? 600 : 400,
        color,
        display: "inline-block",
        fontFamily: TOKEN.sans,
        letterSpacing: "0",
      }}>
        {word}
      </span>
    </span>
  );
};
