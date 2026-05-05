import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgSignal, DESIGN, SceneProps } from "./DESIGN";

// Scene 1 — "Every AI assistant is flying blind."
// AI node + 6 truncated connector stubs + "flying blind" diagnostic label
// BgSignal (white clinical grid)
export const Scene01Hook: React.FC<SceneProps> = ({ highlightWords }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodeScale = spring({ frame, fps, config: { damping: 14, stiffness: 280 }, durationInFrames: 8 });
  const stubProgress = interpolate(frame, [6, 18], [0, 1], { extrapolateRight: "clamp" });
  const textOp    = interpolate(frame, [22, 32], [0, 1], { extrapolateRight: "clamp" });
  const ruleW     = interpolate(frame, [28, 40], [0, 220], { extrapolateRight: "clamp" });

  const cx = 540;
  const cy = 820;
  const r  = 64;
  const stubLen = 130;
  const angles  = [0, 60, 120, 180, 240, 300].map(deg => (deg * Math.PI) / 180);

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgSignal />

      <svg
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* Connector stubs — draw outward from node edge */}
        {angles.map((angle, i) => {
          const x1 = cx + Math.cos(angle) * r;
          const y1 = cy + Math.sin(angle) * r;
          const x2 = cx + Math.cos(angle) * (r + stubLen * stubProgress);
          const y2 = cy + Math.sin(angle) * (r + stubLen * stubProgress);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={DESIGN.border} strokeWidth="3" strokeLinecap="square" />
          );
        })}

        {/* AI node circle */}
        <g transform={`translate(${cx},${cy}) scale(${nodeScale}) translate(${-cx},${-cy})`}>
          <circle cx={cx} cy={cy} r={r} fill={DESIGN.bg} stroke={DESIGN.textOn} strokeWidth="3" />
          <text x={cx} y={cy + 8} textAnchor="middle"
            fontSize="24" fontWeight="700" fontFamily={DESIGN.fontMono} fill={DESIGN.textOn}>
            AI
          </text>
        </g>
      </svg>

      {/* "flying blind" diagnostic label */}
      <div style={{
        position: "absolute",
        top: "55%",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        opacity: textOp,
      }}>
        <div style={{
          fontSize: DESIGN.display.fontSize,
          fontWeight: DESIGN.display.fontWeight,
          letterSpacing: DESIGN.display.letterSpacing,
          lineHeight: DESIGN.display.lineHeight,
          color: DESIGN.accent,
          fontFamily: DESIGN.fontDisplay,
        }}>
          flying blind
        </div>

        {/* Accent rule beneath */}
        <div style={{
          width: `${ruleW}px`,
          height: "2px",
          background: DESIGN.accentDim,
          margin: "12px auto 0",
          borderRadius: "1px",
        }} />
      </div>
    </AbsoluteFill>
  );
};
