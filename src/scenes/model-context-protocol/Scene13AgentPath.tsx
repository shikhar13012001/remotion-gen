import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgSignal, DESIGN, SceneProps } from "./DESIGN";

// Scene 13 — "An agent can now move through the internet with context, calling tools natively."
// Horizontal transit rail, agent capsule moves left→right through 3 stations
// Context capsule grows as it passes each station, "natively" stamp at end
const STATIONS = [
  { label: "Tool A", x: 180 },
  { label: "Tool B", x: 540 },
  { label: "Tool C", x: 900 },
];
const RAIL_Y   = 960;
const AGENT_Y  = RAIL_Y - 48;

export const Scene13AgentPath: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rail draws left → right
  const railW = interpolate(frame, [0, 12], [0, 1080], { extrapolateRight: "clamp" });

  // Stations pop on
  const sta1Op = interpolate(frame, [10, 16], [0, 1], { extrapolateRight: "clamp" });
  const sta2Op = interpolate(frame, [14, 20], [0, 1], { extrapolateRight: "clamp" });
  const sta3Op = interpolate(frame, [18, 24], [0, 1], { extrapolateRight: "clamp" });
  const stationOps = [sta1Op, sta2Op, sta3Op];

  // Agent capsule travels from left edge → beyond station C
  const agentX = interpolate(frame, [12, 52], [60, 980], { extrapolateRight: "clamp" });

  // Context capsule widens as agent passes through stations
  const ctxW = interpolate(frame, [20, 48], [60, 200], { extrapolateRight: "clamp" });

  // "natively" label appears at end
  const nativeScale = spring({ frame: Math.max(0, frame - 50), fps, config: { damping: 10, stiffness: 340 }, durationInFrames: 6 });
  const nativeOp    = interpolate(frame, [50, 54], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgSignal />

      {/* Transit rail */}
      <div style={{
        position: "absolute",
        top: `${RAIL_Y}px`,
        left: "0",
        width: `${railW}px`,
        height: "3px",
        background: DESIGN.border,
        borderRadius: "2px",
      }} />

      {/* Stations */}
      {STATIONS.map((sta, i) => (
        <div key={sta.label} style={{
          position: "absolute",
          top: `${RAIL_Y - 16}px`,
          left: `${sta.x - 1}px`,
          width: "2px",
          height: "32px",
          background: DESIGN.textMuted,
          opacity: stationOps[i],
        }}>
          {/* Station label above */}
          <div style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            fontFamily: DESIGN.fontMono,
            fontSize: "16px",
            color: DESIGN.textMuted,
            opacity: stationOps[i],
          }}>
            {sta.label}
          </div>
          {/* Station dot */}
          <div style={{
            position: "absolute",
            top: "-4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "10px", height: "10px",
            background: DESIGN.accent,
            borderRadius: "50%",
          }} />
        </div>
      ))}

      {/* Agent capsule + context glow */}
      <div style={{
        position: "absolute",
        top: `${AGENT_Y - 28}px`,
        left: `${agentX - ctxW / 2}px`,
        width: `${ctxW}px`,
        height: "56px",
        background: DESIGN.accentGlow,
        border: `1.5px solid ${DESIGN.accent}`,
        borderRadius: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}>
        {/* Agent label */}
        <div style={{
          fontFamily: DESIGN.fontMono,
          fontSize: "16px",
          fontWeight: 700,
          color: DESIGN.accent,
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}>
          agent
        </div>
        {/* Context indicator grows */}
        <div style={{
          fontFamily: DESIGN.fontMono,
          fontSize: "11px",
          color: DESIGN.accent,
          opacity: 0.7,
          whiteSpace: "nowrap",
        }}>
          + ctx
        </div>
      </div>

      {/* "natively" stamp */}
      <div style={{
        position: "absolute",
        top: `${RAIL_Y + 56}px`,
        left: "50%",
        transform: `translateX(-50%) scale(${nativeScale})`,
        fontFamily: DESIGN.fontDisplay,
        fontSize: "36px",
        fontWeight: 700,
        color: DESIGN.accent,
        letterSpacing: "0.06em",
        opacity: nativeOp,
      }}>
        natively
      </div>
    </AbsoluteFill>
  );
};
