import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { AnimationComponentProps } from "./types";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const DISPLAY_FONT = TOKEN.serif;
const BODY_FONT    = TOKEN.sans;

interface CompItem { label: string; value: number; color?: string; }
interface ComparisonBarsData {
  items: CompItem[];
  unit?: string;
}

function parseData(data: Record<string, unknown>): ComparisonBarsData {
  const raw = Array.isArray(data.items) ? data.items as Record<string, unknown>[] : [];
  return {
    items: raw.map(i => ({
      label: String(i.label ?? ""),
      value: Number(i.value ?? 0),
      color: typeof i.color === "string" ? i.color : undefined,
    })),
    unit: typeof data.unit === "string" ? data.unit : undefined,
  };
}

export const ComparisonBars: React.FC<AnimationComponentProps> = ({
  spec,
  startFrame,
  durationInFrames,
  palette,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { items, unit } = parseData(spec.data);
  if (items.length === 0) return null;

  const maxValue = Math.max(...items.map(i => i.value));
  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const STAGGER  = 6;
  const DRAW_DUR = Math.max(20, durationInFrames - items.length * STAGGER - 10);
  const BAR_H    = 72;
  const BAR_GAP  = 24;
  const MAX_W    = 700;

  return (
    <div
      style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "center",
        padding: "120px 80px", opacity: containerOp,
      }}
    >
      {items.map((item, i) => {
        const barStart = i * STAGGER;
        const progress = interpolate(
          frame, [barStart, barStart + DRAW_DUR], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const barW = (item.value / maxValue) * MAX_W * progress;
        const barColor = item.color ?? palette.accent;

        return (
          <div key={i} style={{ width: "100%", marginBottom: BAR_GAP }}>
            {/* Label */}
            <div style={{
              fontFamily: BODY_FONT, fontWeight: 500, fontSize: 36, color: palette.text,
              marginBottom: 8, lineHeight: 1.15,
            }}>
              {item.label}
            </div>
            {/* Bar track */}
            <div style={{ position: "relative", height: BAR_H, background: `${barColor}18`, borderRadius: 2 }}>
              {/* Fill */}
              <div style={{ height: BAR_H, width: barW, background: barColor, borderRadius: 2 }} />
              {/* Value at bar end */}
              <span style={{
                position: "absolute",
                left: Math.max(barW + 8, 8),
                top: "50%", transform: "translateY(-50%)",
                fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 36,
                color: barColor, whiteSpace: "nowrap",
                opacity: progress,
              }}>
                {item.value.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
      {/* Unit below all bars */}
      {unit && (
        <div style={{
          marginTop: 12, fontFamily: BODY_FONT, fontWeight: 400, fontSize: 28,
          color: palette.accent_dim,
        }}>
          {unit}
        </div>
      )}
    </div>
  );
};
