import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { AnimationComponentProps } from "./types";
import { buildLinePath, buildYTicks } from "./lineChartHelpers";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const BODY_FONT = TOKEN.sans;

interface LineChartData {
  points:          number[];
  labels:          string[];
  y_label?:        string;
  highlight_drop?: boolean;
}

function parseData(data: Record<string, unknown>): LineChartData {
  return {
    points:         Array.isArray(data.points) ? (data.points as number[]) : [0, 1],
    labels:         Array.isArray(data.labels) ? (data.labels as string[]) : [],
    y_label:        typeof data.y_label === "string" ? data.y_label : undefined,
    highlight_drop: typeof data.highlight_drop === "boolean" ? data.highlight_drop : false,
  };
}

export const LineChart: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { points, labels, y_label, highlight_drop } = parseData(spec.data);

  const CHART_W = 760;
  const CHART_H = 500;
  const PAD_L   = 80;
  const PAD_B   = 60;

  const { d: linePath, length: pathLength } = buildLinePath(points, CHART_W, CHART_H);
  const yTicks = buildYTicks(points, CHART_H);

  const drawProgress = interpolate(frame, [0, Math.round(durationInFrames * 0.85)], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strokeDashoffset = pathLength * (1 - drawProgress);

  const fillOpacity = highlight_drop
    ? interpolate(frame, [Math.round(durationInFrames * 0.6), Math.round(durationInFrames * 0.85)], [0, 0.15],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const fillPath = linePath
    ? `${linePath} L ${CHART_W.toFixed(1)} ${CHART_H.toFixed(1)} L 0 ${CHART_H.toFixed(1)} Z`
    : "";

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", opacity: containerOp, padding: "60px 80px" }}>
      {y_label && (
        <div style={{ fontFamily: BODY_FONT, fontWeight: 400, fontSize: 24, color: palette.text,
          opacity: 0.5, marginBottom: 16, letterSpacing: 0 }}>
          {y_label}
        </div>
      )}
      <svg width={CHART_W + PAD_L + 20} height={CHART_H + PAD_B + 20} style={{ overflow: "visible" }}>
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={tick.y} x2={PAD_L + CHART_W} y2={tick.y}
              stroke={palette.chart_grid} strokeWidth={1} />
            <text x={PAD_L - 8} y={tick.y + 5} textAnchor="end" fontSize={22}
              fontFamily={BODY_FONT} fill={palette.text} opacity={0.5}>
              {tick.label}
            </text>
          </g>
        ))}
        {labels.slice(0, points.length).map((label, i) => {
          const stepX = CHART_W / (points.length - 1);
          return (
            <text key={i} x={PAD_L + i * stepX} y={CHART_H + PAD_B}
              textAnchor="middle" fontSize={22} fontFamily={BODY_FONT} fill={palette.text} opacity={0.5}>
              {label}
            </text>
          );
        })}
        <g transform={`translate(${PAD_L}, 0)`}>
          {highlight_drop && fillPath && (
            <path d={fillPath} fill={palette.accent} fillOpacity={fillOpacity} stroke="none" />
          )}
          <path d={linePath} fill="none" stroke={palette.accent} strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={pathLength} strokeDashoffset={strokeDashoffset} />
        </g>
      </svg>
    </div>
  );
};
