import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 7 — "MCP is an open standard — one protocol that connects any AI system to any data source."
// Hub-and-spoke: MCP hexagon center + 8 spoke lines + endpoint circles — clean resolved diagram
const ENDPOINTS = ["Tool A", "Data B", "System C", "API D", "DB E", "Service F", "Store G", "Agent H"];

export const Scene07Hub: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cx = 540;
  const cy = 960;
  const spokLen = 260;

  // Hexagon scales in
  const hexScale = spring({ frame, fps, config: { damping: 14, stiffness: 260 }, durationInFrames: 8 });

  // Spokes draw simultaneously
  const spokeProgress = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" });

  // Endpoint circles pop on
  const endpointOp = interpolate(frame, [20, 26], [0, 1], { extrapolateRight: "clamp" });

  // Labels
  const oneProtoOp = interpolate(frame, [24, 32], [0, 1], { extrapolateRight: "clamp" });
  const anyDataOp  = interpolate(frame, [28, 36], [0, 1], { extrapolateRight: "clamp" });

  const angles = ENDPOINTS.map((_, i) => (i * 360) / ENDPOINTS.length * Math.PI / 180);

  // Hexagon polygon points
  const hexR = 72;
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    return `${cx + Math.cos(a) * hexR},${cy + Math.sin(a) * hexR}`;
  }).join(" ");

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      <svg viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>

        {/* Spokes */}
        {angles.map((angle, i) => {
          const ex = cx + Math.cos(angle) * spokLen * spokeProgress;
          const ey = cy + Math.sin(angle) * spokLen * spokeProgress;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={ex} y2={ey}
                stroke={DESIGN.border} strokeWidth="2"
                markerEnd="url(#arrowhead)" />
            </g>
          );
        })}

        {/* Arrowhead marker */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={DESIGN.border} />
          </marker>
        </defs>

        {/* Endpoint circles */}
        {angles.map((angle, i) => {
          const ex = cx + Math.cos(angle) * spokLen;
          const ey = cy + Math.sin(angle) * spokLen;
          return (
            <g key={i} opacity={endpointOp}>
              <circle cx={ex} cy={ey} r="36" fill={DESIGN.bg} stroke={DESIGN.border} strokeWidth="1.5" />
              <text x={ex} y={ey + 5} textAnchor="middle"
                fontSize="14" fontFamily={DESIGN.fontMono} fill={DESIGN.textMuted}>
                {ENDPOINTS[i]}
              </text>
            </g>
          );
        })}

        {/* Central hexagon */}
        <g transform={`translate(${cx},${cy}) scale(${hexScale}) translate(${-cx},${-cy})`}>
          <polygon points={hexPoints} fill={DESIGN.bg} stroke={DESIGN.accent} strokeWidth="3" />
          <text x={cx} y={cy - 8} textAnchor="middle"
            fontSize="22" fontWeight="700" fontFamily={DESIGN.fontMono} fill={DESIGN.accent}>
            MCP
          </text>
          {/* "one protocol" annotation */}
          <text x={cx} y={cy + 24} textAnchor="middle"
            fontSize="13" fontFamily={DESIGN.fontMono} fill={DESIGN.accent}
            opacity={oneProtoOp}>
            one protocol
          </text>
        </g>

        {/* "any data source" arc bracket around endpoints */}
        <text x={cx} y={cy + spokLen + 60} textAnchor="middle"
          fontSize="18" fontFamily={DESIGN.fontMono} fill={DESIGN.accentDim}
          opacity={anyDataOp}>
          ← any data source →
        </text>
      </svg>
    </AbsoluteFill>
  );
};
