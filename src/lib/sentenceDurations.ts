import { computeSentenceBoundaries } from "../utils/sentenceBoundaries";
import type { Props } from "../compositions/ShortsComposition";

const FPS              = 30;
const TAIL_PADDING     = 12;
const CTA_EXTRA_FRAMES = 120;
const TRANSITION_FRAMES = 12;
const MIN_DURATION_FRAMES = 1200;

/**
 * Computes per-scene frame durations from word-timing sentence boundaries.
 * Legacy model: [hook, body1..bodyN, cta_extra] — used when no VideoSpec.
 */
export function computeSentenceDurations(
  wordTimings: Props["wordTimings"],
): { sentenceDurations: number[]; totalDuration: number } {
  const boundaries = computeSentenceBoundaries(wordTimings);

  if (boundaries.length === 0) {
    return { sentenceDurations: [], totalDuration: 0 };
  }

  const rawDurations = boundaries.map((b) =>
    Math.ceil((b.endSec - b.startSec) * FPS) + TAIL_PADDING
  );
  rawDurations.push(CTA_EXTRA_FRAMES);

  const numBodyScenes  = rawDurations.length - 2;
  const numTransitions = Math.max(0, numBodyScenes - 1);
  const totalDuration  = rawDurations.reduce((a, b) => a + b, 0) - numTransitions * TRANSITION_FRAMES;

  return {
    sentenceDurations: rawDurations,
    totalDuration: Math.max(totalDuration, MIN_DURATION_FRAMES),
  };
}

/**
 * VideoSpec variant: returns exactly `totalSentences` durations — no CTA slot.
 * Returns empty if sentence count doesn't match; ShortsComposition falls back
 * to suggested_duration_ms in that case.
 */
export function computeSentenceDurationsForVideoSpec(
  wordTimings: Props["wordTimings"],
  totalSentences: number,
): { sentenceDurations: number[]; totalDuration: number } {
  const boundaries = computeSentenceBoundaries(wordTimings);

  if (boundaries.length === 0 || boundaries.length !== totalSentences) {
    return { sentenceDurations: [], totalDuration: 0 };
  }

  const rawDurations = boundaries.map((b) =>
    Math.ceil((b.endSec - b.startSec) * FPS) + TAIL_PADDING
  );
  const totalDuration = rawDurations.reduce((a, b) => a + b, 0)
    - Math.max(0, rawDurations.length - 1) * TRANSITION_FRAMES;

  return {
    sentenceDurations: rawDurations,
    totalDuration: Math.max(totalDuration, MIN_DURATION_FRAMES),
  };
}
