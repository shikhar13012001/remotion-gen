import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 12 — "One standard. Every tool. Every model. Every data source."
// Horizontal measurement rule spanning full width, "One" above, "standard." below
// Tick marks at endpoints + midpoint, words enumerate below the rule
export const Scene12OneMeasure: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "One" slams in
  const oneScale = spring({ frame, fps, config: { damping: 10, stiffness: 380 }, durationInFrames: 6 });
  const oneOp    = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });

  // Rule draws left → right
  const ruleW = interpolate(frame, [6, 18], [0, 100], { extrapolateRight: "clamp" });

  // "standard." fades in below rule
  const stdOp = interpolate(frame, [18, 26], [0, 1], { extrapolateRight: "clamp" });
  const stdY  = interpolate(frame, [18, 26], [10, 0], { extrapolateRight: "clamp" });

  // Tick marks at endpoints
  const tickOp = interpolate(frame, [16, 22], [0, 1], { extrapolateRight: "clamp" });

  // Three enumerations below: "every tool", "every model", "every data source"
  const e1Op = interpolate(frame, [26, 32], [0, 1], { extrapolateRight: "clamp" });
  const e2Op = interpolate(frame, [30, 36], [0, 1], { extrapolateRight: "clamp" });
  const e3Op = interpolate(frame, [34, 40], [0, 1], { extrapolateRight: "clamp" });

  const ITEMS = [
    { label: "every tool", op: e1Op },
    { label: "every model", op: e2Op },
    { label: "every data source", op: e3Op },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "60px",
      }}>
        {/* "One" */}
        <div style={{
          fontFamily: DESIGN.fontDisplay,
          fontSize: DESIGN.stat.fontSize,
          fontWeight: DESIGN.stat.fontWeight as number,
          color: DESIGN.accent,
          letterSpacing: DESIGN.stat.letterSpacing,
          lineHeight: 1,
          opacity: oneOp,
          transform: `scale(${oneScale})`,
          transformOrigin: "center bottom",
          marginBottom: "32px",
        }}>
          One
        </div>

        {/* Measurement rule */}
        <div style={{
          position: "relative",
          width: "860px",
          marginBottom: "28px",
        }}>
          {/* Main rule line */}
          <div style={{
            width: `${ruleW}%`,
            height: "2px",
            background: DESIGN.textOn,
            borderRadius: "1px",
          }} />

          {/* Left tick */}
          <div style={{
            position: "absolute",
            left: "0", top: "-10px",
            width: "2px", height: "22px",
            background: DESIGN.textOn,
            opacity: tickOp,
          }} />

          {/* Mid tick */}
          <div style={{
            position: "absolute",
            left: "50%", top: "-6px",
            transform: "translateX(-50%)",
            width: "2px", height: "14px",
            background: DESIGN.textMuted,
            opacity: tickOp,
          }} />

          {/* Right tick */}
          <div style={{
            position: "absolute",
            right: "0", top: "-10px",
            width: "2px", height: "22px",
            background: DESIGN.textOn,
            opacity: tickOp,
          }} />
        </div>

        {/* "standard." */}
        <div style={{
          fontFamily: DESIGN.fontDisplay,
          fontSize: "64px",
          fontWeight: 700,
          color: DESIGN.textOn,
          letterSpacing: "-0.02em",
          opacity: stdOp,
          transform: `translateY(${stdY}px)`,
          marginBottom: "56px",
        }}>
          standard.
        </div>

        {/* Enumeration items */}
        <div style={{ display: "flex", gap: "48px" }}>
          {ITEMS.map((item) => (
            <div key={item.label} style={{
              fontFamily: DESIGN.fontMono,
              fontSize: DESIGN.caption.fontSize,
              color: DESIGN.textMuted,
              letterSpacing: "0.06em",
              opacity: item.op,
            }}>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
