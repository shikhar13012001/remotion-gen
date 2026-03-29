import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay, VignetteOverlay, VideoBackground } from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import { BgDeepField } from "../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { FlowNode } from "../../packages/video-renderer/src/components/primitives/FlowNode";
import { TOKEN } from "../../packages/video-renderer/src/tokens";
import type { WordTiming } from "../utils/sentenceBoundaries";
import type { Pacing, StyleConf } from "../lib/tokens";

export interface SplitPhotoDataSceneProps {
  image_query:      string;
  headline:         string;
  facts:            string[];
  accent:           string;
  wordTimings:      WordTiming[];
  sentenceIndex:    number;
  globalFrameOffset: number;
  durationInFrames: number;
  accentWords:      string[];
  pacing:           Pacing;
  styleConf:        StyleConf;
  resolvedClip?:    string;
}

export const SplitPhotoDataScene: React.FC<SplitPhotoDataSceneProps> = ({
  headline, facts, accent,
  wordTimings, sentenceIndex, globalFrameOffset,
  durationInFrames, accentWords, pacing, styleConf, resolvedClip,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const headlineProg = spring({
    frame: Math.max(0, frame - 4), fps,
    config: { damping: pacing.damping, stiffness: pacing.stiffness },
    durationInFrames: 18,
  });

  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  const STAGGER = 6;

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {/* Left 50% — photo or deep field */}
      <div style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%" }}>
        {resolvedClip ? (
          <VideoBackground
            clip={resolvedClip}
            scrimOpacity={0.4}
            imageMotion="slow_zoom_in"
            durationInFrames={durationInFrames}
          />
        ) : (
          <BgDeepField frame={frame} startFrame={0} />
        )}
      </div>

      {/* Right 50% — dark panel with headline + facts */}
      <div style={{
        position: "absolute", right: 0, top: 0, width: "50%", height: "70%",
        background: "rgba(13,13,13,0.94)",
        borderLeft: `1px solid ${accent}30`,
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "60px 48px 40px 48px",
        gap: 28,
      }}>
        {/* Headline */}
        <div style={{
          fontFamily: TOKEN.serif, fontSize: 40, fontWeight: 800,
          color: TOKEN.white, lineHeight: 1.2, letterSpacing: "-0.02em",
          opacity: interpolate(headlineProg, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(headlineProg, [0, 1], [16, 0])}px)`,
        }}>
          {headline}
        </div>

        {/* Accent divider */}
        <div style={{ width: 48, height: 2, background: accent }} />

        {/* Facts as FlowNode-style boxes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {facts.map((fact, i) => (
            <FlowNode
              key={i}
              text={fact}
              frame={frame}
              startFrame={8 + i * STAGGER}
              isLast={i === facts.length - 1}
              accentColor={accent}
            />
          ))}
        </div>
      </div>

      {/* Karaoke at bottom */}
      <KaraokeBlock
        wordTimings={wordTimings} activeSentenceIdx={sentenceIndex}
        activeWordIdx={activeIdx} sentenceStartFrame={0}
        globalFrameOffset={globalFrameOffset} pacing={pacing}
        accent={accent} position="bottom"
        highlightWords={accentWords}
      />

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.5} />
    </AbsoluteFill>
  );
};
