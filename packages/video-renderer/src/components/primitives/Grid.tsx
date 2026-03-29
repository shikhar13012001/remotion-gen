import React from "react";
import { TOKEN } from "../../tokens";

interface Props { size?: number }

/**
 * L-path line grid — barely visible, felt not seen.
 * rgba(255,255,255,0.045) — grounds the composition without distracting.
 */
export const Grid: React.FC<Props> = ({ size = TOKEN.gridSize }) => (
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id={`grid-${size}`} x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
        <path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke={TOKEN.gridColor} strokeWidth="0.75" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#grid-${size})`} />
  </svg>
);
