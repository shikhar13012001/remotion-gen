import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 10 — "Anthropic shipped pre-built servers for GitHub, Slack, Google Drive, Postgres, and more on day one."
// Delivery manifest ledger + "day one" diagonal stamp
const SERVICES = ["GitHub", "Slack", "Google Drive", "Postgres", "+ more"];

export const Scene10Manifest: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ledger border draws in
  const borderOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const headerOp = interpolate(frame, [6, 12], [0, 1], { extrapolateRight: "clamp" });

  // "day one" stamp slaps in
  const stampScale = spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 10, stiffness: 400 }, durationInFrames: 6 });
  const stampOp    = interpolate(frame, [26, 28], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "60px",
      }}>
        {/* Ledger */}
        <div style={{
          width: "860px",
          border: `2px solid ${DESIGN.border}`,
          borderRadius: "12px",
          overflow: "hidden",
          opacity: borderOp,
          position: "relative",
        }}>
          {/* Header */}
          <div style={{
            padding: "20px 32px",
            borderBottom: `1px solid ${DESIGN.border}`,
            fontFamily: DESIGN.fontMono,
            fontSize: DESIGN.caption.fontSize,
            color: DESIGN.textMuted,
            letterSpacing: "0.1em",
            opacity: headerOp,
            background: DESIGN.surface,
          }}>
            Pre-built Servers · Shipped Day One
          </div>

          {/* Rows */}
          {SERVICES.map((svc, i) => {
            const rowStart = 10 + i * 6;
            const rowOp    = interpolate(frame, [rowStart, rowStart + 6], [0, 1], { extrapolateRight: "clamp" });
            const chkOp    = interpolate(frame, [rowStart + 2, rowStart + 6], [0, 1], { extrapolateRight: "clamp" });
            const readyScale = spring({ frame: Math.max(0, frame - (rowStart + 4)), fps, config: { damping: 10, stiffness: 360 }, durationInFrames: 5 });

            return (
              <div key={svc} style={{
                display: "flex", alignItems: "center",
                padding: "20px 32px",
                borderBottom: i < SERVICES.length - 1 ? `1px solid ${DESIGN.border}` : "none",
                opacity: rowOp,
              }}>
                {/* Checkbox */}
                <div style={{
                  width: "22px", height: "22px",
                  background: DESIGN.accent,
                  borderRadius: "4px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: chkOp,
                  marginRight: "24px",
                  flexShrink: 0,
                }}>
                  <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>✓</span>
                </div>

                {/* Service name */}
                <div style={{
                  flex: 1,
                  fontFamily: DESIGN.fontDisplay,
                  fontSize: DESIGN.body.fontSize,
                  color: DESIGN.textOn,
                }}>
                  {svc}
                </div>

                {/* READY stamp */}
                <div style={{
                  fontFamily: DESIGN.fontMono,
                  fontSize: DESIGN.caption.fontSize,
                  color: DESIGN.accent,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  transform: `scale(${readyScale})`,
                  transformOrigin: "right center",
                }}>
                  READY
                </div>
              </div>
            );
          })}

          {/* "day one" diagonal stamp */}
          <div style={{
            position: "absolute",
            top: "20%",
            right: "-20px",
            transform: `rotate(-5deg) scale(${stampScale})`,
            transformOrigin: "center center",
            opacity: stampOp,
            fontFamily: DESIGN.fontDisplay,
            fontSize: DESIGN.display.fontSize,
            fontWeight: DESIGN.display.fontWeight,
            color: DESIGN.accent,
            letterSpacing: DESIGN.display.letterSpacing,
            pointerEvents: "none",
          }}>
            day one
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
