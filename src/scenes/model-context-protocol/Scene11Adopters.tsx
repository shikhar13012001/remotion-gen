import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgFlare, DESIGN, SceneProps } from "./DESIGN";

// Scene 11 — "Block, Apollo, Zed, and Replit adopted it before it was even public."
// 2×2 adopter grid with border cells, "pre-launch" badge bottom-right, annotation below
const ADOPTERS = ["Block", "Apollo", "Zed", "Replit"];

export const Scene11Adopters: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grid frame draws in first
  const gridOp = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  // Cells stagger in (top-left, top-right, bottom-left, bottom-right)
  const cellScales = ADOPTERS.map((_, i) => {
    return spring({ frame: Math.max(0, frame - (6 + i * 5)), fps, config: { damping: 14, stiffness: 280 }, durationInFrames: 8 });
  });

  // Badges appear after cells
  const badgeOp = interpolate(frame, [28, 36], [0, 1], { extrapolateRight: "clamp" });

  // Annotation below
  const annotOp = interpolate(frame, [36, 44], [0, 1], { extrapolateRight: "clamp" });
  const annotY  = interpolate(frame, [36, 44], [12, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgFlare />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "80px 60px",
        gap: "32px",
      }}>
        {/* 2×2 grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "0",
          width: "780px",
          border: `1px solid ${DESIGN.border}`,
          borderRadius: "4px",
          overflow: "hidden",
          opacity: gridOp,
        }}>
          {ADOPTERS.map((name, i) => {
            const isRight  = i % 2 === 1;
            const isBottom = i >= 2;
            return (
              <div key={name} style={{
                position: "relative",
                padding: "60px 40px",
                borderRight:  !isRight  ? `1px solid ${DESIGN.border}` : "none",
                borderBottom: !isBottom ? `1px solid ${DESIGN.border}` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${cellScales[i]})`,
                transformOrigin: "center center",
                background: DESIGN.surface,
              }}>
                {/* Company name */}
                <div style={{
                  fontFamily: DESIGN.fontDisplay,
                  fontSize: DESIGN.body.fontSize,
                  fontWeight: 700,
                  color: DESIGN.textOn,
                  letterSpacing: "-0.01em",
                }}>
                  {name}
                </div>

                {/* Pre-launch badge — bottom-right */}
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  fontFamily: DESIGN.fontMono,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: DESIGN.accent,
                  background: DESIGN.accentGlow,
                  border: `1px solid ${DESIGN.accent}`,
                  borderRadius: "3px",
                  padding: "3px 7px",
                  opacity: badgeOp,
                  textTransform: "uppercase" as const,
                }}>
                  pre-launch
                </div>
              </div>
            );
          })}
        </div>

        {/* Annotation */}
        <div style={{
          fontFamily: DESIGN.fontMono,
          fontSize: DESIGN.caption.fontSize,
          color: DESIGN.textMuted,
          letterSpacing: "0.08em",
          opacity: annotOp,
          transform: `translateY(${annotY}px)`,
        }}>
          adopted before public launch
        </div>
      </div>
    </AbsoluteFill>
  );
};
