import React from "react";
import { Stamp, TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const StampStories: Story[] = [
  {
    id: "stamp-default",
    label: "Default",
    group: "Primitives",
    component: "Stamp",
    duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stamp label="Primary Suspect · 1963" frame={frame} startFrame={variant === "delayed" ? 30 : 0} />
      </div>
    ),
  },
  {
    id: "stamp-long",
    label: "Long label",
    group: "Primitives",
    component: "Stamp",
    duration: 60,
    variants: ["default"],
    render: (_variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stamp label="Classified · Eyes Only · 1945" frame={frame} startFrame={0} />
      </div>
    ),
  },
];
