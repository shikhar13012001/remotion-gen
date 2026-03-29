import React from "react";
import { BgSignal } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const BgSignalStories: Story[] = [
  {
    id: "bg-signal-default",
    label: "Signal",
    group: "Backgrounds",
    component: "BgSignal",
    duration: 200,
    variants: ["default", "mid"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0 }}>
        <BgSignal frame={variant === "mid" ? frame + 100 : frame} startFrame={0} />
      </div>
    ),
  },
];
