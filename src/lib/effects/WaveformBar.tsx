import React from "react";

export interface WaveformBarProps {
  accent: string;
  frame: number;
  barCount?: number; // default 32
}

export const WaveformBar: React.FC<WaveformBarProps> = ({
  accent, frame, barCount = 32,
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => {
    const height = (Math.sin(frame * 0.04 + i * 0.4) * 0.5 + 0.5) * 80 + 10;
    return height;
  });

  const barWidth = 1080 / barCount;

  return (
    <div style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      display: "flex",
      alignItems: "flex-end",
      pointerEvents: "none",
    }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: barWidth - 2,
            height: `${h}%`,
            background: accent,
            opacity: 0.6,
            margin: "0 1px",
          }}
        />
      ))}
    </div>
  );
};
