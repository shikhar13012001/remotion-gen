import React from "react";
import { Annotation, TOKEN } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

export const AnnotationStories: Story[] = [
  {
    id: "annotation-left",
    label: "Left side",
    group: "Primitives",
    component: "Annotation",
    duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Annotation text="Ex-Marine. Soviet defector." side="left" frame={frame} startFrame={variant === "delayed" ? 20 : 0} />
      </div>
    ),
  },
  {
    id: "annotation-right",
    label: "Right side",
    group: "Primitives",
    component: "Annotation",
    duration: 60,
    variants: ["default"],
    render: (_variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Annotation text="Arrested at 2:00 PM Dallas." side="right" frame={frame} startFrame={0} />
      </div>
    ),
  },
];
