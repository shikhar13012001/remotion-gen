import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import type { AnimationComponentProps } from "./types";
import { hexToRgb, loadWorldData } from "./mapHelpers";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

interface MapSpreadData {
  highlight_countries: string[];
  spread_order?:       boolean;
  base_color?:         string;
  highlight_color?:    string;
}

function parseData(data: Record<string, unknown>): MapSpreadData {
  return {
    highlight_countries: Array.isArray(data.highlight_countries)
      ? (data.highlight_countries as unknown[]).map(String) : [],
    spread_order:    typeof data.spread_order === "boolean" ? data.spread_order : false,
    base_color:      typeof data.base_color === "string" ? data.base_color : undefined,
    highlight_color: typeof data.highlight_color === "string" ? data.highlight_color : undefined,
  };
}

export const MapSpread: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette, fps,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { highlight_countries, spread_order } = parseData(spec.data);

  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const STAGGER     = 6;
  const worldData   = loadWorldData();

  if (worldData) {
    return (
      <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
        <svg width={920} height={500} viewBox="0 0 920 500"
          style={{ position: "absolute", top: 120, left: 80 }}>
          {Object.keys(worldData).map((iso) => {
            const isHighlighted  = highlight_countries.includes(iso);
            const highlightIndex = highlight_countries.indexOf(iso);
            const fillProgress   = spread_order && isHighlighted
              ? spring({ frame: frame - highlightIndex * STAGGER, fps,
                  config: { damping: 18, stiffness: 200 }, durationInFrames: 10 })
              : isHighlighted
                ? interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" })
                : 1;
            return (
              <path key={iso} d={worldData[iso]}
                fill={isHighlighted
                  ? `rgba(${hexToRgb(palette.accent)},${0.85 * fillProgress})`
                  : TOKEN.surface}
                stroke={TOKEN.border} strokeWidth={0.5} />
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "120px 80px", opacity: containerOp }}>
      <div style={{ fontFamily: TOKEN.sans, fontWeight: 400, fontSize: 28,
        color: palette.text, opacity: 0.5, marginBottom: 24 }}>
        Geographic spread
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {highlight_countries.map((iso, i) => {
          const itemOp = spread_order
            ? interpolate(frame, [i * STAGGER, i * STAGGER + 8], [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ fontFamily: TOKEN.sans, fontWeight: 700, fontSize: 32,
              color: palette.accent, opacity: itemOp,
              border: `1px solid ${palette.accent}44`, borderRadius: 2, padding: "4px 12px" }}>
              {iso}
            </div>
          );
        })}
      </div>
    </div>
  );
};
