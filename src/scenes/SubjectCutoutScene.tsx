import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay, VignetteOverlay, VideoBackground } from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import { BgDeepField } from "../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { TOKEN } from "../../packages/video-renderer/src/tokens";
import type { WordTiming } from "../utils/sentenceBoundaries";
import type { Pacing, StyleConf } from "../lib/tokens";

export interface SubjectCutoutSceneProps {
  image_query:      string;
  annotation?:      string;
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

export const SubjectCutoutScene: React.FC<SubjectCutoutSceneProps> = ({
  annotation, accent, wordTimings, sentenceIndex,
  globalFrameOffset, durationInFrames, accentWords, pacing, styleConf, resolvedClip,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const annotationProg = spring({
    frame: Math.max(0, frame - 8), fps,
    config: { damping: pacing.damping, stiffness: pacing.stiffness },
    durationInFrames: 16,
  });

  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {resolvedClip ? (
        <VideoBackground
          clip={resolvedClip}
          scrimOpacity={0.55}
          imageMotion="slow_zoom_in"
          durationInFrames={durationInFrames}
        />
      ) : (
        <BgDeepField frame={frame} startFrame={0} />
      )}

      {/* Annotation badge — top-left, delayed entrance */}
      {annotation && (
        <div style={{
          position: "absolute", top: 88, left: 72, zIndex: 3,
          opacity: interpolate(annotationProg, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(annotationProg, [0, 1], [-16, 0])}px)`,
        }}>
          <div style={{
            fontFamily: TOKEN.sans, fontSize: 24, fontWeight: 600,
            color: TOKEN.white,
            background: `${accent}1a`,
            border: `1px solid ${accent}66`,
            borderRadius: 3,
            padding: "8px 16px",
            letterSpacing: "0.06em",
          }}>
            {annotation}
          </div>
        </div>
      )}

      {/* Karaoke at bottom */}
      <KaraokeBlock
        wordTimings={wordTimings} activeSentenceIdx={sentenceIndex}
        activeWordIdx={activeIdx} sentenceStartFrame={0}
        globalFrameOffset={globalFrameOffset} pacing={pacing}
        accent={accent} position="bottom"
        highlightWords={accentWords}
      />

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.6} />
    </AbsoluteFill>
  );
};
