import React from "react";
import { Vignette, TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const VignetteStories: Story[] = [
  {
    id: "vignette-default",
    label: "Default (0.55)",
    group: "Primitives",
    component: "Vignette",
    duration: 60,
    variants: ["default", "strong"],
    render: (variant, _frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgSignal }}>
        <Vignette strength={variant === "strong" ? 0.85 : 0.55} />
      </div>
    ),
  },
];
