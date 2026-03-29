import React from "react";

export interface ScanLinesProps {
  opacity: number;
  spacing?: number; // default 4
}

export const ScanLines: React.FC<ScanLinesProps> = ({ opacity, spacing = 4 }) => {
  const id = "scanlines-pattern";
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={id} x="0" y="0" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2={spacing} y2="0"
              stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
};
