import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { AnimationComponentProps } from "./types";
import { HorizontalTimeline, VerticalTimeline } from "./timelineRenderers";

interface TimelineEvent { date: string; label: string; sublabel?: string; }
interface TimelineData { events: TimelineEvent[]; direction: "horizontal" | "vertical"; }

function parseData(data: Record<string, unknown>): TimelineData {
  const raw = Array.isArray(data.events) ? data.events as Record<string, unknown>[] : [];
  return {
    events: raw.map(e => ({
      date:     String(e.date ?? ""),
      label:    String(e.label ?? ""),
      sublabel: typeof e.sublabel === "string" ? e.sublabel : undefined,
    })),
    direction: data.direction === "horizontal" ? "horizontal" : "vertical",
  };
}

export const Timeline: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette, fps,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { events, direction } = parseData(spec.data);
  if (events.length === 0) return null;

  const containerOp  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const lineProgress = interpolate(frame, [0, Math.round(durationInFrames * 0.9)], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rendererProps = { events, frame, fps, palette, lineProgress, containerOp };

  return direction === "horizontal"
    ? <HorizontalTimeline {...rendererProps} />
    : <VerticalTimeline  {...rendererProps} />;
};
