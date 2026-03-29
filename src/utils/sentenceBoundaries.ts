/**
 * Utilities for deriving per-sentence timing boundaries from ElevenLabs word timings,
 * and for computing the correct globalFrameOffset for each scene when those scenes
 * are arranged inside a TransitionSeries (which shortens the video timeline by
 * TRANSITION_FRAMES per cut, while the audio timeline remains linear).
 */

export type WordTiming = {
  word: string;
  start: number; // seconds
  end: number;   // seconds
  sentenceIndex: number;
};

export type SentenceBoundary = {
  sentenceIndex: number;
  startSec: number;
  endSec: number;
};

/**
 * Scans all word timings and returns one entry per sentenceIndex, sorted ascending.
 * startSec = earliest word start in that sentence
 * endSec   = latest word end   in that sentence
 */
export function computeSentenceBoundaries(
  wordTimings: WordTiming[]
): SentenceBoundary[] {
  if (wordTimings.length === 0) return [];

  const map = new Map<number, { startSec: number; endSec: number }>();

  for (const wt of wordTimings) {
    const existing = map.get(wt.sentenceIndex);
    if (!existing) {
      map.set(wt.sentenceIndex, { startSec: wt.start, endSec: wt.end });
    } else {
      if (wt.start < existing.startSec) existing.startSec = wt.start;
      if (wt.end   > existing.endSec)   existing.endSec   = wt.end;
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([sentenceIndex, { startSec, endSec }]) => ({
      sentenceIndex,
      startSec,
      endSec,
    }));
}

/**
 * Computes the globalFrameOffset for each scene in a TransitionSeries.
 *
 * In TransitionSeries, consecutive scenes overlap by `transitionFrames` — the
 * video timeline is shortened, but the audio plays straight through without gaps
 * or skips. `globalFrameOffset[i]` is the number of video frames elapsed at the
 * start of scene i, which equals the audio playback position at that moment.
 *
 * Because the audio is NOT shortened by transitions:
 *   offset[0] = 0
 *   offset[i] = offset[i-1] + rawDurations[i-1] - transitionFrames
 *
 * Example: durations [90, 60, 60, 90], transitionFrames = 12
 *   offset[0] = 0
 *   offset[1] = 0  + 90 - 12 = 78
 *   offset[2] = 78 + 60 - 12 = 126
 *   offset[3] = 126+ 60 - 12 = 174
 */
export function computeGlobalOffsets(
  rawDurations: number[],
  transitionFrames: number
): number[] {
  const offsets: number[] = [];
  let accumulator = 0;

  for (let i = 0; i < rawDurations.length; i++) {
    offsets.push(accumulator);
    // Next scene starts (transitionFrames) before this scene ends
    if (i < rawDurations.length - 1) {
      accumulator += rawDurations[i] - transitionFrames;
    }
  }

  return offsets;
}

/**
 * Converts sentence boundaries into raw per-scene frame durations.
 * FPS is always 30.
 * The last entry (CTA) gets an extra tail buffer so it lingers on screen.
 */
export function boundariesToDurations(
  boundaries: SentenceBoundary[],
  opts: { tailPaddingFrames?: number; ctaExtraFrames?: number } = {}
): number[] {
  const { tailPaddingFrames = 6, ctaExtraFrames = 60 } = opts;
  const FPS = 30;

  return boundaries.map((b, i) => {
    const base = Math.ceil((b.endSec - b.startSec) * FPS) + tailPaddingFrames;
    return i === boundaries.length - 1 ? base + ctaExtraFrames : base;
  });
}
