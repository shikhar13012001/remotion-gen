import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay, VignetteOverlay } from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import { usePalette } from "../context/PaletteContext";
import { ANIMATION_REGISTRY } from "../animations/registry";
import { BgSignal } from "../../packages/video-renderer/src/components/backgrounds/BgSignal";
import { GoldDivider } from "../../packages/video-renderer/src/components/primitives/GoldDivider";
import type { WordTiming } from "../utils/sentenceBoundaries";
import type { Pacing, StyleConf } from "../lib/tokens";

const ANIM_ZONE_H = 1344;

export interface FlowDiagramSceneProps {
  nodes:            string[];
  style:            "arrow_chain" | "tree" | "cycle";
  accent:           string;
  wordTimings:      WordTiming[];
  sentenceIndex:    number;
  globalFrameOffset: number;
  durationInFrames: number;
  accentWords:      string[];
  pacing:           Pacing;
  styleConf:        StyleConf;
}

export const FlowDiagramScene: React.FC<FlowDiagramSceneProps> = ({
  nodes, style: flowStyle, accent, wordTimings, sentenceIndex,
  globalFrameOffset, durationInFrames, accentWords, pacing, styleConf,
}) => {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = usePalette();

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sceneOp = Math.min(fadeIn, fadeOut);

  const zoneEnter = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: (t) => t * (2 - t),
  });
  const zoneY = interpolate(zoneEnter, [0, 1], [24, 0]);

  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  const spec = {
    type:            "flow_diagram" as const,
    data:            { nodes, style: flowStyle },
    entry_animation: "build_in" as const,
    duration_ms:     (durationInFrames / fps) * 1000,
  };

  const AnimComponent = ANIMATION_REGISTRY["flow_diagram"] ?? null;

  return (
    <AbsoluteFill style={{ opacity: sceneOp }}>
      <BgSignal frame={frame} startFrame={0} />

      <div style={{
        position: "absolute", top: 0, left: 0, width: 1080, height: ANIM_ZONE_H,
        overflow: "hidden",
        transform: `translateY(${zoneY}px)`,
        opacity: zoneEnter,
      }}>
        {AnimComponent ? (
          <AnimComponent
            spec={spec}
            startFrame={0}
            durationInFrames={durationInFrames}
            palette={palette}
            fps={fps}
          />
        ) : (
          <div style={{
            position: "absolute", width: 700, height: 700, borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}18 0%, transparent 65%)`,
            left: "50%", top: ANIM_ZONE_H / 2,
            transform: "translate(-50%, -50%)",
          }} />
        )}
      </div>

      <div style={{ position: "absolute", top: ANIM_ZONE_H - 10, left: 0, right: 0,
        display: "flex", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={10} width={360} accentColor={accent} />
      </div>

      <KaraokeBlock
        wordTimings={wordTimings} activeSentenceIdx={sentenceIndex}
        activeWordIdx={activeIdx} sentenceStartFrame={0}
        globalFrameOffset={globalFrameOffset} pacing={pacing}
        accent={accent} position="bottom"
        highlightWords={accentWords}
      />

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.55} />
    </AbsoluteFill>
  );
};
