import React from "react";
import { GoldDivider, TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const GoldDividerStories: Story[] = [
  {
    id: "gold-divider-default",
    label: "400px width",
    group: "Primitives",
    component: "GoldDivider",
    duration: 60,
    variants: ["default", "instant"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={variant === "instant" ? 0 : 10} width={400} />
      </div>
    ),
  },
  {
    id: "gold-divider-narrow",
    label: "200px width",
    group: "Primitives",
    component: "GoldDivider",
    duration: 60,
    variants: ["default"],
    render: (_variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={0} width={200} />
      </div>
    ),
  },
];
