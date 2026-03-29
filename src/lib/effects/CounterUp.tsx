import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";

export interface CounterUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent: string;
  fontSize?: number;     // default 164
  durationInFrames: number;
}

export const CounterUp: React.FC<CounterUpProps> = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  accent,
  fontSize = 164,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames * 0.85], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const current = progress * value;
  const displayValue = decimals > 0
    ? current.toFixed(decimals)
    : Math.round(current).toLocaleString();

  return (
    <div style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "center",
      fontFamily: DISPLAY_FONT,
      letterSpacing: "-0.02em",
      lineHeight: 1,
    }}>
      {prefix && (
        <span style={{ fontSize: fontSize * 0.55, color: accent, fontWeight: 700 }}>
          {prefix}
        </span>
      )}
      <span style={{ fontSize, color: accent, fontWeight: 800 }}>
        {displayValue}
      </span>
      {suffix && (
        <span style={{ fontSize: fontSize * 0.55, color: accent, fontWeight: 700 }}>
          {suffix}
        </span>
      )}
    </div>
  );
};
