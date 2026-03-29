import React from "react";
import { TplEditorialHeadline } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

const DATA_A = {
  type: "editorial_headline" as const,
  stamp_label: "November 24, 1963",
  line1: "Shot dead.",
  line2: "Live on air.",
  highlight_line: "The world watched.",
  subtext: "Jack Ruby fired one shot in the Dallas Police basement.",
};

const DATA_B = {
  type: "editorial_headline" as const,
  stamp_label: "Tunguska · 1908",
  line1: "No crater.",
  line2: "No meteor.",
  highlight_line: "Nothing made sense.",
  subtext: "Scientists found only flattened forest stretching for miles.",
};

export const TplEditorialHeadlineStories: Story[] = [
  {
    id: "tpl-editorial-headline",
    label: "Shot Dead",
    group: "Templates",
    component: "TplEditorialHeadline",
    duration: 120,
    variants: ["default", "variant-b"],
    render: (variant, frame) => (
      <TplEditorialHeadline data={variant === "variant-b" ? DATA_B : DATA_A} frame={frame} startFrame={0} />
    ),
  },
];
