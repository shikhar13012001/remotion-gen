import React from "react";
import { interpolate } from "remotion";
import type { PaletteContextValue } from "../context/PaletteContext";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const FRAMES_PER_NODE = 10;

interface FlowRendererProps {
  nodes: string[];
  frame: number;
  fps: number;
  palette: PaletteContextValue;
  durationInFrames: number;
  containerOp: number;
}

export const TreeRenderer: React.FC<FlowRendererProps> = ({ nodes, frame, fps, palette, containerOp }) => {
  const root     = nodes[0];
  const children = nodes.slice(1);
  const N        = children.length;
  const STEP     = Math.min(200, 760 / N);
  const rootX    = 540;
  const rootY    = 220;
  const childY   = 480;
  const childPositions = children.map((_, i) => rootX - ((N - 1) / 2) * STEP + i * STEP);
  const rootOp   = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Token-derived colors
  const rootBg     = `linear-gradient(135deg, ${palette.accent}20, ${TOKEN.surface})`;
  const childBg    = `linear-gradient(135deg, ${palette.accent}12, ${TOKEN.surface})`;
  const borderRoot = `${palette.accent}66`;
  const borderChild = `${palette.accent}47`;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
      <svg width={1080} height={800} style={{ position: "absolute", top: 120 }}>
        {childPositions.map((cx, i) => {
          const lineProg = interpolate(frame,
            [(i + 1) * FRAMES_PER_NODE, (i + 1) * FRAMES_PER_NODE + 12], [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const ly = rootY + (childY - rootY) * lineProg;
          return <line key={i} x1={rootX} y1={rootY} x2={cx} y2={ly}
            stroke={palette.accent_dim} strokeWidth={1.5} />;
        })}
      </svg>
      {/* Root node */}
      <div style={{
        position: "absolute", left: rootX - 120, top: 120 + rootY - 30, width: 240,
        textAlign: "center",
        background: rootBg, border: `1px solid ${borderRoot}`,
        borderRadius: 4, padding: "10px 14px",
        fontFamily: TOKEN.sans, fontWeight: 700, fontSize: 30, color: palette.text, opacity: rootOp,
      }}>
        {root}
      </div>
      {/* Child nodes */}
      {childPositions.map((cx, i) => {
        const childOp = interpolate(frame,
          [(i + 1) * FRAMES_PER_NODE + 8, (i + 1) * FRAMES_PER_NODE + 16], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: cx - 90, top: 120 + childY - 28, width: 180,
            textAlign: "center",
            background: childBg, border: `1px solid ${borderChild}`,
            borderRadius: 4, padding: "8px 10px",
            fontFamily: TOKEN.sans, fontWeight: 500, fontSize: 26,
            color: palette.text, opacity: childOp,
          }}>
            {children[i]}
          </div>
        );
      })}
    </div>
  );
};
