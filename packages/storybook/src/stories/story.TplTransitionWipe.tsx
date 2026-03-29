import React from "react";
import { TplTransitionWipe } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const TplTransitionWipeStories: Story[] = [
  {
    id: "tpl-transition-wipe",
    label: "Part Two",
    group: "Templates",
    component: "TplTransitionWipe",
    duration: 90,
    variants: ["default", "chapter-3"],
    render: (variant, frame) => (
      <TplTransitionWipe
        data={{ type: "transition_wipe", label: variant === "chapter-3" ? "Chapter Three" : "Part Two" }}
        frame={frame}
        startFrame={0}
      />
    ),
  },
];
