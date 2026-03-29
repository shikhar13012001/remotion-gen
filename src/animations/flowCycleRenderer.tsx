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

export const CycleRenderer: React.FC<FlowRendererProps> = ({ nodes, frame, palette, containerOp }) => {
  const R  = 260;
  const CX = 540;
  const CY = 650;
  const N  = nodes.length;
  const nodePositions = nodes.map((_, i) => ({
    x: CX + R * Math.cos((i / N) * 2 * Math.PI - Math.PI / 2),
    y: CY + R * Math.sin((i / N) * 2 * Math.PI - Math.PI / 2),
  }));

  // Derived border from accent
  const borderColor = `${palette.accent}47`;
  const bgColor     = `linear-gradient(135deg, ${palette.accent}12, rgba(255,255,255,0.03))`;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
      <svg width={1080} height={1344} style={{ position: "absolute", inset: 0 }}>
        {nodes.map((_, i) => {
          const next  = (i + 1) % N;
          const from  = nodePositions[i];
          const to    = nodePositions[next];
          const arcProg = interpolate(frame, [i * FRAMES_PER_NODE, i * FRAMES_PER_NODE + 15], [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const arrowX = from.x + dx * arcProg;
          const arrowY = from.y + dy * arcProg;
          return (
            <g key={i}>
              <line x1={from.x} y1={from.y} x2={arrowX} y2={arrowY}
                stroke={palette.accent_dim} strokeWidth={1.5} strokeLinecap="round" />
              {arcProg > 0.95 && (
                <polygon
                  points={`${arrowX},${arrowY} ${arrowX - dy/len*10 - dx/len*14},${arrowY + dx/len*10 - dy/len*14} ${arrowX + dy/len*10 - dx/len*14},${arrowY - dx/len*10 - dy/len*14}`}
                  fill={palette.accent} />
              )}
            </g>
          );
        })}
      </svg>
      {nodePositions.map((pos, i) => {
        const nodeOp = interpolate(frame, [i * FRAMES_PER_NODE, i * FRAMES_PER_NODE + 8], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: pos.x - 100, top: pos.y - 32, width: 200,
            textAlign: "center",
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 4, padding: "8px 12px",
            fontFamily: TOKEN.sans, fontWeight: 500, fontSize: 28,
            color: palette.text, opacity: nodeOp,
          }}>
            {nodes[i]}
          </div>
        );
      })}
    </div>
  );
};
