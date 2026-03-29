import React from "react";
import { TplStatCallout } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

const DATA_A = {
  type: "stat_callout" as const,
  stamp_label: "Blast Yield · 1908",
  value: 10,
  prefix: "",
  suffix: "Mt",
  label: "megatons of TNT equivalent",
  context: "Roughly 1,000 times more powerful than the atomic bomb dropped on Hiroshima.",
};

const DATA_B = {
  type: "stat_callout" as const,
  stamp_label: "Affected Area",
  value: 2150,
  prefix: "",
  suffix: "km²",
  label: "of forest flattened",
  context: "An area larger than metropolitan Tokyo was stripped of trees in seconds.",
};

export const TplStatCalloutStories: Story[] = [
  {
    id: "tpl-stat-callout",
    label: "10 Mt Blast",
    group: "Templates",
    component: "TplStatCallout",
    duration: 120,
    variants: ["default", "variant-b"],
    render: (variant, frame) => (
      <TplStatCallout data={variant === "variant-b" ? DATA_B : DATA_A} frame={frame} startFrame={0} />
    ),
  },
];
