import { computeSentenceBoundaries, type SentenceBoundary, type WordTiming } from "../utils/sentenceBoundaries";
import type { Pacing } from "../lib/tokens";
import { TRANSITION_FRAMES } from "./ShortsComposition";

export interface CompositionLayout {
  hookDur:         number;
  ctaDur:          number;
  bodyDurs:        number[];
  bodyBoundaries:  SentenceBoundary[];
  bodyOffsets:     number[];
  bodyStart:       number;
  totalBodyDur:    number;
}

export function computeLayout(
  wordTimings: WordTiming[],
  sentenceDurations: number[],
  pacing: Pacing,
): CompositionLayout {
  const hookDur  = sentenceDurations[0] ?? pacing.hookFrames;
  const ctaDur   = sentenceDurations.length > 1
    ? sentenceDurations[sentenceDurations.length - 1] : pacing.ctaFrames;
  const bodyDurs = sentenceDurations.length > 2 ? sentenceDurations.slice(1, -1) : [];

  const boundaries     = computeSentenceBoundaries(wordTimings);
  const bodyBoundaries = boundaries.length > 0
    ? boundaries.slice(1)
    : bodyDurs.map((_, i) => ({ sentenceIndex: i + 1, startSec: 0, endSec: 0 }));

  const bodyOffsets: number[] = [];
  let accOffset = hookDur;
  for (let j = 0; j < bodyDurs.length; j++) {
    bodyOffsets.push(accOffset);
    accOffset += bodyDurs[j] - (j === bodyDurs.length - 1 ? 0 : TRANSITION_FRAMES);
  }

  const numBodyTrans = Math.max(0, bodyDurs.length - 1);
  const totalBodyDur = bodyDurs.reduce((a, b) => a + b, 0) - numBodyTrans * TRANSITION_FRAMES;

  return { hookDur, ctaDur, bodyDurs, bodyBoundaries, bodyOffsets, bodyStart: hookDur, totalBodyDur };
}
