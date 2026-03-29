import type { WordTiming } from "./client.js";

/**
 * Aggregate character-level ElevenLabs alignment into word-level timings.
 *
 * When `sentenceTexts` is provided, sentence boundaries are derived by matching
 * words to sentence texts sequentially — much more reliable than punctuation detection.
 * Falls back to punctuation-based detection (`.!?`) when sentenceTexts is absent.
 */
export function buildWordTimings(
  characters: string[],
  startTimes: number[],
  endTimes: number[],
  sentenceTexts?: string[],
): WordTiming[] {
  const wordTimings: WordTiming[] = [];
  let sentenceIndex = 0;
  let wordStart = -1;
  let wordChars = "";

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    const isSpace = /\s/.test(ch);

    if (!isSpace) {
      if (wordStart === -1) wordStart = startTimes[i];
      wordChars += ch;
    } else {
      if (wordChars.length > 0) {
        const cleanWord = wordChars.replace(/["""''()[\]]/g, "");
        if (cleanWord.length > 0) {
          wordTimings.push({
            word: wordChars,
            start: wordStart,
            end: endTimes[i - 1],
            sentenceIndex,
          });
          if (!sentenceTexts && /[.!?]$/.test(wordChars)) sentenceIndex++;
        }
        wordChars = "";
        wordStart = -1;
      }
    }
  }

  // Flush last word
  if (wordChars.length > 0 && wordStart !== -1) {
    wordTimings.push({
      word: wordChars,
      start: wordStart,
      end: endTimes[endTimes.length - 1],
      sentenceIndex,
    });
  }

  // ── Sentence-text-aware boundary assignment ───────────────────────────────
  if (sentenceTexts && sentenceTexts.length > 0) {
    const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
    let sIdx = 0;
    let sWordPos = 0;
    let sWords = sentenceTexts[0]?.split(/\s+/).map(normalize).filter(Boolean) ?? [];

    for (const wt of wordTimings) {
      wt.sentenceIndex = Math.min(sIdx, sentenceTexts.length - 1);
      sWordPos++;
      if (sWordPos >= sWords.length && sIdx < sentenceTexts.length - 1) {
        sIdx++;
        sWords = sentenceTexts[sIdx]?.split(/\s+/).map(normalize).filter(Boolean) ?? [];
        sWordPos = 0;
      }
    }
  }

  return wordTimings;
}
