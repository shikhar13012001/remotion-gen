import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TOKEN } from "../../../packages/video-renderer/src/tokens";
import { BgDeepField } from "../../../packages/video-renderer/src/components/backgrounds/BgDeepField";
import { BgFlare } from "../../../packages/video-renderer/src/components/backgrounds/BgFlare";
import { BgSignal } from "../../../packages/video-renderer/src/components/backgrounds/BgSignal";
import { GoldDivider } from "../../../packages/video-renderer/src/components/primitives/GoldDivider";
import { Stamp } from "../../../packages/video-renderer/src/components/primitives/Stamp";
import { GrainOverlay, VignetteOverlay } from "../../lib/overlays";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Beat = "hook" | "build" | "turn" | "breathe" | "reveal" | "close";

export interface BodySceneProps {
  text:             string;
  highlightWords:   string[];
  dataValue:        number | null;
  accent:           string;
  durationInFrames: number;
  sceneIndex:       number;
  beat:             Beat;
  needsImage:       boolean;
}

// ─── Word-by-word reveal helper ─────────────────────────────────────────────

interface WordRevealProps {
  text:           string;
  highlightWords: string[];
  accent:         string;
  fontSize:       number;
  fontWeight:     number;
  textAlign?:     "left" | "center";
  startDelay?:    number;
  stagger?:       number;
  color?:         string;
}

const WordReveal: React.FC<WordRevealProps> = ({
  text, highlightWords, accent, fontSize, fontWeight,
  textAlign = "left", startDelay = 0, stagger = 3, color = TOKEN.white,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div style={{
      fontFamily: TOKEN.serif,
      fontSize,
      fontWeight,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      color,
      display: "flex",
      flexWrap: "wrap",
      justifyContent: textAlign === "center" ? "center" : "flex-start",
      gap: "0.26em",
    }}>
      {words.map((word, i) => {
        const delay     = startDelay + i * stagger;
        const wordProg  = spring({
          frame: Math.max(0, frame - delay), fps,
          config: { damping: 20, stiffness: 200 },
          durationInFrames: 14,
        });
        const wordOp = interpolate(wordProg, [0, 1], [0, 1]);
        const wordY  = interpolate(wordProg, [0, 1], [12, 0]);
        const clean  = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        const isAccent = highlightWords.some(
          (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "") === clean
            || w.toLowerCase().split(/\s+/).some(
              (part) => part.replace(/[^a-z0-9]/g, "") === clean,
            ),
        );
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: wordOp,
              transform: `translateY(${wordY}px)`,
              color: isAccent ? accent : color,
              fontWeight: isAccent ? fontWeight + 100 : fontWeight,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Sub-templates ──────────────────────────────────────────────────────────

/** StatView — giant number slam-in (beat=reveal, dataValue!=null) */
const StatView: React.FC<BodySceneProps> = ({
  text, highlightWords, dataValue, accent, durationInFrames, sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slamProg  = spring({ frame, fps, config: { damping: 12, stiffness: 320 }, durationInFrames: 10 });
  const slamScale = interpolate(slamProg, [0, 1], [1.5, 1.0]);
  const slamOp    = interpolate(slamProg, [0, 1], [0, 1]);

  const fadeIn  = interpolate(frame, [0, 8],  [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Derive display value: use dataValue if available, else extract from text
  const displayNum = dataValue !== null
    ? (Number.isInteger(dataValue) ? `${dataValue}` : `${dataValue}`)
    : (text.match(/\b\d[\d,.]*(%|\s*(?:million|billion|k))?\b/i)?.[0] ?? "");
  const suffix = displayNum.endsWith("%") ? "" : "%";

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BgSignal frame={frame} startFrame={0} />

      <div style={{ position: "absolute", top: 88, left: 72 }}>
        <Stamp
          label={sceneIndex % 2 === 0 ? "data" : "stat"}
          frame={frame}
          startFrame={4}
          accentColor={accent}
        />
      </div>

      {/* Giant stat number */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: 0, right: 0,
        transform: `translateY(-50%) scale(${slamScale})`,
        opacity: slamOp,
        textAlign: "center",
        padding: "0 64px",
      }}>
        <div style={{
          fontFamily: TOKEN.serif,
          fontSize: 160,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: accent,
        }}>
          {displayNum.endsWith("%") ? displayNum : `${displayNum}%`}
        </div>
      </div>

      {/* Label text below stat */}
      <div style={{
        position: "absolute",
        bottom: "28%",
        left: 64, right: 64,
      }}>
        <GoldDivider frame={frame} startFrame={8} width={200} accentColor={accent} />
        <div style={{ height: 20 }} />
        <WordReveal
          text={text}
          highlightWords={highlightWords}
          accent={accent}
          fontSize={32}
          fontWeight={400}
          textAlign="left"
          color={TOKEN.dim}
          stagger={2}
          startDelay={10}
        />
      </div>

      <GrainOverlay frame={frame} opacity={0.05} />
      <VignetteOverlay intensity={0.4} />
    </AbsoluteFill>
  );
};

/** BreatheView — centered text, maximum negative space (beat=breathe) */
const BreatheView: React.FC<BodySceneProps> = ({
  text, highlightWords, accent, durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const fadeIn  = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BgDeepField frame={frame} startFrame={0} />

      <div style={{
        position: "absolute",
        top: "50%",
        left: 80, right: 80,
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}>
        <WordReveal
          text={text}
          highlightWords={highlightWords}
          accent={accent}
          fontSize={44}
          fontWeight={400}
          textAlign="center"
          color={TOKEN.dim}
          stagger={4}
          startDelay={6}
        />
      </div>

      <GrainOverlay frame={frame} opacity={0.04} />
      <VignetteOverlay intensity={0.5} />
    </AbsoluteFill>
  );
};

/** EditorialView — bold impact statement (beat=turn) */
const EditorialView: React.FC<BodySceneProps> = ({
  text, highlightWords, accent, durationInFrames, sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProg = spring({
    frame, fps,
    config: { damping: 16, stiffness: 200 },
    durationInFrames: 20,
  });
  const containerOp = interpolate(enterProg, [0, 1], [0, 1]);
  const containerY  = interpolate(enterProg, [0, 1], [24, 0]);

  const fadeIn  = interpolate(frame, [0, 8],  [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BgFlare frame={frame} startFrame={0} />

      <div style={{ position: "absolute", top: 88, left: 72 }}>
        <Stamp label="editorial" frame={frame} startFrame={4} accentColor={accent} />
      </div>

      <div style={{
        position: "absolute",
        top: "50%",
        left: 72, right: 72,
        transform: `translateY(-50%)`,
        opacity: containerOp,
      }}>
        <div style={{ transform: `translateY(${containerY}px)` }}>
          <div style={{
            width: interpolate(
              spring({ frame: Math.max(0, frame - 4), fps,
                config: { damping: 18, stiffness: 180 }, durationInFrames: 16 }),
              [0, 1], [0, 100],
            ),
            height: 2,
            background: accent,
            marginBottom: 28,
          }} />
          <WordReveal
            text={text}
            highlightWords={highlightWords}
            accent={accent}
            fontSize={52}
            fontWeight={700}
            textAlign="left"
            stagger={3}
            startDelay={8}
          />
        </div>
      </div>

      <GrainOverlay frame={frame} opacity={0.06} />
      <VignetteOverlay intensity={0.55} />
    </AbsoluteFill>
  );
};

/** PunchView — short punchy statement (≤6 words, beat=build) */
const PunchView: React.FC<BodySceneProps> = ({
  text, highlightWords, accent, durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slamProg  = spring({ frame, fps, config: { damping: 14, stiffness: 280 }, durationInFrames: 12 });
  const slamScale = interpolate(slamProg, [0, 1], [1.25, 1.0]);
  const slamOp    = interpolate(slamProg, [0, 1], [0, 1]);

  const fadeIn  = interpolate(frame, [0, 8],  [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const words = text.split(" ");

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut), alignItems: "center", justifyContent: "center" }}>
      <BgFlare frame={frame} startFrame={0} />

      <div style={{
        transform: `scale(${slamScale})`,
        opacity: slamOp,
        textAlign: "center",
        padding: "0 72px",
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: TOKEN.serif,
          fontSize: words.length <= 3 ? 108 : 82,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0.22em",
        }}>
          {words.map((word, i) => {
            const clean    = word.toLowerCase().replace(/[^a-z0-9]/g, "");
            const isAccent = highlightWords.some(
              (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "") === clean,
            );
            return (
              <span key={i} style={{
                color: isAccent ? accent : TOKEN.white,
                fontWeight: isAccent ? 800 : 700,
              }}>
                {word}
              </span>
            );
          })}
        </div>
      </div>

      <GrainOverlay frame={frame} opacity={0.06} />
      <VignetteOverlay intensity={0.6} />
    </AbsoluteFill>
  );
};

/** NarrativeView — default narration text (BgDeepField, bottom-anchored) */
const NarrativeView: React.FC<BodySceneProps> = ({
  text, highlightWords, accent, durationInFrames, sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProg = spring({
    frame, fps,
    config: { damping: 18, stiffness: 160 },
    durationInFrames: 20,
  });
  const containerOp = interpolate(enterProg, [0, 1], [0, 1]);
  const containerY  = interpolate(enterProg, [0, 1], [36, 0]);

  const fadeIn  = interpolate(frame, [0, 8],  [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const showStamp = frame >= 4;
  const stampLabel = sceneIndex % 3 === 0 ? "analysis"
    : sceneIndex % 3 === 1 ? "context"
    : "detail";

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BgDeepField frame={frame} startFrame={0} />

      {/* Stamp — top-left */}
      {showStamp && (
        <div style={{ position: "absolute", top: 88, left: 72 }}>
          <Stamp label={stampLabel} frame={frame} startFrame={4} accentColor={accent} />
        </div>
      )}

      {/* Text block — lower third */}
      <div style={{
        position: "absolute",
        bottom: 220,
        left: 64, right: 64,
        opacity: containerOp,
        transform: `translateY(${containerY}px)`,
      }}>
        {/* Gold divider above text */}
        <GoldDivider frame={frame} startFrame={6} width={280} accentColor={accent} />
        <div style={{ height: 24 }} />
        <WordReveal
          text={text}
          highlightWords={highlightWords}
          accent={accent}
          fontSize={38}
          fontWeight={400}
          textAlign="left"
          color={TOKEN.dim}
          stagger={3}
          startDelay={8}
        />
      </div>

      <GrainOverlay frame={frame} opacity={0.05} />
      <VignetteOverlay intensity={0.45} />
    </AbsoluteFill>
  );
};

// ─── Main BodyScene router ─────────────────────────────────────────────────

/**
 * BodyScene — handles all sentences between hook and close.
 * Routes to sub-template based on beat, dataValue, and needsImage.
 *
 * Routing priority:
 *   1. dataValue != null → StatView (giant number slam-in)
 *   2. beat = "breathe"  → BreatheView (centered text, negative space)
 *   3. beat = "turn"     → EditorialView (BgFlare, bold statement)
 *   4. beat = "reveal"   → EditorialView (impact statement)
 *   5. short text ≤ 6 words AND beat = "build" → PunchView
 *   6. default           → NarrativeView (BgDeepField, lower-third text)
 */
export const BodyScene: React.FC<BodySceneProps> = (props) => {
  const { dataValue, beat, text } = props;
  const wordCount = text.trim().split(/\s+/).length;

  if (dataValue !== null) return <StatView    {...props} />;
  if (beat === "breathe")  return <BreatheView {...props} />;
  if (beat === "turn")     return <EditorialView {...props} />;
  if (beat === "reveal")   return <EditorialView {...props} />;
  if (beat === "build" && wordCount <= 6) return <PunchView {...props} />;
  return <NarrativeView {...props} />;
};
