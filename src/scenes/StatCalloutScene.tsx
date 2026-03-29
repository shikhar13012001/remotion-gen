import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay, VignetteOverlay, VideoBackground } from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import { StatDisplay } from "./StatDisplay";
import { BgFlare } from "../../packages/video-renderer/src/components/backgrounds/BgFlare";
import { GoldDivider } from "../../packages/video-renderer/src/components/primitives/GoldDivider";
import { Stamp } from "../../packages/video-renderer/src/components/primitives/Stamp";
import type { SceneRendererProps } from "./sceneRegistry";

export const StatCalloutScene: React.FC<SceneRendererProps> = ({
  directive, sentenceIndex, wordTimings, theme, pacing, styleConf,
  accent, globalFrameOffset, durationInFrames, fallbackClip, sentenceText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const backgroundClip = directive.resolved_clip ?? fallbackClip;
  const animationSpec  = directive.animation_spec;

  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  const timedText = wordTimings
    .filter((w) => w.sentenceIndex === sentenceIndex)
    .map((w) => w.word)
    .join(" ");
  const resolvedText = timedText || sentenceText || "";
  const statMatch   = resolvedText.match(/\b\d[\d,.]*(%|\s*(?:million|billion|thousand|k))?\b/i);
  const statDisplay = statMatch?.[0]?.trim() ?? "";
  const labelText   = resolvedText.replace(/\b\d[\d,.]*(%|\s*(?:million|billion|thousand|k))?\b/gi, "").trim();

  const slamSpring = spring({ frame, fps, config: { damping: 12, stiffness: 320 }, durationInFrames: 10 });
  const slamScale  = interpolate(slamSpring, [0, 1], [1.5, 1.0]);
  const slamOp     = interpolate(slamSpring, [0, 1], [0, 1]);

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const useCounter = animationSpec?.type === "counter";
  const rawCounterData = useCounter && animationSpec
    ? (animationSpec.data as { value?: number; prefix?: string; suffix?: string; decimals?: number })
    : null;
  const counterData: { value: number; prefix?: string; suffix?: string; decimals?: number } | null =
    rawCounterData && typeof rawCounterData.value === "number"
      ? { ...rawCounterData, value: rawCounterData.value }
      : null;

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {/* Background — video clip with heavy scrim, or design-system BgFlare */}
      {backgroundClip ? (
        <VideoBackground clip={backgroundClip} scrimOpacity={0.72} imageMotion="slow_zoom_in"
          durationInFrames={durationInFrames} />
      ) : (
        <BgFlare frame={frame} startFrame={0} />
      )}
      {/* Photographic texture over BgFlare — adds depth */}
      {!backgroundClip && (
        <img src={staticFile("bg-image.png")} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: 0.15,
          filter: "saturate(0.35) brightness(0.55)",
          mixBlendMode: "screen" as const,
        }} />
      )}

      {/* Document type badge — top-left */}
      <div style={{ position: "absolute", top: 88, left: 72 }}>
        <Stamp label="data" frame={frame} startFrame={4} accentColor={accent} />
      </div>

      <StatDisplay
        statDisplay={statDisplay} labelText={labelText}
        slamScale={slamScale} slamOp={slamOp} accent={accent}
        useCounter={useCounter} counterData={counterData}
        durationInFrames={durationInFrames}
      />

      {/* Divider — sits between stat and karaoke block */}
      <div style={{ position: "absolute", bottom: "33%", left: 0, right: 0,
        display: "flex", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={6} width={280} accentColor={accent} />
      </div>

      <KaraokeBlock
        wordTimings={wordTimings} activeSentenceIdx={sentenceIndex}
        activeWordIdx={activeIdx} sentenceStartFrame={0}
        globalFrameOffset={globalFrameOffset} pacing={pacing}
        accent={accent} position="bottom"
        sentenceText={sentenceText}
      />
      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.45} />
    </AbsoluteFill>
  );
};
