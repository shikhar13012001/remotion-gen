import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgSignal, DESIGN, SceneProps } from "./DESIGN";

// Scene 9 — "Build the server once and every MCP-compatible AI tool connects immediately."
// Flow: Server block → single pipe → fan → 3 AI Tool rectangles
// Annotated: "once" (server badge), "every" (bracket over tools), "immediately" (junction stamp)
export const Scene09Flow: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Server block appears at frame 1
  const serverOp = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });

  // Main pipe draws left→right (server → junction)
  const pipeW = interpolate(frame, [4, 12], [0, 200], { extrapolateRight: "clamp" });

  // Fan junction opens
  const fanScale = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 14, stiffness: 240 }, durationInFrames: 6 });

  // Branch pipes draw to 3 tools
  const branchW = interpolate(frame, [18, 28], [0, 180], { extrapolateRight: "clamp" });

  // AI tool boxes snap in
  const tool1Op = interpolate(frame, [28, 33], [0, 1], { extrapolateRight: "clamp" });
  const tool2Op = interpolate(frame, [31, 36], [0, 1], { extrapolateRight: "clamp" });
  const tool3Op = interpolate(frame, [34, 39], [0, 1], { extrapolateRight: "clamp" });

  // Status dots pulse
  const dotScale = 1 + 0.15 * Math.sin(frame * 0.3);

  // "immediately" stamp
  const immOp = interpolate(frame, [34, 42], [0, 1], { extrapolateRight: "clamp" });

  const TOOLS = [
    { label: "Tool 1", op: tool1Op, y: -160 },
    { label: "Tool 2", op: tool2Op, y: 0 },
    { label: "Tool 3", op: tool3Op, y: 160 },
  ];

  const SX = 120; // Server left edge
  const CY = 960; // Vertical center
  const JUNCTION_X = SX + 280 + 200; // Junction point X

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgSignal />

      {/* Server block */}
      <div style={{
        position: "absolute",
        top: `${CY - 80}px`,
        left: `${SX}px`,
        width: "220px",
        opacity: serverOp,
        background: DESIGN.surface,
        border: `2px solid ${DESIGN.textOn}`,
        borderRadius: "10px",
        padding: "24px",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: DESIGN.fontMono, fontSize: DESIGN.caption.fontSize, color: DESIGN.textOn, fontWeight: 700 }}>
          Server
        </div>
        <div style={{
          marginTop: "8px",
          fontSize: "13px",
          fontFamily: DESIGN.fontMono,
          color: DESIGN.accent,
          fontWeight: 700,
          background: DESIGN.accentGlow,
          borderRadius: "4px",
          padding: "3px 8px",
          display: "inline-block",
        }}>
          ✓ once
        </div>
      </div>

      {/* Main pipe */}
      <div style={{
        position: "absolute",
        top: `${CY - 2}px`,
        left: `${SX + 220}px`,
        width: `${pipeW}px`,
        height: "4px",
        background: DESIGN.textOn,
        borderRadius: "2px",
      }} />

      {/* Fan junction */}
      <div style={{
        position: "absolute",
        top: `${CY - 20}px`,
        left: `${JUNCTION_X - 20}px`,
        width: "40px", height: "40px",
        background: DESIGN.accent,
        borderRadius: "50%",
        transform: `scale(${fanScale})`,
      }} />

      {/* "immediately" stamp at junction */}
      <div style={{
        position: "absolute",
        top: `${CY + 32}px`,
        left: `${JUNCTION_X - 60}px`,
        fontFamily: DESIGN.fontMono,
        fontSize: "16px",
        color: DESIGN.accent,
        fontWeight: 700,
        opacity: immOp,
        whiteSpace: "nowrap",
      }}>
        immediately
      </div>

      {/* Branch pipes + AI tools */}
      {TOOLS.map((tool, i) => {
        const toolY = CY + tool.y;
        return (
          <g key={tool.label}>
            {/* Branch pipe */}
            <div style={{
              position: "absolute",
              top: `${toolY - 2}px`,
              left: `${JUNCTION_X + 20}px`,
              width: `${branchW}px`,
              height: "4px",
              background: DESIGN.border,
              borderRadius: "2px",
            }} />

            {/* AI tool box */}
            <div style={{
              position: "absolute",
              top: `${toolY - 48}px`,
              left: `${JUNCTION_X + 20 + branchW}px`,
              width: "160px",
              opacity: tool.op,
              background: DESIGN.surface,
              border: `1px solid ${DESIGN.border}`,
              borderRadius: "8px",
              padding: "16px 20px",
              fontFamily: DESIGN.fontMono,
              fontSize: DESIGN.caption.fontSize,
              color: DESIGN.textOn,
            }}>
              {tool.label}
              {/* Status dot */}
              <span style={{
                display: "inline-block",
                width: "8px", height: "8px",
                background: "#22c55e",
                borderRadius: "50%",
                marginLeft: "8px",
                transform: `scale(${dotScale})`,
              }} />
            </div>
          </g>
        );
      })}

      {/* "every" bracket over tools */}
      <div style={{
        position: "absolute",
        top: `${CY - 260}px`,
        left: `${JUNCTION_X + 20 + branchW + 10}px`,
        fontFamily: DESIGN.fontMono,
        fontSize: DESIGN.caption.fontSize,
        color: DESIGN.accent,
        opacity: tool3Op,
        fontWeight: 700,
      }}>
        every ↓
      </div>
    </AbsoluteFill>
  );
};
