import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 2 — "The models are capable but sealed off from the data..."
// Split panel: MODEL (left) | barrier | data sources (right)
export const Scene02Sealed: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();

  const leftX  = interpolate(frame, [0, 10],  [-400, 0],   { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [0, 10],  [0, 1],      { extrapolateRight: "clamp" });

  // Data boxes stagger in
  const box1Op = interpolate(frame, [10, 16], [0, 1], { extrapolateRight: "clamp" });
  const box2Op = interpolate(frame, [14, 20], [0, 1], { extrapolateRight: "clamp" });
  const box3Op = interpolate(frame, [18, 24], [0, 1], { extrapolateRight: "clamp" });
  const box4Op = interpolate(frame, [22, 28], [0, 1], { extrapolateRight: "clamp" });

  const barrierH  = interpolate(frame, [24, 32], [0, 1], { extrapolateRight: "clamp" });
  const sealedOp  = interpolate(frame, [32, 40], [0, 1], { extrapolateRight: "clamp" });

  const CAPABILITIES = ["reasoning", "generation", "analysis"];
  const DATA_SOURCES = [
    { label: "Database", op: box1Op },
    { label: "Files", op: box2Op },
    { label: "APIs", op: box3Op },
    { label: "Live Data", op: box4Op },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center",
        paddingLeft: "60px", paddingRight: "60px",
        gap: "0px",
      }}>
        {/* Left: MODEL panel */}
        <div style={{
          flex: 1,
          opacity: leftOp,
          transform: `translateX(${leftX}px)`,
          display: "flex", flexDirection: "column", alignItems: "flex-start",
        }}>
          <div style={{
            background: DESIGN.surface,
            border: `2px solid ${DESIGN.textOn}`,
            borderRadius: "12px",
            padding: "32px 40px",
            width: "340px",
          }}>
            <div style={{
              fontFamily: DESIGN.fontMono,
              fontSize: DESIGN.caption.fontSize,
              letterSpacing: DESIGN.caption.letterSpacing,
              fontWeight: 700,
              color: DESIGN.textOn,
              marginBottom: "20px",
            }}>
              MODEL
            </div>
            {CAPABILITIES.map((cap) => (
              <div key={cap} style={{
                fontSize: DESIGN.caption.fontSize,
                color: DESIGN.textMuted,
                fontFamily: DESIGN.fontMono,
                marginBottom: "8px",
              }}>
                {cap}
              </div>
            ))}
          </div>
        </div>

        {/* Center: barrier */}
        <div style={{
          width: "6px",
          height: `${barrierH * 600}px`,
          background: DESIGN.textOn,
          flexShrink: 0,
          borderRadius: "3px",
          position: "relative",
        }}>
          {/* "sealed off" annotation */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "16px",
            transform: "translateY(-50%) rotate(90deg)",
            transformOrigin: "left center",
            whiteSpace: "nowrap",
            fontSize: DESIGN.caption.fontSize,
            fontFamily: DESIGN.fontMono,
            color: DESIGN.accent,
            fontWeight: 700,
            opacity: sealedOp,
          }}>
            sealed off
          </div>
        </div>

        {/* Right: data sources */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "16px",
          paddingLeft: "40px",
        }}>
          {DATA_SOURCES.map((ds) => (
            <div key={ds.label} style={{
              border: `1px solid ${DESIGN.border}`,
              borderRadius: "8px",
              padding: "16px 28px",
              width: "280px",
              opacity: ds.op,
              fontSize: DESIGN.body.fontSize,
              fontFamily: DESIGN.fontMono,
              color: DESIGN.textMuted,
            }}>
              {ds.label}
            </div>
          ))}

          {/* "useful" — greyed out, unreachable */}
          <div style={{
            opacity: box4Op * 0.35,
            fontSize: DESIGN.caption.fontSize,
            fontFamily: DESIGN.fontMono,
            color: DESIGN.textMuted,
            marginTop: "12px",
            textDecoration: "line-through",
          }}>
            useful
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
