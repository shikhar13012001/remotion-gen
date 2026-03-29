import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import type { AnimationComponentProps } from "./types";
import { IconPlaceholder, getIconPositions, type IconLayout } from "./iconHelpers";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const BODY_FONT = TOKEN.sans;

interface IconArrangementData { icons: string[]; layout: IconLayout; labels?: string[]; }

function parseData(data: Record<string, unknown>): IconArrangementData {
  return {
    icons:  Array.isArray(data.icons) ? (data.icons as unknown[]).map(String).slice(0, 6) : [],
    layout: ["scatter", "grid", "radial", "stack"].includes(data.layout as string)
              ? (data.layout as IconLayout) : "grid",
    labels: Array.isArray(data.labels) ? (data.labels as unknown[]).map(String) : undefined,
  };
}

export const IconArrangement: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette, fps,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { icons, layout, labels } = parseData(spec.data);
  if (icons.length === 0) return null;

  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const positions   = getIconPositions(layout, icons.length);
  const STAGGER     = 6;
  const ICON_SIZE   = 96;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
      {icons.map((icon, i) => {
        const [x, y] = positions[i];
        const itemScale = spring({ frame: frame - i * STAGGER, fps,
          config: { damping: 14, stiffness: 260 }, durationInFrames: 12 });
        const itemOp = interpolate(frame, [i * STAGGER, i * STAGGER + 8], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: x - ICON_SIZE / 2, top: y - ICON_SIZE / 2 - (labels ? 20 : 0),
            display: "flex", flexDirection: "column", alignItems: "center",
            opacity: itemOp, transform: `scale(${itemScale})`,
          }}>
            <IconPlaceholder name={icon} color={palette.accent} size={ICON_SIZE} />
            {labels?.[i] && (
              <div style={{ marginTop: 8, fontFamily: BODY_FONT, fontWeight: 400, fontSize: 24,
                color: palette.text, opacity: 0.7, textAlign: "center", maxWidth: 160 }}>
                {labels[i]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
