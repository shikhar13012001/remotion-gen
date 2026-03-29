import React, { useRef, useState, useEffect } from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { AnimationComponentProps } from "./types";

interface SvgPathData {
  path:         string;
  stroke_width?: number;
  fill?:         boolean;
}

function parseData(data: Record<string, unknown>): SvgPathData {
  return {
    path:         typeof data.path === "string" ? data.path : "M 100 100 L 980 100",
    stroke_width: typeof data.stroke_width === "number" ? data.stroke_width : 3,
    fill:         typeof data.fill === "boolean" ? data.fill : false,
  };
}

export const SvgDrawPath: React.FC<AnimationComponentProps> = ({
  spec,
  startFrame,
  durationInFrames,
  palette,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { path, stroke_width, fill } = parseData(spec.data);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(1000);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      if (len > 0) setPathLength(len);
    }
  }, [path]);

  // Draw over 60% of duration, hold for 40%
  const drawEnd = Math.round(durationInFrames * 0.6);
  const drawProgress = interpolate(frame, [0, drawEnd], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strokeDashoffset = pathLength * (1 - drawProgress);

  // Fill fades in after draw completes
  const fillOpacity = fill
    ? interpolate(frame, [drawEnd, drawEnd + 12], [0, 0.2],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  const containerOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: containerOp,
      }}
    >
      <svg
        width={920}
        height={1100}
        viewBox="0 0 920 1100"
        style={{ overflow: "visible" }}
      >
        {/* Fill layer */}
        {fill && (
          <path
            d={path}
            fill={palette.accent}
            fillOpacity={fillOpacity}
            stroke="none"
          />
        )}
        {/* Stroke layer */}
        <path
          ref={pathRef}
          d={path}
          fill="none"
          stroke={palette.accent}
          strokeWidth={stroke_width ?? 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    </div>
  );
};
