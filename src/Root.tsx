import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import {
  ShortsComposition,
  type Props,
} from "./compositions/ShortsComposition";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const durations = props.sentenceDurations.length === props.scenes.length
    ? props.sentenceDurations
    : props.suggestedDurations;
  const totalMs     = durations.reduce((a, b) => a + b, 0);
  const totalFrames = totalMs > 0 ? Math.round((totalMs / 1000) * FPS) : 900;
  return { durationInFrames: totalFrames };
};

const DEFAULT_TOKENS: Props["tokens"] = {
  fontFamily:  "system-ui, sans-serif",
  colors:      { accent: "#c8a96e" },
  typography:  {},
  spacing:     {},
  radii:       {},
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortsComposition"
        component={ShortsComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={900}
        calculateMetadata={calculateMetadata}
        defaultProps={{
          scenes: [
            { text: "She bleeds where the desert breathes.", highlightWords: ["bleeds"], dataValue: null },
            { text: "Hidden in the creosote, she twines toward the boiling sun.", highlightWords: ["creosote", "twines"], dataValue: null },
            { text: "Follow for more dark poetry.", highlightWords: ["poetry"], dataValue: null },
          ],
          sentenceDurations:  [],
          suggestedDurations: [3000, 4000, 3000],
          resolvedImages:     [null, null, null],
          tokens:             DEFAULT_TOKENS,
        } satisfies Props}
      />
    </>
  );
};
