import React from "react";
import { TplFlowDiagram } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

const DATA_A = {
  type: "flow_diagram" as const,
  stamp_label: "Impact Sequence",
  headline: "How the explosion unfolded",
  nodes: [
    "Object enters atmosphere at 27 km/s",
    "Air resistance generates extreme heat",
    "Object disintegrates at 8–10 km altitude",
    "Superheated gas expands violently",
    "Shockwave travels outward at supersonic speed",
  ],
};

const DATA_B = {
  type: "flow_diagram" as const,
  stamp_label: "Investigation",
  headline: "Why it took 19 years",
  nodes: [
    "1908: No expedition reaches the site",
    "1921: First attempt abandoned mid-journey",
    "1927: Kulik reaches the blast zone",
    "Finds no crater — only fallen trees",
  ],
};

export const TplFlowDiagramStories: Story[] = [
  {
    id: "tpl-flow-diagram",
    label: "Impact Sequence",
    group: "Templates",
    component: "TplFlowDiagram",
    duration: 180,
    variants: ["default", "variant-b"],
    render: (variant, frame) => (
      <TplFlowDiagram data={variant === "variant-b" ? DATA_B : DATA_A} frame={frame} startFrame={0} />
    ),
  },
];
