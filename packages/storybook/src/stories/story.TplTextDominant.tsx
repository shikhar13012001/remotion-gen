import React from "react";
import { TplTextDominant } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

const DATA_A = {
  type: "text_dominant" as const,
  lines: ["No warning.", "No survivors.", "No explanation."],
};

const DATA_B = {
  type: "text_dominant" as const,
  lines: ["June 30, 1908.", "Siberia."],
};

export const TplTextDominantStories: Story[] = [
  {
    id: "tpl-text-dominant",
    label: "Three lines",
    group: "Templates",
    component: "TplTextDominant",
    duration: 120,
    variants: ["default", "variant-b"],
    render: (variant, frame) => (
      <TplTextDominant data={variant === "variant-b" ? DATA_B : DATA_A} frame={frame} startFrame={0} />
    ),
  },
];
