import React from "react";
import { KineticText, TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const KineticTextStories: Story[] = [
  {
    id: "kinetic-text-default",
    label: "Word-by-word",
    group: "Primitives",
    component: "KineticText",
    duration: 90,
    variants: ["default", "fast"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
        <KineticText
          text="The explosion was heard two thousand kilometres away."
          accentWords={["explosion", "thousand"]}
          fontSize={48}
          frame={frame}
          startFrame={0}
          stagger={variant === "fast" ? 2 : 4}
        />
      </div>
    ),
  },
  {
    id: "kinetic-text-caption",
    label: "Caption size",
    group: "Primitives",
    component: "KineticText",
    duration: 90,
    variants: ["default"],
    render: (_variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
        <KineticText
          text="Siberia, June 30, 1908. A fireball crossed the sky."
          accentWords={["Siberia", "fireball"]}
          fontSize={28}
          frame={frame}
          startFrame={0}
          stagger={3}
        />
      </div>
    ),
  },
];
