import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay, VignetteOverlay } from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import { BgDeepField } from "../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { GoldDivider } from "../../packages/video-renderer/src/components/primitives/GoldDivider";
import { Stamp } from "../../packages/video-renderer/src/components/primitives/Stamp";
import { TOKEN } from "../../packages/video-renderer/src/tokens";
import type { WordTiming } from "../utils/sentenceBoundaries";
import type { Pacing, StyleConf } from "../lib/tokens";

export interface EditorialHeadlineSceneProps {
  line1:            string;
  line2:            string;
  highlight_line:   string;
  subtext?:         string;
  stamp_label?:     string;
  accent:           string;
  wordTimings:      WordTiming[];
  sentenceIndex:    number;
  globalFrameOffset: number;
  durationInFrames: number;
  accentWords:      string[];
  pacing:           Pacing;
  styleConf:        StyleConf;
}

export const EditorialHeadlineScene: React.FC<EditorialHeadlineSceneProps> = ({
  line1, line2, highlight_line, subtext, stamp_label,
  accent, wordTimings, sentenceIndex, globalFrameOffset,
  durationInFrames, accentWords, pacing, styleConf,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Staggered entrance springs
  const prog1 = spring({ frame: Math.max(0, frame - 4),  fps, config: { damping: pacing.damping, stiffness: pacing.stiffness }, durationInFrames: 20 });
  const prog2 = spring({ frame: Math.max(0, frame - 8),  fps, config: { damping: pacing.damping, stiffness: pacing.stiffness }, durationInFrames: 20 });
  const prog3 = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: pacing.damping, stiffness: pacing.stiffness }, durationInFrames: 20 });
  const prog4 = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: pacing.damping, stiffness: pacing.stiffness }, durationInFrames: 16 });

  const lineProgress = spring({
    frame: Math.max(0, frame - 10), fps,
    config: { damping: pacing.damping + 4, stiffness: pacing.stiffness * 0.9 },
    durationInFrames: 18,
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 120]);

  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut), alignItems: "center", justifyContent: "center" }}>
      <BgDeepField frame={frame} startFrame={0} />

      {/* Stamp badge */}
      <div style={{ position: "absolute", top: 88, left: 72 }}>
        <Stamp
          label={stamp_label ?? "editorial"}
          frame={frame} startFrame={4}
          accentColor={accent}
        />
      </div>

      {/* Centered text block */}
      <div style={{
        zIndex: 2, display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20, padding: "0 80px",
        textAlign: "center",
      }}>
        {/* line1 — small setup */}
        {line1 && (
          <div style={{
            fontFamily: TOKEN.sans, fontSize: 28, fontWeight: 400,
            color: TOKEN.dim, letterSpacing: "0.04em",
            opacity: interpolate(prog1, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(prog1, [0, 1], [16, 0])}px)`,
          }}>
            {line1}
          </div>
        )}

        {/* line2 — medium pivot */}
        <div style={{
          fontFamily: TOKEN.serif, fontSize: 64, fontWeight: 800,
          color: TOKEN.white, lineHeight: 1.1, letterSpacing: "-0.02em",
          opacity: interpolate(prog2, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(prog2, [0, 1], [20, 0])}px)`,
        }}>
          {line2}
        </div>

        {/* Accent divider line */}
        <div style={{ width: lineWidth, height: 2, background: accent }} />

        {/* highlight_line — large gold/accent, italic */}
        <div style={{
          fontFamily: TOKEN.serif, fontSize: 80, fontWeight: 800,
          fontStyle: "italic", color: accent,
          lineHeight: 1.05, letterSpacing: "-0.03em",
          opacity: interpolate(prog3, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(prog3, [0, 1], [24, 0])}px)`,
        }}>
          {highlight_line}
        </div>

        {/* subtext — optional caption */}
        {subtext && (
          <div style={{
            fontFamily: TOKEN.sans, fontSize: 24, fontWeight: 400,
            color: TOKEN.faint, letterSpacing: "0.02em",
            opacity: interpolate(prog4, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(prog4, [0, 1], [12, 0])}px)`,
          }}>
            {subtext}
          </div>
        )}
      </div>

      {/* Divider at bottom */}
      <div style={{ position: "absolute", bottom: "32%", left: 0, right: 0,
        display: "flex", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={14} width={280} accentColor={accent} />
      </div>

      {/* Karaoke overlay at bottom */}
      {wordTimings.length > 0 && (
        <KaraokeBlock
          wordTimings={wordTimings} activeSentenceIdx={sentenceIndex}
          activeWordIdx={activeIdx} sentenceStartFrame={0}
          globalFrameOffset={globalFrameOffset} pacing={pacing}
          accent={accent} position="bottom"
          highlightWords={accentWords}
        />
      )}

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.55} />
    </AbsoluteFill>
  );
};
