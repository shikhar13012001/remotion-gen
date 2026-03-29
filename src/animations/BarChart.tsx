import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { AnimationComponentProps } from "./types";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const DISPLAY_FONT = TOKEN.serif;
const BODY_FONT    = TOKEN.sans;

interface BarItem { label: string; value: number; }
interface BarChartData { items: BarItem[]; unit?: string; horizontal?: boolean; }

function parseData(data: Record<string, unknown>): BarChartData {
  const raw = Array.isArray(data.items) ? data.items as Record<string, unknown>[] : [];
  return {
    items:      raw.map(i => ({ label: String(i.label ?? ""), value: Number(i.value ?? 0) })),
    unit:       typeof data.unit === "string" ? data.unit : undefined,
    horizontal: typeof data.horizontal === "boolean" ? data.horizontal : false,
  };
}

interface BarsProps {
  items: BarItem[]; unit?: string; frame: number; maxValue: number;
  stagger: number; drawDur: number; palette: AnimationComponentProps["palette"];
}

const HorizontalBars: React.FC<BarsProps> = ({ items, unit, frame, maxValue, stagger, drawDur, palette }) => {
  const MAX_W = 680;
  return (
    <>
      {items.map((item, i) => {
        const progress = interpolate(frame, [i * stagger, i * stagger + drawDur], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const barW = (item.value / maxValue) * MAX_W * progress;
        return (
          <div key={i} style={{ marginBottom: 20, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: BODY_FONT, fontWeight: 500, fontSize: 36, color: palette.text, minWidth: 200 }}>
                {item.label}
              </span>
            </div>
            <div style={{ position: "relative", height: 64, background: `${palette.accent}18`, borderRadius: 2 }}>
              <div style={{ height: 64, width: barW, background: palette.accent, borderRadius: 2 }} />
              <span style={{ position: "absolute", right: MAX_W - barW + 8, top: "50%",
                transform: "translateY(-50%)", fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 32,
                color: palette.accent, whiteSpace: "nowrap" }}>
                {item.value.toLocaleString()}{unit ? ` ${unit}` : ""}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

const VerticalBars: React.FC<BarsProps> = ({ items, unit, frame, maxValue, stagger, drawDur, palette }) => {
  const BAR_W = Math.min(120, Math.floor(760 / items.length) - 16);
  const MAX_H = 480;
  return (
    <>
      {items.map((item, i) => {
        const progress = interpolate(frame, [i * stagger, i * stagger + drawDur], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const barH = (item.value / maxValue) * MAX_H * progress;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: BAR_W }}>
            <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 28,
              color: palette.accent, marginBottom: 4, opacity: progress }}>
              {item.value.toLocaleString()}{unit ? ` ${unit}` : ""}
            </span>
            <div style={{ height: barH, width: "100%", background: palette.accent, borderRadius: "2px 2px 0 0" }} />
            <div style={{ marginTop: 8, textAlign: "center" }}>
              <span style={{ fontFamily: BODY_FONT, fontWeight: 400, fontSize: 28, color: palette.text, opacity: 0.7 }}>
                {item.label}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

export const BarChart: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { items, unit, horizontal } = parseData(spec.data);
  if (items.length === 0) return null;

  const maxValue    = Math.max(...items.map(i => i.value));
  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const STAGGER     = 4;
  const DRAW_DUR    = Math.max(20, durationInFrames - items.length * STAGGER);
  const barsProps   = { items, unit, frame, maxValue, stagger: STAGGER, drawDur: DRAW_DUR, palette };

  return (
    <div style={{ position: "absolute", inset: 0,
      display: "flex", flexDirection: horizontal ? "column" : "row",
      alignItems: horizontal ? "flex-start" : "flex-end",
      justifyContent: "center",
      padding: horizontal ? "120px 80px" : "120px 80px 100px",
      gap: horizontal ? 0 : 16, opacity: containerOp }}>
      {horizontal ? <HorizontalBars {...barsProps} /> : <VerticalBars {...barsProps} />}
    </div>
  );
};
