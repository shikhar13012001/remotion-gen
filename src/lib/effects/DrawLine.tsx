import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface DrawLineProps {
  points: [number, number][];
  stroke: string;
  strokeWidth?: number; // default 2
  frame: number;
  durationInFrames: number;
}

function totalPathLength(points: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

export const DrawLine: React.FC<DrawLineProps> = ({
  points,
  stroke,
  strokeWidth = 2,
  frame,
  durationInFrames,
}) => {
  if (points.length < 2) return null;

  const pathLength = totalPathLength(points);
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  const dashOffset = pathLength * (1 - progress);
  const pointsStr = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
    >
      <polyline
        points={pointsStr}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};
