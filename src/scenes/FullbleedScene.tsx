import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BottomReadabilityGradient,
  GrainOverlay,
  ProgressDots,
  VignetteOverlay,
  VideoBackground,
} from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import type { SceneRendererProps } from "./sceneRegistry";

// ─── bg-image.png Ken Burns fallback ──────────────────────────────────────────
const BgImageKenBurns: React.FC<{
  frame: number; durationInFrames: number;
  imageMotion: string;
}> = ({ frame, durationInFrames, imageMotion }) => {
  const scale = interpolate(
    frame, [0, durationInFrames],
    imageMotion === "slow_zoom_out" ? [1.08, 1.0] : [1.0, 1.08],
    { extrapolateRight: "clamp" }
  );
  const tx = imageMotion === "pan_left"
    ? interpolate(frame, [0, durationInFrames], [0, -4], { extrapolateRight: "clamp" })
    : imageMotion === "pan_right"
    ? interpolate(frame, [0, durationInFrames], [-4, 0], { extrapolateRight: "clamp" })
    : 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#03070F" }}>
      <Img
        src={staticFile("bg-image.png")}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          filter: "saturate(0.75) brightness(0.65)",
          transform: `scale(${scale}) translateX(${tx}%)`,
          transformOrigin: "center center",
        }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.62) 100%)",
      }} />
    </div>
  );
};

interface FullbleedScenePropsExtended extends SceneRendererProps {
  fontFamily?: string;
}

export const FullbleedScene: React.FC<FullbleedScenePropsExtended> = ({
  directive, sentenceIndex, wordTimings, theme, pacing, styleConf,
  accent, globalFrameOffset, durationInFrames, sceneIndex, totalScenes, fallbackClip, sentenceText,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const backgroundClip = directive.resolved_clip ?? fallbackClip;
  const imageMotion    = directive.image_motion ?? "slow_zoom_in";
  const highlightWords = directive.highlight_words;
  const visualQuery    = directive.visual_query ?? undefined;

  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      data-visual-query={visualQuery ?? ""}
      style={{ opacity: Math.min(fadeIn, fadeOut) }}
    >
      {backgroundClip ? (
        <VideoBackground clip={backgroundClip} scrimOpacity={0.55}
          imageMotion={imageMotion} durationInFrames={durationInFrames} />
      ) : (
        /* No clip — use bg-image.png with Ken Burns motion */
        <BgImageKenBurns frame={frame} durationInFrames={durationInFrames} imageMotion={imageMotion} />
      )}

      <BottomReadabilityGradient bg={theme.bg} />

      <KaraokeBlock
        wordTimings={wordTimings} activeSentenceIdx={sentenceIndex}
        activeWordIdx={activeIdx} sentenceStartFrame={0}
        globalFrameOffset={globalFrameOffset} pacing={pacing}
        accent={accent} position="bottom"
        highlightWords={highlightWords}
        sentenceText={sentenceText}
        fontFamily={fontFamily}
      />

      <ProgressDots total={totalScenes} active={sceneIndex} frame={frame} />

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.45} />
    </AbsoluteFill>
  );
};
