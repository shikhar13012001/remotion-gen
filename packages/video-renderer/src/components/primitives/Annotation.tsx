import React from "react";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";

interface Props {
  text:       string;
  side:       "left" | "right";
  frame:      number;
  startFrame: number;
}

/**
 * Documentary annotation: SVG dashed leader + arrowhead + text.
 * Left side: text right-aligned, arrow points right toward subject.
 * Right side: text left-aligned, arrow points left toward subject.
 * Slides in from outside edge, opacity 0 → 1.
 */
export const Annotation: React.FC<Props> = ({ text, side, frame, startFrame }) => {
  const p       = prog(frame, startFrame, 20);
  const opacity = lerp(p, 0, 1, E.out3);
  const x       = lerp(p, side === "left" ? -28 : 28, 0, E.out4);

  // SVG dashed line + arrowhead
  const lineLen = 44;
  const arrowDir = side === "left" ? 1 : -1; // 1 = pointing right, -1 = pointing left
  const ax = side === "left" ? lineLen : 0;
  const arrowPoints = side === "left"
    ? `${lineLen},4 ${lineLen + 6},8 ${lineLen},12`
    : `0,4 -6,8 0,12`;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexDirection: side === "left" ? "row" : "row-reverse",
      opacity,
      transform: `translateX(${x}px)`,
    }}>
      {/* SVG dashed line + arrowhead */}
      <svg
        width={lineLen + (side === "left" ? 10 : 10)}
        height={16}
        style={{ flexShrink: 0, overflow: "visible" }}
      >
        <line
          x1={side === "left" ? 0 : lineLen}
          y1={8}
          x2={side === "left" ? lineLen : 0}
          y2={8}
          stroke={TOKEN.gold}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <polygon
          points={arrowPoints}
          fill={TOKEN.gold}
          opacity={0.65}
          transform={side === "right" ? `translate(${lineLen}, 0)` : ""}
        />
      </svg>
      {/* Text */}
      <span style={{
        fontFamily: TOKEN.sans,
        fontSize: 13,
        fontWeight: 300,
        color: TOKEN.dim,
        maxWidth: 160,
        lineHeight: 1.4,
        textAlign: side === "left" ? "right" : "left",
      }}>
        {text}
      </span>
    </div>
  );
};
