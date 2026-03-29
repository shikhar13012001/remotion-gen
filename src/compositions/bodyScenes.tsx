import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { ContentMetadata } from "../../lmstudio/index";
import type { WordTiming, SentenceBoundary } from "../utils/sentenceBoundaries";
import { SceneDirectiveRenderer } from "../scenes/SceneDirectiveRenderer";
import { autoFallbackDirective, pickClip } from "../lib/compositionUtils";
import type { Theme, Pacing, StyleConf } from "../lib/tokens";
import { TRANSITION_FRAMES } from "./ShortsComposition";

export interface BodyScenesProps {
  bodyBoundaries: SentenceBoundary[];
  bodyDurs: number[];
  bodyOffsets: number[];
  wordTimings: WordTiming[];
  sceneDirectives: ContentMetadata["sceneDirectives"];
  backgroundClips: string[];
  theme: Theme;
  pacing: Pacing;
  styleConf: StyleConf;
  accent: string;
}

/**
 * Returns a flat array of TransitionSeries.Sequence / TransitionSeries.Transition
 * elements for use directly inside <TransitionSeries>.
 *
 * MUST NOT be wrapped in a React component — TransitionSeries inspects its
 * direct children via React.Children and throws on any opaque component wrapper.
 */
export function buildBodyScenes({
  bodyBoundaries, bodyDurs, bodyOffsets, wordTimings,
  sceneDirectives, backgroundClips, theme, pacing, styleConf, accent,
}: BodyScenesProps): React.ReactElement[] {
  return bodyBoundaries.flatMap((b, j) => {
    const dur       = bodyDurs[j]    ?? 60;
    const offset    = bodyOffsets[j] ?? 0;
    const directive = sceneDirectives?.[j]
      ?? autoFallbackDirective(wordTimings, b.sentenceIndex);

    const seq = (
      <TransitionSeries.Sequence key={`seq-${b.sentenceIndex}`} durationInFrames={dur}>
        <SceneDirectiveRenderer
          directive={directive}
          sentenceIndex={b.sentenceIndex}
          wordTimings={wordTimings}
          globalFrameOffset={offset}
          durationInFrames={dur}
          theme={theme} pacing={pacing} styleConf={styleConf} accent={accent}
          sceneIndex={j}
          totalScenes={bodyBoundaries.length}
          fallbackClip={pickClip(backgroundClips, j + 1)}
        />
      </TransitionSeries.Sequence>
    );

    if (j < bodyBoundaries.length - 1) {
      const trans = (
        <TransitionSeries.Transition
          key={`trans-${j}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
      );
      return [seq, trans];
    }
    return [seq];
  });
}
