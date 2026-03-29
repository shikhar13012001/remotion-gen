import React from "react";
import { TplTimeline } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

const DATA_A = {
  type: "timeline" as const,
  headline: "The Morning of June 30",
  stamp_label: "Tunguska · 1908",
  items: [
    { time: "7:14 AM", event: "Fireball first sighted", detail: "Trans-Siberian Railway passengers" },
    { time: "7:17 AM", event: "Object enters atmosphere", detail: "Travelling at 27 km per second" },
    { time: "7:17 AM", event: "Air burst at 8–10 km", detail: "Above Podkamennaya Tunguska River" },
    { time: "7:17 AM", event: "Shockwave flattens trees", detail: "2,150 square kilometres of forest" },
  ],
};

const DATA_B = {
  type: "timeline" as const,
  headline: "The Kennedy Assassination",
  stamp_label: "Dallas · November 22, 1963",
  items: [
    { time: "12:30 PM", event: "Shots fired at motorcade", detail: "Dealey Plaza, Dallas, Texas" },
    { time: "12:38 PM", event: "Kennedy arrives at hospital", detail: "Parkland Memorial Hospital" },
    { time: "1:00 PM",  event: "Kennedy pronounced dead", detail: "Trauma Room One, Parkland" },
    { time: "2:00 PM",  event: "Oswald arrested", detail: "Texas Theatre, Oak Cliff" },
  ],
};

export const TplTimelineStories: Story[] = [
  {
    id: "tpl-timeline",
    label: "Tunguska Morning",
    group: "Templates",
    component: "TplTimeline",
    duration: 180,
    variants: ["default", "variant-b"],
    render: (variant, frame) => (
      <TplTimeline data={variant === "variant-b" ? DATA_B : DATA_A} frame={frame} startFrame={0} />
    ),
  },
];
