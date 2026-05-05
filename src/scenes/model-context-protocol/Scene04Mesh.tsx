import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BgSignal, DESIGN, SceneProps } from "./DESIGN";

// Scene 4 — "Hundreds of integrations, no common language between them."
// Dense node-mesh with chaotic crossing connections + empty center box
const NODES: { x: number; y: number; label: string }[] = [
  { x: 160, y: 400 }, { x: 260, y: 240 }, { x: 420, y: 200 }, { x: 600, y: 220 },
  { x: 760, y: 260 }, { x: 900, y: 360 }, { x: 940, y: 520 }, { x: 880, y: 680 },
  { x: 740, y: 780 }, { x: 580, y: 820 }, { x: 400, y: 800 }, { x: 240, y: 740 },
  { x: 140, y: 600 }, { x: 200, y: 460 }, { x: 700, y: 440 }, { x: 350, y: 340 },
].map((n, i) => ({ ...n, label: `N${i + 1}`, x: n.x, y: n.y + 400 }));

// Chaotic connections (pairs of node indices)
const EDGES = [
  [0,3],[1,7],[2,9],[4,11],[5,13],[6,0],[7,2],[8,4],
  [9,12],[10,6],[11,1],[12,5],[13,8],[14,3],[15,7],
  [0,10],[3,12],[5,9],[1,14],[8,15],[2,6],
];

export const Scene04Mesh: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();

  // All nodes appear at frame 1
  const nodesOp = interpolate(frame, [0, 2], [0, 1], { extrapolateRight: "clamp" });

  // Edges draw rapidly, overlapping and chaotic
  const edgeProgress = interpolate(frame, [1, 16], [0, 1], { extrapolateRight: "clamp" });

  // Empty center box
  const boxOp = interpolate(frame, [18, 26], [0, 1], { extrapolateRight: "clamp" });

  // "Hundreds" watermark
  const hundredsOp = interpolate(frame, [2, 10], [0, 0.25], { extrapolateRight: "clamp" });

  // "no common language" types in
  const nclOp = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: "clamp" });

  const VIEW_W = 1080;
  const VIEW_H = 1920;

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgSignal />

      {/* "Hundreds" watermark — large muted */}
      <div style={{
        position: "absolute",
        top: "8%",
        left: "6%",
        fontSize: DESIGN.stat.fontSize,
        fontWeight: DESIGN.stat.fontWeight,
        letterSpacing: DESIGN.stat.letterSpacing,
        color: DESIGN.textMuted,
        opacity: hundredsOp,
        fontFamily: DESIGN.fontDisplay,
        userSelect: "none",
      }}>
        Hundreds
      </div>

      {/* Node mesh SVG */}
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>

        {/* Edges — chaotic crossing lines */}
        {EDGES.map(([a, b], i) => {
          if (!NODES[a] || !NODES[b]) return null;
          const progress = Math.min(1, edgeProgress * (EDGES.length / (i + 1)) * 0.15);
          const drawProgress = interpolate(frame, [1 + i * 0.5, 1 + i * 0.5 + 6], [0, 1], { extrapolateRight: "clamp" });
          const na = NODES[a]!;
          const nb = NODES[b]!;
          const x2 = na.x + (nb.x - na.x) * drawProgress;
          const y2 = na.y + (nb.y - na.y) * drawProgress;
          return (
            <line key={i} x1={na.x} y1={na.y} x2={x2} y2={y2}
              stroke={DESIGN.border} strokeWidth="1.5" opacity="0.7" />
          );
        })}

        {/* Nodes */}
        {NODES.map((node, i) => (
          <g key={i} opacity={nodesOp}>
            <circle cx={node.x} cy={node.y} r="18" fill={DESIGN.bg} stroke={DESIGN.border} strokeWidth="1.5" />
            <text x={node.x} y={node.y + 5} textAnchor="middle"
              fontSize="12" fontFamily={DESIGN.fontMono} fill={DESIGN.textMuted}>
              {node.label}
            </text>
          </g>
        ))}

        {/* Empty center box — outlined in dashes, where a protocol should be */}
        <rect x={390} y={820} width={300} height={160}
          fill="none"
          stroke={DESIGN.accentDim}
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity={boxOp}
          rx="8"
        />
        <text x={540} y={910} textAnchor="middle"
          fontSize="18" fontFamily={DESIGN.fontMono} fill={DESIGN.accentDim}
          opacity={boxOp}>
          protocol?
        </text>
      </svg>

      {/* "no common language" */}
      <div style={{
        position: "absolute",
        bottom: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        opacity: nclOp,
      }}>
        <div style={{
          fontSize: DESIGN.display.fontSize,
          fontWeight: DESIGN.display.fontWeight,
          letterSpacing: DESIGN.display.letterSpacing,
          color: DESIGN.accent,
          fontFamily: DESIGN.fontDisplay,
        }}>
          no common language
        </div>
        {/* Dashed underline */}
        <div style={{
          marginTop: "8px",
          height: "2px",
          background: `repeating-linear-gradient(90deg, ${DESIGN.accentDim} 0, ${DESIGN.accentDim} 8px, transparent 8px, transparent 14px)`,
          borderRadius: "1px",
        }} />
      </div>
    </AbsoluteFill>
  );
};
