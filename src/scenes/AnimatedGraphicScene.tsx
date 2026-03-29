import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay, VignetteOverlay } from "../lib/overlays";
import { KaraokeBlock, activeWordIndex } from "../lib/KaraokeBlock";
import { usePalette } from "../context/PaletteContext";
import { ANIMATION_REGISTRY } from "../animations/registry";
import { BgSignal } from "../../packages/video-renderer/src/components/backgrounds/BgSignal";
import { GoldDivider } from "../../packages/video-renderer/src/components/primitives/GoldDivider";
import type { SceneRendererProps } from "./sceneRegistry";
import type { AnimationType } from "../../lmstudio/index";

// ANIMATION ZONE: top 70% = 1344px of 1920px
const ANIM_ZONE_H = 1344;

// ─── KineticFallback — editorial word-reveal when no animation component exists ─
const KineticFallback: React.FC<{ frame: number; accent: string; sentenceText: string }> = ({
  frame, accent, sentenceText,
}) => {
  const words = sentenceText.trim().split(/\s+/).filter(Boolean);
  const STAGGER = 4;
  const WORD_DUR = 18;

  // Accent — mono label enters first
  const labelOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const labelY  = interpolate(frame, [0, 14], [12, 0], { extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "flex-start",
      padding: "0 88px",
    }}>
      {/* Category stamp */}
      <div style={{
        opacity: labelOp,
        transform: `translateY(${labelY}px)`,
        fontFamily: "Courier New, monospace",
        fontSize: 13, letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: accent, marginBottom: 32,
      }}>
        — context
      </div>

      {/* Word-by-word clip reveal */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", maxWidth: 880 }}>
        {words.map((word, i) => {
          const t = Math.max(0, Math.min(1, (frame - i * STAGGER) / WORD_DUR));
          const eased = 1 - Math.pow(1 - t, 4);
          return (
            <div key={i} style={{ overflow: "hidden" }}>
              <span style={{
                display: "inline-block",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 68, fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                opacity: eased,
                transform: `translateY(${(1 - eased) * 40}px)`,
              }}>
                {word}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom accent line */}
      <div style={{
        marginTop: 40, height: 1, width: interpolate(frame, [12, 30], [0, 280], { extrapolateRight: "clamp" }),
        background: `linear-gradient(to right, ${accent}, transparent)`,
      }} />
    </div>
  );
};

export const AnimatedGraphicScene: React.FC<SceneRendererProps> = ({
  directive, sentenceIndex, wordTimings, theme, pacing, styleConf,
  accent, globalFrameOffset, durationInFrames, sentenceText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animationType  = directive.animation_spec?.type;
  const animationSpec  = directive.animation_spec;
  const highlightWords = directive.highlight_words;

  const palette       = usePalette();
  const globalTimeSec = (frame + globalFrameOffset) / fps;
  const activeIdx     = wordTimings.length > 0 ? activeWordIndex(wordTimings, globalTimeSec) : -1;

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sceneOp = Math.min(fadeIn, fadeOut);

  // Zone entry animation
  const zoneEnter = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: (t) => t * (2 - t), // ease-out quad
  });
  const zoneY = interpolate(zoneEnter, [0, 1], [24, 0]);

  // Look up the animation component from the registry
  const AnimComponent = animationType ? ANIMATION_REGISTRY[animationType as AnimationType] ?? null : null;

  return (
    <AbsoluteFill style={{ opacity: sceneOp }}>
      {/* Design system background — scan-line signal grid, ideal for data scenes */}
      <BgSignal frame={frame} startFrame={0} />
      {/* Photographic texture — screen blend at very low opacity */}
      <img src={staticFile("bg-image.png")} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: 0.07,
        filter: "saturate(0.2) brightness(0.4)",
        mixBlendMode: "screen" as const,
      }} />

      {/* Animation zone — top 70% with entry animation */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: 1080, height: ANIM_ZONE_H,
        overflow: "hidden",
        transform: `translateY(${zoneY}px)`,
        opacity: zoneEnter,
      }}>
        {AnimComponent && animationSpec ? (
          <AnimComponent
            spec={animationSpec}
            startFrame={0}
            durationInFrames={durationInFrames}
            palette={palette}
            fps={fps}
          />
        ) : (
          /* Fallback: KineticTitle-style editorial display */
          <KineticFallback
            frame={frame}
            accent={accent}
            sentenceText={wordTimings
              .filter(w => w.sentenceIndex === sentenceIndex)
              .map(w => w.word).join(" ")}
          />
        )}
      </div>

      {/* GoldDivider — draws in from center, separates animation zone from karaoke */}
      <div style={{ position: "absolute", top: ANIM_ZONE_H - 10, left: 0, right: 0,
        display: "flex", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={10} width={360} accentColor={accent} />
      </div>

      {/* Karaoke — bottom 30%, supporting role */}
      <KaraokeBlock
        wordTimings={wordTimings}
        activeSentenceIdx={sentenceIndex}
        activeWordIdx={activeIdx}
        sentenceStartFrame={0}
        globalFrameOffset={globalFrameOffset}
        pacing={pacing}
        accent={accent}
        position="bottom"
        highlightWords={highlightWords}
        sentenceText={sentenceText}
      />

      <GrainOverlay frame={frame} opacity={styleConf.grainOpacity} />
      <VignetteOverlay intensity={0.55} />
    </AbsoluteFill>
  );
};
