import React from "react";
import { Grid } from "@yt-shorts/video-renderer";
import { TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const GridStories: Story[] = [
  {
    id: "grid-default",
    label: "Default (48px)",
    group: "Primitives",
    component: "Grid",
    duration: 60,
    variants: ["default", "tight"],
    render: (_variant, _frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid }}>
        <Grid size={48} opacity={1} />
      </div>
    ),
  },
  {
    id: "grid-tight",
    label: "Tight (36px)",
    group: "Primitives",
    component: "Grid",
    duration: 60,
    variants: ["default"],
    render: (_variant, _frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid }}>
        <Grid size={36} opacity={1} />
      </div>
    ),
  },
];
