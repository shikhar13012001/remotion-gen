import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgSignal, DESIGN, SceneProps } from "./DESIGN";

// Scene 6 — "On November 25, 2024, Anthropic released the Model Context Protocol."
// Horizontal timeline bar with single Nov 25 node, MCP label above, 2024 watermark
export const Scene06Timeline: React.FC<SceneProps> = ({ dataValue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timeline bar draws left→right
  const barW = interpolate(frame, [0, 14], [0, 100], { extrapolateRight: "clamp" }); // %

  // Node pops (scale 0→1 with overshoot)
  const nodeScale = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: 12, stiffness: 300 }, durationInFrames: 10 });

  // Labels
  const cap1Op = interpolate(frame, [18, 26], [0, 1], { extrapolateRight: "clamp" });
  const mcpY   = interpolate(frame, [20, 30], [8, 0],  { extrapolateRight: "clamp" });
  const mcpOp  = interpolate(frame, [20, 30], [0, 1],  { extrapolateRight: "clamp" });

  // 2024 watermark at 20% opacity
  const watermarkOp = interpolate(frame, [6, 14], [0, 0.2], { extrapolateRight: "clamp" });

  const year = dataValue ?? 2024;

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgSignal />

      {/* 2024 watermark */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "320px",
        fontWeight: 700,
        fontFamily: DESIGN.fontDisplay,
        color: DESIGN.textOn,
        opacity: watermarkOp,
        userSelect: "none",
        letterSpacing: "-0.04em",
        lineHeight: 1,
      }}>
        {year}
      </div>

      {/* Timeline bar — horizontal at vertical center */}
      <div style={{
        position: "absolute",
        top: "50%", left: "6%",
        transform: "translateY(-50%)",
        width: `${barW}%`,
        height: "2px",
        background: DESIGN.textMuted,
        borderRadius: "1px",
      }} />

      {/* Node at 50% along the bar — "Nov 25, 2024" */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${nodeScale})`,
      }}>
        <div style={{
          width: "20px", height: "20px",
          background: DESIGN.accent,
          borderRadius: "50%",
          marginLeft: "auto", marginRight: "auto",
        }} />
      </div>

      {/* Vertical tick above the node */}
      <div style={{
        position: "absolute",
        top: "38%", left: "50%",
        transform: "translateX(-50%)",
        width: "2px", height: "60px",
        background: DESIGN.textMuted,
        opacity: cap1Op,
      }} />

      {/* Labels above the tick */}
      <div style={{
        position: "absolute",
        top: "25%", left: "50%",
        textAlign: "center",
        opacity: mcpOp,
        transform: `translateX(-50%) translateY(${mcpY}px)`,
      }}>
        <div style={{
          fontSize: DESIGN.caption.fontSize,
          fontFamily: DESIGN.fontMono,
          color: DESIGN.textMuted,
          letterSpacing: DESIGN.caption.letterSpacing,
          marginBottom: "8px",
          opacity: cap1Op,
        }}>
          Anthropic · Nov 25, 2024
        </div>
        <div style={{
          fontSize: DESIGN.display.fontSize,
          fontWeight: DESIGN.display.fontWeight,
          fontFamily: DESIGN.fontDisplay,
          letterSpacing: DESIGN.display.letterSpacing,
          color: DESIGN.accent,
          lineHeight: 1.1,
        }}>
          Model Context Protocol
        </div>
      </div>
    </AbsoluteFill>
  );
};
