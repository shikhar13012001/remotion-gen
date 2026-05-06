import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { Props } from "./compositions/ShortsComposition";
import {
  IntroducingTheModelContextComposition,
  TRANSITION_FRAMES,
} from "./compositions/introducing-the-model-context/index";
import script from "../data/output/script.json";
import designTokensData from "../data/output/design_tokens.json";
import imageManifestData from "../data/output/image_manifest.json";
import type { ImageManifest } from "./utils/imageManifest";
import { resolveImagesForSentenceCount } from "./utils/imageManifest";

const FPS = 30;
const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const durations = props.sentenceDurations.length === props.scenes.length
    ? props.sentenceDurations
    : props.suggestedDurations;
  const totalMs     = durations.reduce((a, b) => a + b, 0);
  const rawFrames = totalMs > 0 ? Math.round((totalMs / 1000) * FPS) : 900;
  const transitionOverlap = Math.max(0, props.scenes.length - 1) * TRANSITION_FRAMES;
  const totalFrames = Math.max(1, rawFrames - transitionOverlap);
  return { durationInFrames: totalFrames };
};

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
  const resolvedImages = resolveImagesForSentenceCount(
    script.sentences.length,
    imageManifestData as ImageManifest,
  );

  const dt = designTokensData as {
    fontDisplay?: string; fontBody?: string;
    background?: string; surface?: string;
    textOn?: string; textMuted?: string; border?: string;
    accent?: string;
    brandColors?: Record<string, string>;
  };

  const tokens = {
    fontFamily: dt.fontDisplay ?? "system-ui, sans-serif",
    colors: {
      accent:      dt.accent      ?? script.accentColor,
      background:  dt.background  ?? "#0d0d0d",
      surface:     dt.surface     ?? "#1a1a1a",
      textOn:      dt.textOn      ?? "#f0f0f0",
      textMuted:   dt.textMuted   ?? "rgba(255,255,255,0.55)",
      border:      dt.border      ?? "rgba(255,255,255,0.08)",
      fontDisplay: dt.fontDisplay ?? "",
      fontBody:    dt.fontBody    ?? "",
    },
    typography: {},
    spacing:    {},
    radii:      {},
  };

  return {
    scenes,
    sentenceDurations: [],
    suggestedDurations,
    resolvedImages,
    tokens,
  };
}

const props = scriptToProps(script);

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="IntroducingTheModelContextComposition"
        component={IntroducingTheModelContextComposition}
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
