/**
 * IntroducingTheModelContextComposition.tsx
 *
 * 12-sentence short: "Introducing the Model Context Protocol"
 * Ferrari design system — #da291c accent, dark canvas field, FerrariSans typeface.
 *
 * Beat → scene routing:
 *   hook                → McpHookScene
 *   breathe             → McpBreatheScene
 *   turn                → McpTurnScene
 *   close               → McpCloseScene
 *   build / reveal / *  → McpImageScene (with image if available)
 */
import React from "react";
import { useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import type { Props } from "../ShortsComposition";
import {
  McpHookScene,
  McpImageScene,
  McpBreatheScene,
  McpTurnScene,
  McpCloseScene,
} from "../../scenes/introducing-the-model-context/index";

// ── Video-specific constants (embedded from script.json) ─────────────────────

const BEATS = [
  "hook",
  "build",
  "build",
  "build",
  "breathe",
  "turn",
  "build",
  "build",
  "breathe",
  "reveal",
  "build",
  "close",
] as const;

// Ken Burns variant per sentence (varies for visual rhythm)
const KEN_BURNS = [
  "zoom_in",   // 1  hook
  "zoom_in",   // 2  build
  "pan_left",  // 3  build
  "zoom_out",  // 4  build
  "none",      // 5  breathe
  "pan_right", // 6  turn
  "zoom_in",   // 7  build
  "pan_left",  // 8  build
  "none",      // 9  breathe
  "zoom_in",   // 10 reveal
  "zoom_out",  // 11 build
  "none",      // 12 close
] as const;

// ── Transition frame count (imported by Root.tsx) ────────────────────────────
export const TRANSITION_FRAMES = 12;

// ── Composition ──────────────────────────────────────────────────────────────

export const IntroducingTheModelContextComposition: React.FC<Props> = ({
  scenes,
  sentenceDurations,
  suggestedDurations,
  resolvedImages,
  tokens,
}) => {
  const { fps } = useVideoConfig();

  const durations =
    sentenceDurations.length === scenes.length ? sentenceDurations : suggestedDurations;

  const durationFrames = durations.map((ms) =>
    Math.max(1, Math.round((ms / 1000) * fps)),
  );

  return (
    <TransitionSeries>
      {scenes.map((scene, i) => {
        const beat = i < BEATS.length ? BEATS[i] : "build";
        const kenBurns = i < KEN_BURNS.length ? KEN_BURNS[i] : "zoom_in";
        const dur = durationFrames[i] ?? 60;
        const imagePath = resolvedImages[i] ?? null;

        let sceneNode: React.ReactNode;

        if (beat === "hook") {
          sceneNode = (
            <McpHookScene
              text={scene.text}
              highlightWords={scene.highlightWords}
              imagePath={imagePath}
              tokens={tokens}
              durationInFrames={dur}
            />
          );
        } else if (beat === "breathe") {
          sceneNode = (
            <McpBreatheScene
              text={scene.text}
              highlightWords={scene.highlightWords}
              tokens={tokens}
              durationInFrames={dur}
            />
          );
        } else if (beat === "turn") {
          sceneNode = (
            <McpTurnScene
              text={scene.text}
              highlightWords={scene.highlightWords}
              imagePath={imagePath}
              tokens={tokens}
              durationInFrames={dur}
            />
          );
        } else if (beat === "close") {
          sceneNode = (
            <McpCloseScene
              text={scene.text}
              highlightWords={scene.highlightWords}
              tokens={tokens}
              durationInFrames={dur}
            />
          );
        } else {
          // build, reveal, and any other beats → image scene
          sceneNode = (
            <McpImageScene
              text={scene.text}
              highlightWords={scene.highlightWords}
              imagePath={imagePath}
              tokens={tokens}
              durationInFrames={dur}
              kenBurns={kenBurns}
            />
          );
        }

        return (
          <React.Fragment key={i}>
            {/* Transition before every scene except the first */}
            {i > 0 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
            <TransitionSeries.Sequence durationInFrames={dur}>
              {sceneNode}
            </TransitionSeries.Sequence>
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};
