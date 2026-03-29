import React from "react";
import { BgFlare } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const BgFlareStories: Story[] = [
  {
    id: "bg-flare-default",
    label: "Flare",
    group: "Backgrounds",
    component: "BgFlare",
    duration: 90,
    variants: ["default", "expanded"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0 }}>
        <BgFlare frame={variant === "expanded" ? frame + 60 : frame} startFrame={0} />
      </div>
    ),
  },
];
