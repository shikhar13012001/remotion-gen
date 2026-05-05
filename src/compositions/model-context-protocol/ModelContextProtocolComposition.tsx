import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { Props } from "../ShortsComposition";
import type { SceneProps } from "../../scenes/model-context-protocol/DESIGN";
import {
  Scene01Hook,
  Scene02Sealed,
  Scene03Ledger,
  Scene04Mesh,
  Scene05Fragmented,
  Scene06Timeline,
  Scene07Hub,
  Scene08TwoSided,
  Scene09Flow,
  Scene10Manifest,
  Scene11Adopters,
  Scene12OneMeasure,
  Scene13AgentPath,
  Scene14BeforeAfter,
  Scene15SpecCard,
  Scene16Close,
} from "../../scenes/model-context-protocol/index";

type SceneComponent = React.FC<SceneProps>;

const SCENE_COMPONENTS: SceneComponent[] = [
  Scene01Hook,
  Scene02Sealed,
  Scene03Ledger,
  Scene04Mesh,
  Scene05Fragmented,
  Scene06Timeline,
  Scene07Hub,
  Scene08TwoSided,
  Scene09Flow,
  Scene10Manifest,
  Scene11Adopters,
  Scene12OneMeasure,
  Scene13AgentPath,
  Scene14BeforeAfter,
  Scene15SpecCard,
  Scene16Close,
];

export const TRANSITION_FRAMES = 10;

export const ModelContextProtocolComposition: React.FC<Props> = ({
  scenes,
  sentenceDurations,
  suggestedDurations,
}) => {
  const { fps } = useVideoConfig();
  const durations = sentenceDurations.length === scenes.length ? sentenceDurations : suggestedDurations;
  const durationFrames = durations.map((ms) => Math.max(30, Math.round((ms / 1000) * fps)));

  const items = SCENE_COMPONENTS.map((SceneComp, i) => {
    const scene = scenes[i];
    const durFrames = durationFrames[i] ?? 60;
    return {
      SceneComp,
      durFrames,
      props: {
        text: scene?.text ?? "",
        highlightWords: scene?.highlightWords ?? [],
        dataValue: scene?.dataValue ?? null,
        durationInFrames: durFrames,
      } satisfies SceneProps,
    };
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <TransitionSeries>
        {items.flatMap(({ SceneComp, props, durFrames }, i) => {
          const nodes: React.ReactNode[] = [
            <TransitionSeries.Sequence key={`seq-${i}`} durationInFrames={durFrames}>
              <SceneComp {...props} />
            </TransitionSeries.Sequence>,
          ];

          if (i < items.length - 1) {
            nodes.push(
              <TransitionSeries.Transition
                key={`transition-${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />,
            );
          }

          return nodes;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
