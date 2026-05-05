import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 15 — "MCP is open, royalty-free, and already in Anthropic's products."
// 3-row property spec card: License / Specification / Availability
// Card slides up, rows reveal sequentially
const ROWS = [
  { prop: "License",       value: "Open"         },
  { prop: "Specification", value: "Royalty-Free"  },
  { prop: "Availability",  value: "In Production" },
];

export const Scene15SpecCard: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card slides up from below
  const cardY = interpolate(frame, [0, 14], [80, 0], { extrapolateRight: "clamp" });
  const cardOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Header reveals
  const headerOp = interpolate(frame, [8, 14], [0, 1], { extrapolateRight: "clamp" });

  // Rows stagger in
  const rowScales = ROWS.map((_, i) => {
    return spring({ frame: Math.max(0, frame - (14 + i * 7)), fps, config: { damping: 14, stiffness: 280 }, durationInFrames: 8 });
  });
  const rowOps = ROWS.map((_, i) => {
    return interpolate(frame, [14 + i * 7, 14 + i * 7 + 7], [0, 1], { extrapolateRight: "clamp" });
  });

  // Accent badge after all rows
  const badgeOp = interpolate(frame, [36, 44], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "60px",
      }}>
        {/* Spec card */}
        <div style={{
          width: "820px",
          border: `2px solid ${DESIGN.border}`,
          borderRadius: "8px",
          overflow: "hidden",
          opacity: cardOp,
          transform: `translateY(${cardY}px)`,
        }}>
          {/* Card header */}
          <div style={{
            padding: "20px 36px",
            borderBottom: `1px solid ${DESIGN.border}`,
            background: DESIGN.surface,
            fontFamily: DESIGN.fontMono,
            fontSize: DESIGN.caption.fontSize,
            color: DESIGN.textMuted,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            opacity: headerOp,
          }}>
            Model Context Protocol · Specification
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div key={row.prop} style={{
              display: "flex",
              alignItems: "center",
              padding: "28px 36px",
              borderBottom: i < ROWS.length - 1 ? `1px solid ${DESIGN.border}` : "none",
              background: DESIGN.surface,
              opacity: rowOps[i],
              transform: `scaleY(${rowScales[i]})`,
              transformOrigin: "top center",
            }}>
              {/* Property name */}
              <div style={{
                flex: "0 0 260px",
                fontFamily: DESIGN.fontMono,
                fontSize: DESIGN.caption.fontSize,
                color: DESIGN.textMuted,
                letterSpacing: "0.08em",
              }}>
                {row.prop}
              </div>

              {/* Separator dot */}
              <div style={{
                width: "4px", height: "4px",
                borderRadius: "50%",
                background: DESIGN.border,
                marginRight: "36px",
                flexShrink: 0,
              }} />

              {/* Value */}
              <div style={{
                fontFamily: DESIGN.fontDisplay,
                fontSize: DESIGN.body.fontSize,
                fontWeight: 700,
                color: DESIGN.accent,
                letterSpacing: "-0.01em",
              }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* "already in Anthropic's products" badge */}
        <div style={{
          marginTop: "32px",
          fontFamily: DESIGN.fontMono,
          fontSize: DESIGN.caption.fontSize,
          color: DESIGN.textMuted,
          letterSpacing: "0.06em",
          opacity: badgeOp,
        }}>
          already in Anthropic's products
        </div>
      </div>
    </AbsoluteFill>
  );
};
