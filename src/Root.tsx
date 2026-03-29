import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import {
  ShortsComposition,
  type Props,
} from "./compositions/ShortsComposition";
import { computeSentenceDurations, computeSentenceDurationsForVideoSpec } from "./lib/sentenceDurations";
import { DEMO_PROPS } from "./compositions/demoProps";

const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  if (props.wordTimings && props.wordTimings.length > 0) {
    const result = props.videoSpec
      ? computeSentenceDurationsForVideoSpec(props.wordTimings, props.videoSpec.sentences.length)
      : computeSentenceDurations(props.wordTimings);

    if (result.totalDuration > 0) {
      return {
        durationInFrames: result.totalDuration,
        props: {
          ...props,
          durationInFrames: result.totalDuration,
          _sentenceDurations: result.sentenceDurations,
        },
      };
    }
  }

  return { durationInFrames: props.durationInFrames };
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortsComposition"
        component={ShortsComposition}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={900}
        calculateMetadata={calculateMetadata}
        defaultProps={{
          metadata: {
            hook: "She bleeds where the desert breathes.",
            body: [
              "Hidden in the creosote, she twines toward the boiling sun.",
              "And when I touched her skin, my fingers ran with blood.",
              "In the hushing dusk, I came walking with the wind.",
              "Strange hands halted me — the looming shadows danced.",
            ],
            cta: "Follow for more dark poetry.",
            mood: "mysterious",
            pacing: "slow",
            visualStyle: "cinematic",
            title: "Desert Bloom",
            contentType: "poetry",
            accentColor: "#a78bfa",
            sceneDirectives: [],
          },
          wordTimings: [],
          audioFile: "",
          durationInFrames: 900,
          backgroundClips: [],
          bgMusicFile: "",
          _sentenceDurations: [],
        } as Props}
      />
      <Composition
        id="DemoComposition"
        component={ShortsComposition}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={1422}
        calculateMetadata={calculateMetadata}
        defaultProps={DEMO_PROPS}
      />
    </>
  );
};
