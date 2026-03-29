import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { AnimationComponentProps } from "./types";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const DISPLAY_FONT = TOKEN.serif;
const BODY_FONT    = TOKEN.sans;

interface CounterData { value: number; prefix?: string; suffix?: string; decimals?: number; }

function parseData(data: Record<string, unknown>): CounterData {
  return {
    value:    typeof data.value === "number" ? data.value : 0,
    prefix:   typeof data.prefix === "string" ? data.prefix : undefined,
    suffix:   typeof data.suffix === "string" ? data.suffix : undefined,
    decimals: typeof data.decimals === "number" ? Math.max(0, Math.floor(data.decimals)) : 0,
  };
}

const LabelLine: React.FC<{ text: string; isTop: boolean }> = ({ text, isTop }) => (
  <div style={{ fontFamily: BODY_FONT, fontWeight: 400, fontSize: 48,
    color: "rgba(240,240,240,0.7)", letterSpacing: 0,
    ...(isTop ? { marginBottom: 8 } : { marginTop: 8 }) }}>
    {text}
  </div>
);

export const Counter: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette, fps,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { value, prefix, suffix, decimals } = parseData(spec.data);

  const currentValue = interpolate(frame, [0, Math.round(durationInFrames * 0.8)], [0, value],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const entrySpring   = spring({ frame, fps, config: { damping: 20, stiffness: 200 }, durationInFrames: 8 });
  const entryScale    = interpolate(entrySpring, [0, 1], [0.9, 1.0]);
  const entryOpacity  = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(currentValue);

  const digitCount = String(Math.round(value)).length;
  const fontSize   = digitCount <= 3 ? 144 : digitCount <= 6 ? 108 : 80;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "120px 80px",
      opacity: entryOpacity, transform: `scale(${entryScale})` }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.accent}20 0%, transparent 65%)`,
        left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
      {prefix && <LabelLine text={prefix} isTop />}
      <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize, color: palette.accent,
        letterSpacing: "-0.02em", lineHeight: 1.0,
        filter: `drop-shadow(0 0 32px ${palette.accent}66)` }}>
        {formatted}
      </div>
      {suffix && <LabelLine text={suffix} isTop={false} />}
    </div>
  );
};
