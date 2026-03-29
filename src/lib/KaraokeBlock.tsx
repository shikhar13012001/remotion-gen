import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { WordTiming } from "../utils/sentenceBoundaries";
import type { Pacing } from "./tokens";
import { KaraokeWord } from "./KaraokeWord";

export function sentenceFontSize(wordCount: number): number {
  if (wordCount <= 2) return 108;
  if (wordCount <= 4) return 82;
  return 68;
}

export function activeWordIndex(wordTimings: WordTiming[], timeSec: number): number {
  for (let i = 0; i < wordTimings.length; i++) {
    if (timeSec >= wordTimings[i].start && timeSec <= wordTimings[i].end) return i;
  }
  for (let i = wordTimings.length - 1; i >= 0; i--) {
    if (timeSec > wordTimings[i].end) return i;
  }
  return 0;
}

const MAX_WORDS_PER_CHUNK = 4;

export interface KaraokeBlockProps {
  wordTimings: WordTiming[];
  activeSentenceIdx: number;
  activeWordIdx: number;
  sentenceStartFrame: number;
  globalFrameOffset: number;
  accent: string;
  pacing: Pacing;
  position?: "bottom" | "center";
  fontSize?: number;
  highlightWords?: string[];
  /** Fallback sentence text for frame-based reveal when wordTimings are absent */
  sentenceText?: string;
}

export const KaraokeBlock: React.FC<KaraokeBlockProps> = ({
  wordTimings, activeSentenceIdx, activeWordIdx, sentenceStartFrame,
  globalFrameOffset, accent, pacing, position = "bottom", fontSize: fontSizeOverride, highlightWords,
  sentenceText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sentenceWords = wordTimings.filter((w) => w.sentenceIndex === activeSentenceIdx);

  const activePosInSentence = sentenceWords.findIndex(
    (w) => wordTimings.indexOf(w) === activeWordIdx
  );
  const currentChunkIdx = activePosInSentence < 0
    ? 0
    : Math.floor(activePosInSentence / MAX_WORDS_PER_CHUNK);
  const chunkStart   = currentChunkIdx * MAX_WORDS_PER_CHUNK;
  const visibleWords = sentenceWords.slice(chunkStart, chunkStart + MAX_WORDS_PER_CHUNK);

  const chunkFirstWord  = visibleWords[0];
  const chunkEntryFrame = chunkFirstWord
    ? Math.max(0, Math.round(chunkFirstWord.start * fps) - globalFrameOffset)
    : 0;
  const chunkOpacity = interpolate(frame, [chunkEntryFrame, chunkEntryFrame + 6], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const frameInSentence = frame - sentenceStartFrame;
  const enterProgress   = spring({ frame: frameInSentence, fps,
    config: { damping: pacing.damping, stiffness: pacing.stiffness }, durationInFrames: 20 });
  const containerY  = interpolate(enterProgress, [0, 1], [38, 0]);
  const containerOp = interpolate(enterProgress, [0, 1], [0, 1]);

  const computedFontSize = fontSizeOverride ?? sentenceFontSize(visibleWords.length);

  const positionStyle: React.CSSProperties = position === "center"
    ? { position: "absolute", top: "50%", left: 52, right: 52,
        transform: `translateY(calc(-50% + ${containerY}px))` }
    : { position: "absolute", bottom: 222, left: 52, right: 52,
        transform: `translateY(${containerY}px)` };

  // ── Frame-based fallback — renders when wordTimings are absent ─────────────
  if (visibleWords.length === 0 && sentenceText) {
    const words = sentenceText.trim().split(/\s+/).filter(Boolean);
    const WORD_STAGGER = 3;
    const WORD_DUR = 16;
    const fallbackFontSize = fontSizeOverride ?? sentenceFontSize(Math.min(words.length, 4));
    return (
      <div style={{ ...positionStyle, display: "flex", flexWrap: "wrap",
        justifyContent: "center", alignItems: "center", gap: "0 12px", rowGap: 12,
        opacity: containerOp }}>
        {words.map((word, i) => {
          const t = Math.max(0, Math.min(1, (frame - i * WORD_STAGGER) / WORD_DUR));
          const eased = 1 - Math.pow(1 - t, 3);
          const isHighlighted = (highlightWords ?? []).some(
            (hw) => hw.trim().toLowerCase() === word.replace(/[^a-z0-9']/gi, "").toLowerCase()
          );
          return (
            <div key={i} style={{ overflow: "hidden" }}>
              <span style={{
                display: "inline-block",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: fallbackFontSize,
                fontWeight: isHighlighted ? 800 : 700,
                color: isHighlighted ? accent : "#f0f0f0",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                opacity: eased,
                transform: `translateY(${(1 - eased) * 32}px)`,
              }}>{word}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ ...positionStyle, display: "flex", flexWrap: "wrap",
      justifyContent: "center", alignItems: "center", gap: "0 12px", rowGap: 12,
      opacity: containerOp * chunkOpacity }}>
      {visibleWords.map((wt, localIdx) => {
        const absIdx       = wordTimings.indexOf(wt);
        const isActive     = absIdx === activeWordIdx;
        const isPast       = absIdx < activeWordIdx;
        const isHighlighted = (highlightWords ?? []).some(
          (hw) => hw.trim().toLowerCase() === wt.word.trim().toLowerCase()
        );
        return (
          <KaraokeWord
            key={localIdx}
            word={wt.word}
            isActive={isActive}
            isPast={isPast}
            isHighlighted={isHighlighted}
            fontSize={computedFontSize}
            accent={accent}
          />
        );
      })}
    </div>
  );
};
