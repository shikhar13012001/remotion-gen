import React from "react";
import { TplSplitPhotoData } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

const DATA_A = {
  type: "split_photo_data" as const,
  stamp_label: "Event Profile",
  headline: "The Tunguska Event",
  facts: [
    "Estimated yield: 10–15 megatons TNT",
    "No meteorite fragments ever recovered",
    "Trees flattened in radial pattern from epicentre",
    "Felt as far away as the UK",
  ],
  image_query: "aerial view Tunguska Siberia fallen trees taiga forest 1927",
};

const DATA_B = {
  type: "split_photo_data" as const,
  stamp_label: "Investigation Profile",
  headline: "Leonid Kulik",
  facts: [
    "First scientist to reach the blast site",
    "Led four expeditions between 1927–1938",
    "Believed a meteorite was buried underground",
    "Never found definitive impact evidence",
  ],
  image_query: "Leonid Kulik Soviet scientist Tunguska expedition Siberia 1927",
};

export const TplSplitPhotoDataStories: Story[] = [
  {
    id: "tpl-split-photo-data",
    label: "Tunguska Facts",
    group: "Templates",
    component: "TplSplitPhotoData",
    duration: 150,
    variants: ["default", "variant-b"],
    render: (variant, frame) => (
      <TplSplitPhotoData data={variant === "variant-b" ? DATA_B : DATA_A} frame={frame} startFrame={0} />
    ),
  },
];
