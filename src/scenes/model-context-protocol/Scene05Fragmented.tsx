import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BgClean, DESIGN, SceneProps } from "./DESIGN";

// Scene 5 — "Fragmented."
// Single word in stat typography, split into 3 parts that drift apart (fracture effect)
// Pure white bg, maximum negative space
export const Scene05Fragmented: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();

  // Word appears at frame 1 intact
  const wordOp = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" });

  // Fracture cut lines draw at frame 5
  const cut1Op = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });
  const cut2Op = interpolate(frame, [7, 17], [0, 1], { extrapolateRight: "clamp" });
  const cut3Op = interpolate(frame, [9, 19], [0, 1], { extrapolateRight: "clamp" });

  // Pieces shift apart after cuts
  const shiftAmt = interpolate(frame, [15, 23], [0, 4], { extrapolateRight: "clamp" });

  // Accent dim rule draws below
  const ruleW = interpolate(frame, [25, 37], [0, 400], { extrapolateRight: "clamp" });

  const FRAG_FONT = {
    fontSize: DESIGN.stat.fontSize,
    fontWeight: DESIGN.stat.fontWeight,
    lineHeight: DESIGN.stat.lineHeight,
    letterSpacing: DESIGN.stat.letterSpacing,
    fontFamily: DESIGN.fontDisplay,
  };

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgClean />

      {/* Fracture simulation: 3 sections of "Fragmented." slightly offset */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
      }}>
        {/* Render as overlapping clipped sections to simulate fractures */}
        <div style={{ position: "relative", display: "inline-block", opacity: wordOp }}>
          {/* Top section */}
          <div style={{
            ...FRAG_FONT,
            color: DESIGN.textOn,
            clipPath: "inset(0 0 66% 0)",
            transform: `translateY(${-shiftAmt}px)`,
            opacity: cut1Op,
          }}>
            Fragmented.
          </div>
          {/* Middle section */}
          <div style={{
            ...FRAG_FONT,
            color: DESIGN.textOn,
            clipPath: "inset(33% 0 33% 0)",
            position: "absolute", top: 0, left: 0,
            transform: `translateX(${shiftAmt}px)`,
            opacity: cut2Op,
          }}>
            Fragmented.
          </div>
          {/* Bottom section */}
          <div style={{
            ...FRAG_FONT,
            color: DESIGN.textOn,
            clipPath: "inset(66% 0 0 0)",
            position: "absolute", top: 0, left: 0,
            transform: `translateY(${shiftAmt}px)`,
            opacity: cut3Op,
          }}>
            Fragmented.
          </div>
        </div>
      </div>

      {/* Accent dim rule below */}
      <div style={{
        position: "absolute",
        top: "62%",
        left: "50%",
        transform: "translateX(-50%)",
        width: `${ruleW}px`,
        height: "2px",
        background: DESIGN.accentDim,
        borderRadius: "1px",
      }} />
    </AbsoluteFill>
  );
};
