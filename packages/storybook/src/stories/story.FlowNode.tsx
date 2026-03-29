import React from "react";
import { FlowNode, TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const FlowNodeStories: Story[] = [
  {
    id: "flow-node-default",
    label: "With arrow",
    group: "Primitives",
    component: "FlowNode",
    duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <FlowNode text="Fireball crosses the atmosphere" frame={frame} startFrame={variant === "delayed" ? 20 : 0} isLast={false} />
      </div>
    ),
  },
  {
    id: "flow-node-last",
    label: "Last (no arrow)",
    group: "Primitives",
    component: "FlowNode",
    duration: 60,
    variants: ["default"],
    render: (_variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <FlowNode text="Shockwave levels 2,000 square km" frame={frame} startFrame={0} isLast={true} />
      </div>
    ),
  },
];
