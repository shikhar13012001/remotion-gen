import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 14 — "This isn't a feature. This is a structural shift in how AI systems are built."
// Two-column split: FEATURE (left, small/muted) | STRUCTURAL SHIFT (right, large/accent)
// Vertical divider draws top→bottom, columns slide in from opposite sides
export const Scene14BeforeAfter: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();

  // Divider draws top → bottom
  const divH = interpolate(frame, [0, 14], [0, 100], { extrapolateRight: "clamp" });

  // Left column slides in from left
  const leftX = interpolate(frame, [6, 18], [-120, 0], { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [6, 18], [0, 1], { extrapolateRight: "clamp" });

  // Right column slides in from right
  const rightX = interpolate(frame, [10, 22], [120, 0], { extrapolateRight: "clamp" });
  const rightOp = interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" });

  // Labels appear staggered
  const label1Op = interpolate(frame, [18, 26], [0, 1], { extrapolateRight: "clamp" });
  const label2Op = interpolate(frame, [24, 32], [0, 1], { extrapolateRight: "clamp" });

  // "not a feature" strikethrough
  const strikeW = interpolate(frame, [22, 30], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Left column — FEATURE (small, muted, crossed out) */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "60px",
          opacity: leftOp,
          transform: `translateX(${leftX}px)`,
        }}>
          {/* Category label */}
          <div style={{
            fontFamily: DESIGN.fontMono,
            fontSize: DESIGN.caption.fontSize,
            color: DESIGN.textMuted,
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            marginBottom: "32px",
            opacity: label1Op,
          }}>
            not a
          </div>

          {/* FEATURE — with growing strikethrough */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
              fontFamily: DESIGN.fontDisplay,
              fontSize: "64px",
              fontWeight: 700,
              color: DESIGN.textMuted,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              FEATURE
            </div>
            {/* Strikethrough line */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: `${strikeW}%`,
              height: "3px",
              background: DESIGN.textMuted,
              borderRadius: "2px",
              transform: "translateY(-50%)",
            }} />
          </div>
        </div>

        {/* Center divider */}
        <div style={{
          width: "2px",
          height: `${divH}%`,
          background: DESIGN.border,
          flexShrink: 0,
          alignSelf: "stretch",
          margin: "60px 0",
        }} />

        {/* Right column — STRUCTURAL SHIFT (large, accent) */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "60px",
          opacity: rightOp,
          transform: `translateX(${rightX}px)`,
        }}>
          {/* Category label */}
          <div style={{
            fontFamily: DESIGN.fontMono,
            fontSize: DESIGN.caption.fontSize,
            color: DESIGN.accent,
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            marginBottom: "32px",
            opacity: label2Op,
          }}>
            this is a
          </div>

          {/* STRUCTURAL SHIFT */}
          <div style={{
            fontFamily: DESIGN.fontDisplay,
            fontSize: "60px",
            fontWeight: 700,
            color: DESIGN.accent,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            textAlign: "center" as const,
          }}>
            STRUCTURAL
            <br />
            SHIFT
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
