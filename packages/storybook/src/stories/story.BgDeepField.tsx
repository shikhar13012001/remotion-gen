import React from "react";
import { BgDeepField } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const BgDeepFieldStories: Story[] = [
  {
    id: "bg-deep-field-default",
    label: "Deep Field",
    group: "Backgrounds",
    component: "BgDeepField",
    duration: 300,
    variants: ["default", "mid"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0 }}>
        <BgDeepField frame={variant === "mid" ? frame + 150 : frame} startFrame={0} />
      </div>
    ),
  },
];
