import React from "react";
import { TplSubjectCutout } from "@yt-shorts/video-renderer";
import type { Story } from "../registry";

const DATA_A = {
  type: "subject_cutout" as const,
  stamp_label: "Primary Suspect · 1963",
  headline: "The man they arrested",
  annotations: [
    { text: "Ex-Marine. Soviet defector.", side: "left" as const },
    { text: "Arrested at 2:00 PM", side: "right" as const },
  ],
  image_query: "close-up Lee Harvey Oswald handcuffed Dallas police station 1963",
};

const DATA_B = {
  type: "subject_cutout" as const,
  stamp_label: "Whistleblower · 2013",
  headline: "He leaked everything",
  annotations: [
    { text: "NSA contractor, 29 years old.", side: "left" as const },
    { text: "Fled to Hong Kong June 2013.", side: "right" as const },
  ],
  image_query: "portrait Edward Snowden NSA whistleblower 2013 interview",
};

export const TplSubjectCutoutStories: Story[] = [
  {
    id: "tpl-subject-cutout-a",
    label: "Oswald",
    group: "Templates",
    component: "TplSubjectCutout",
    duration: 120,
    variants: ["default", "variant-b"],
    render: (variant, frame) => (
      <TplSubjectCutout
        data={variant === "variant-b" ? DATA_B : DATA_A}
        sentence="Lee Harvey Oswald was arrested ninety minutes after the shooting."
        accentWords={["Oswald", "arrested"]}
        frame={frame}
        startFrame={0}
      />
    ),
  },
];
