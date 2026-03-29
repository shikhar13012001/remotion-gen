import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay, VignetteOverlay } from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import { BgDeepField } from "../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { GoldDivider } from "../../packages/video-renderer/src/components/primitives/GoldDivider";
import { Stamp } from "../../packages/video-renderer/src/components/primitives/Stamp";
import type { SceneRendererProps } from "./sceneRegistry";

export const TextDominantScene: React.FC<SceneRendererProps> = ({
  directive, sentenceIndex, wordTimings, theme, pacing, styleConf,
  accent, globalFrameOffset, durationInFrames, sentenceText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const highlightWords = directive.highlight_words;

  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Stamp enters at frame 6 — after BgDeepField has settled
  const showStamp = frame >= 4;

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {/* Design system background — drifting deep-blue blobs + L-path grid */}
      <BgDeepField frame={frame} startFrame={0} />
      {/* Subtle photographic texture — screen blend, barely visible */}
      <img src={staticFile("bg-image.png")} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: 0.08,
        filter: "saturate(0.25) brightness(0.5)",
        mixBlendMode: "screen" as const,
      }} />

      {/* Document type badge — top-left */}
      <div style={{ position: "absolute", top: 88, left: 72 }}>
        {showStamp && (
          <Stamp label="editorial" frame={frame} startFrame={4} accentColor={accent} />
        )}
      </div>

      {/* Karaoke — center stage */}
      <KaraokeBlock
        wordTimings={wordTimings} activeSentenceIdx={sentenceIndex}
        activeWordIdx={activeIdx} sentenceStartFrame={0}
        globalFrameOffset={globalFrameOffset} pacing={pacing}
        accent={accent} position="center"
        highlightWords={highlightWords}
        sentenceText={sentenceText}
      />

      {/* Divider — draws in below center text */}
      <div style={{ position: "absolute", bottom: "38%", left: 0, right: 0,
        display: "flex", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={8} width={320} accentColor={accent} />
      </div>

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.5} />
    </AbsoluteFill>
  );
};
