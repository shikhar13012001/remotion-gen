import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 16 — "The context problem is solved. Now every AI has the full picture."
// Resolved callback to Scene01: same AI circle, but now a full MCP bridge with 6 complete connections
// All stubs are now solid lines, a "resolved" check stamp appears
export const Scene16Close: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cx = 540;
  const cy = 880;
  const nodeR = 56;

  // AI node appears (same as Scene01 but accent-stroked)
  const nodeScale = spring({ frame, fps, config: { damping: 14, stiffness: 260 }, durationInFrames: 8 });

  // MCP bridge ring draws in around the node
  const ringScale = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 12, stiffness: 200 }, durationInFrames: 10 });
  const ringOp    = interpolate(frame, [8, 14], [0, 1], { extrapolateRight: "clamp" });

  // 6 full connection lines extend outward (all solid, reaching endpoints)
  const connProgress = interpolate(frame, [16, 30], [0, 1], { extrapolateRight: "clamp" });

  // Endpoint nodes pop on
  const endOp = interpolate(frame, [28, 36], [0, 1], { extrapolateRight: "clamp" });

  // "resolved" stamp
  const resolvedScale = spring({ frame: Math.max(0, frame - 38), fps, config: { damping: 8, stiffness: 400 }, durationInFrames: 6 });
  const resolvedOp    = interpolate(frame, [38, 42], [0, 1], { extrapolateRight: "clamp" });

  const SPOKE_LEN  = 280;
  const ANGLES     = [0, 60, 120, 180, 240, 300].map((d) => d * Math.PI / 180);
  const ENDPOINTS  = ["GitHub", "Slack", "Drive", "Postgres", "Claude", "Agent"];

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      <svg viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>

        {/* Connection lines — all solid */}
        {ANGLES.map((angle, i) => {
          const ex = cx + Math.cos(angle) * SPOKE_LEN * connProgress;
          const ey = cy + Math.sin(angle) * SPOKE_LEN * connProgress;
          return (
            <line key={i}
              x1={cx} y1={cy} x2={ex} y2={ey}
              stroke={DESIGN.accent} strokeWidth="2.5" opacity="0.7" />
          );
        })}

        {/* Endpoint nodes */}
        {ANGLES.map((angle, i) => {
          const ex = cx + Math.cos(angle) * SPOKE_LEN;
          const ey = cy + Math.sin(angle) * SPOKE_LEN;
          return (
            <g key={i} opacity={endOp}>
              <circle cx={ex} cy={ey} r="32"
                fill={DESIGN.surface} stroke={DESIGN.accent} strokeWidth="1.5" />
              <text x={ex} y={ey + 5} textAnchor="middle"
                fontSize="13" fontFamily={DESIGN.fontMono} fill={DESIGN.accent}>
                {ENDPOINTS[i]}
              </text>
            </g>
          );
        })}

        {/* MCP bridge ring (outer ring around AI node) */}
        <circle cx={cx} cy={cy} r={nodeR + 22}
          fill="none"
          stroke={DESIGN.accent}
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity={ringOp}
          transform={`translate(${cx},${cy}) scale(${ringScale}) translate(${-cx},${-cy})`}
        />

        {/* Central AI node */}
        <g transform={`translate(${cx},${cy}) scale(${nodeScale}) translate(${-cx},${-cy})`}>
          <circle cx={cx} cy={cy} r={nodeR}
            fill={DESIGN.surface} stroke={DESIGN.accent} strokeWidth="3" />
          <text x={cx} y={cy - 6} textAnchor="middle"
            fontSize="20" fontWeight="700" fontFamily={DESIGN.fontMono} fill={DESIGN.accent}>
            AI
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle"
            fontSize="12" fontFamily={DESIGN.fontMono} fill={DESIGN.textMuted}>
            + MCP
          </text>
        </g>

        {/* "resolved" check stamp */}
        <g opacity={resolvedOp}
          transform={`translate(${cx},${cy + SPOKE_LEN + 100}) scale(${resolvedScale})`}>
          <text textAnchor="middle"
            fontSize="28" fontWeight="700" fontFamily={DESIGN.fontDisplay}
            fill={DESIGN.accent} letterSpacing="0.06em">
            ✓ context solved
          </text>
        </g>
      </svg>

      {/* Caption */}
      <div style={{
        position: "absolute",
        bottom: "140px",
        left: 0, right: 0,
        textAlign: "center",
        fontFamily: DESIGN.fontMono,
        fontSize: DESIGN.caption.fontSize,
        color: DESIGN.textMuted,
        letterSpacing: "0.08em",
        opacity: resolvedOp,
      }}>
        every AI · full picture
      </div>
    </AbsoluteFill>
  );
};
