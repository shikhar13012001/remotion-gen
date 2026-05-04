import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import {
  ShortsComposition,
  type Props,
} from "./compositions/ShortsComposition";
import { ReitComposition } from "./compositions/reits-guide";
import { ReitsWhatTheyAreComposition } from "./compositions/reits-what-they-are/index";
import { TheBeginnersGuideToComposition } from "./compositions/the-beginners-guide-to/index";
import kennedyScript from "../data/output/script.json";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const durations = props.sentenceDurations.length === props.scenes.length
    ? props.sentenceDurations
    : props.suggestedDurations;
  const totalMs     = durations.reduce((a, b) => a + b, 0);
  const totalFrames = totalMs > 0 ? Math.round((totalMs / 1000) * FPS) : 900;
  return { durationInFrames: totalFrames };
};

/**
 * Transform script object into Props
 */
function scriptToProps(script: {
  topic: string;
  total_words: number;
  accentColor: string;
  sentences: Array<{
    index: number;
    text: string;
    beat: string;
    word_count: number;
    suggested_duration_ms: number;
    visualQuery: string | null;
    needsImage: boolean;
    highlightWords: string[];
    dataValue: number | null;
  }>;
}): Props {
  const scenes = script.sentences.map((s) => ({
    text: s.text,
    highlightWords: s.highlightWords,
    dataValue: s.dataValue,
  }));

  const suggestedDurations = script.sentences.map((s) => s.suggested_duration_ms);
  const resolvedImages = script.sentences.map(() => null);

  const tokens = {
    fontFamily: "system-ui, sans-serif",
    colors: { accent: script.accentColor },
    typography: {},
    spacing: {},
    radii: {},
  };

  return {
    scenes,
    sentenceDurations: [],
    suggestedDurations,
    resolvedImages,
    tokens,
  };
}

const DEFAULT_TOKENS: Props["tokens"] = {
  fontFamily:  "system-ui, sans-serif",
  colors:      { accent: "#c8a96e" },
  typography:  {},
  spacing:     {},
  radii:       {},
};

// Use Kennedy script if available, otherwise fallback
const props = scriptToProps(kennedyScript);

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
        defaultProps={props}
      />
      <Composition
        id="ReitComposition"
        component={ReitComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={900}
        calculateMetadata={calculateMetadata}
        defaultProps={props}
      />
      <Composition
        id="ReitsWhatTheyAreComposition"
        component={ReitsWhatTheyAreComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={900}
        calculateMetadata={calculateMetadata}
        defaultProps={props}
      />
      <Composition
        id="TheBeginnersGuideToComposition"
        component={TheBeginnersGuideToComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={900}
        calculateMetadata={calculateMetadata}
        defaultProps={props}
      />
    </>
  );
};
