import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { AnimationComponentProps } from "./types";
import { hexToRgb, loadWorldData } from "./mapHelpers";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

interface WorldHighlightData {
  regions: { country: string; intensity: number }[];
  legend?: string;
}

function parseData(data: Record<string, unknown>): WorldHighlightData {
  const raw = Array.isArray(data.regions) ? data.regions as Record<string, unknown>[] : [];
  return {
    regions: raw.map(r => ({
      country:   String(r.country ?? ""),
      intensity: typeof r.intensity === "number" ? Math.max(0, Math.min(1, r.intensity)) : 0.5,
    })),
    legend: typeof data.legend === "string" ? data.legend : undefined,
  };
}

export const WorldHighlight: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { regions, legend } = parseData(spec.data);

  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const mapFadeIn   = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const worldData  = loadWorldData();
  const regionMap  = new Map(regions.map(r => [r.country, r.intensity]));
  const accentRgb  = hexToRgb(palette.accent);

  if (worldData) {
    return (
      <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
        <svg width={920} height={500} viewBox="0 0 920 500"
          style={{ position: "absolute", top: 120, left: 80, opacity: mapFadeIn }}>
          {Object.keys(worldData).map((iso) => {
            const intensity = regionMap.get(iso);
            return (
              <path key={iso} d={worldData[iso]}
                fill={intensity !== undefined
                  ? `rgba(${accentRgb},${intensity * 0.9})`
                  : TOKEN.surface}
                stroke={TOKEN.muted} strokeWidth={0.5} />
            );
          })}
        </svg>
        {legend && (
          <div style={{ position: "absolute", bottom: 240, left: "50%", transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 300, height: 12, borderRadius: 2,
              background: `linear-gradient(to right, rgba(${accentRgb},0.1), rgba(${accentRgb},0.9))` }} />
            <div style={{ fontFamily: TOKEN.sans, fontWeight: 400, fontSize: 24,
              color: palette.text, opacity: 0.5 }}>
              {legend}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "120px 80px", opacity: containerOp }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {regions.map((r, i) => (
          <div key={i} style={{ fontFamily: TOKEN.sans, fontWeight: 600, fontSize: 28,
            color: palette.accent, opacity: Math.max(0.2, r.intensity),
            border: `1px solid ${palette.accent}44`, borderRadius: 2, padding: "4px 12px" }}>
            {r.country}
          </div>
        ))}
      </div>
      {legend && (
        <div style={{ marginTop: 24, fontFamily: TOKEN.sans, fontWeight: 400, fontSize: 28,
          color: palette.text, opacity: 0.5 }}>
          {legend}
        </div>
      )}
    </div>
  );
};
