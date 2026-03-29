import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { AnimationComponentProps } from "./types";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const DISPLAY_FONT = TOKEN.serif;
const BODY_FONT    = TOKEN.sans;

interface PercentageData { value: number; label: string; style?: "circle" | "bar"; }

function parseData(data: Record<string, unknown>): PercentageData {
  return {
    value: typeof data.value === "number" ? Math.max(0, Math.min(100, data.value)) : 0,
    label: typeof data.label === "string" ? data.label : "",
    style: data.style === "bar" ? "bar" : "circle",
  };
}

const BarFill: React.FC<{ value: number; label: string; progress: number; palette: AnimationComponentProps["palette"] }> = (
  { value, label, progress, palette }
) => {
  const BAR_W = 760;
  const BAR_H = 48;
  const display = Math.round(progress * 100);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "120px 80px" }}>
      <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 108,
        color: palette.accent, letterSpacing: "-0.02em",
        filter: `drop-shadow(0 0 32px ${palette.accent}66)`, marginBottom: 24 }}>
        {display}%
      </div>
      <div style={{ width: BAR_W, height: BAR_H, borderRadius: 4, background: `${palette.accent}18` }}>
        <div style={{ height: BAR_H, width: BAR_W * progress, background: palette.accent, borderRadius: 4 }} />
      </div>
      <div style={{ marginTop: 20, fontFamily: BODY_FONT, fontWeight: 400, fontSize: 36,
        color: palette.text, opacity: 0.7, textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
};

const CircleFill: React.FC<{ label: string; progress: number; palette: AnimationComponentProps["palette"] }> = (
  { label, progress, palette }
) => {
  const RADIUS   = 180;
  const STROKE_W = 14;
  const CIRCUM   = 2 * Math.PI * RADIUS;
  const display  = Math.round(progress * 100);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "120px 80px" }}>
      <div style={{ position: "relative", width: RADIUS * 2 + STROKE_W * 2, height: RADIUS * 2 + STROKE_W * 2 }}>
        <svg width={RADIUS * 2 + STROKE_W * 2} height={RADIUS * 2 + STROKE_W * 2}
          style={{ transform: "rotate(-90deg)" }}>
          <circle cx={RADIUS + STROKE_W} cy={RADIUS + STROKE_W} r={RADIUS}
            fill="none" stroke={palette.accent} strokeWidth={STROKE_W} strokeOpacity={0.15} />
          <circle cx={RADIUS + STROKE_W} cy={RADIUS + STROKE_W} r={RADIUS}
            fill="none" stroke={palette.accent} strokeWidth={STROKE_W} strokeLinecap="round"
            strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM * (1 - progress)} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 108,
            color: palette.accent, letterSpacing: "-0.02em",
            filter: `drop-shadow(0 0 24px ${palette.accent}66)` }}>
            {display}%
          </span>
        </div>
      </div>
      <div style={{ marginTop: 24, fontFamily: BODY_FONT, fontWeight: 400, fontSize: 36,
        color: palette.text, opacity: 0.7, textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
};

export const PercentageFill: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { value, label, style } = parseData(spec.data);

  const progress     = interpolate(frame, [0, Math.round(durationInFrames * 0.85)], [0, value / 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerOp  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
      {style === "bar"
        ? <BarFill    value={value} label={label} progress={progress} palette={palette} />
        : <CircleFill              label={label} progress={progress} palette={palette} />
      }
    </div>
  );
};
