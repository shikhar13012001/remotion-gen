import React from "react";
import { interpolate } from "remotion";
import type { PaletteContextValue } from "../context/PaletteContext";
import { FlowNode } from "../../packages/video-renderer/src/components/primitives/FlowNode";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

export { CycleRenderer } from "./flowCycleRenderer";
export { TreeRenderer }  from "./flowTreeRenderer";

const FRAMES_PER_NODE = 10;

export interface FlowRendererProps {
  nodes: string[];
  frame: number;
  fps: number;
  palette: PaletteContextValue;
  durationInFrames: number;
  containerOp: number;
}

// ChainRenderer — maps each node to FlowNode primitive (documentary left-bar style)
export const ChainRenderer: React.FC<FlowRendererProps> = ({ nodes, frame, palette, containerOp }) => {
  const NODE_W  = 700;
  const totalH  = nodes.length * 72 + (nodes.length - 1) * 28;
  const startY  = (1344 - totalH) / 2;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
      {/* Arrow connectors — SVG layer below nodes */}
      <svg width={1080} height={1344} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {nodes.slice(0, -1).map((_, i) => {
          const arrowY   = startY + (i + 1) * 72 + i * 28 - 14;
          const drawProg = interpolate(frame,
            [(i + 1) * FRAMES_PER_NODE, (i + 1) * FRAMES_PER_NODE + 10], [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const tipY = arrowY + 14 * drawProg;
          return (
            <g key={i}>
              <line x1={540} y1={arrowY} x2={540} y2={tipY}
                stroke={palette.accent_dim} strokeWidth={1.5} />
              {drawProg > 0.9 && (
                <polygon points={`540,${tipY + 2} 531,${tipY - 8} 549,${tipY - 8}`}
                  fill={palette.accent} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Node layer — FlowNode primitives, staggered */}
      <div style={{ position: "absolute", left: (1080 - NODE_W) / 2, top: startY, width: NODE_W }}>
        {nodes.map((node, i) => (
          <div key={i} style={{ marginBottom: i < nodes.length - 1 ? 28 : 0 }}>
            <FlowNode
              text={node}
              frame={frame}
              startFrame={i * FRAMES_PER_NODE}
              isLast={i === nodes.length - 1}
              accentColor={palette.accent}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
