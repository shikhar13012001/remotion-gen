import React from "react";
import { TimelineItem, TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const TimelineItemStories: Story[] = [
  {
    id: "timeline-item-default",
    label: "Not last",
    group: "Primitives",
    component: "TimelineItem",
    duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <TimelineItem time="7:17 AM" event="Object enters atmosphere" detail="Over western Siberia, Russia" frame={frame} startFrame={variant === "delayed" ? 20 : 0} isLast={false} />
      </div>
    ),
  },
  {
    id: "timeline-item-last",
    label: "Last item (no line)",
    group: "Primitives",
    component: "TimelineItem",
    duration: 60,
    variants: ["default"],
    render: (_variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <TimelineItem time="7:17 AM" event="Impact and explosion" detail="Podkamennaya Tunguska River area" frame={frame} startFrame={0} isLast={true} />
      </div>
    ),
  },
];
