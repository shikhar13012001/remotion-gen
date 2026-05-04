import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { LightLeak } from "@remotion/light-leaks";
import { loadFont as loadSyne } from "@remotion/google-fonts/Syne";
import type { TokenMap } from "../../lmstudio/index";
import {
  type WordTiming,
} from "../utils/sentenceBoundaries";
import { PaletteContext, buildPalette } from "../context/PaletteContext";
import { THEMES, PACING_CONFIG, STYLE_CONFIG } from "../lib/tokens";
import { hueFromAccent, autoFallbackDirective } from "../lib/compositionUtils";
import { HookScene }               from "../scenes/HookScene";
import { CTAScene }                from "../scenes/CTAScene";
import { TitleOverlay }            from "../scenes/TitleOverlay";
import { SceneDirectiveRenderer }  from "../scenes/SceneDirectiveRenderer";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const { fontFamily: DISPLAY_FONT } = loadSyne("normal", { weights: ["700", "800"], subsets: ["latin"] });

// ─── Types ────────────────────────────────────────────────────────────────────

export { type WordTiming };

type Scene = {
  text:           string;
  highlightWords: string[];
  dataValue:      number | null;
};

export type Props = {
  scenes:             Scene[];
  sentenceDurations:  number[];   // real ms from ElevenLabs
  suggestedDurations: number[];   // fallback
  resolvedImages:     (string | null)[];
  tokens:             TokenMap;
};

// ─── Shared constant ──────────────────────────────────────────────────────────
export const TRANSITION_FRAMES = 12;

// ─── Main Composition ─────────────────────────────────────────────────────────

export const ShortsComposition: React.FC<Props> = ({
  scenes,
  sentenceDurations,
  suggestedDurations,
  resolvedImages,
  tokens,
}) => {
  const { fps } = useVideoConfig();
  const durations = sentenceDurations.length === scenes.length
    ? sentenceDurations
    : suggestedDurations;
  const durationFrames = durations.map(ms => Math.round((ms / 1000) * fps));
  const startFrames = durationFrames.reduce<number[]>((acc, _, i) =>
    [...acc, i === 0 ? 0 : acc[i - 1] + durationFrames[i - 1]], []);

  const accent      = tokens.colors["accent"] ?? "#c8a96e";
  const paletteValue = buildPalette(accent);
  const theme       = THEMES.dark;
  const pacing      = PACING_CONFIG.medium;
  const styleConf   = STYLE_CONFIG.bold;
  const hue         = hueFromAccent(accent);

  const hookDur  = durationFrames[0] ?? pacing.hookFrames;
  const ctaDur   = durationFrames[durationFrames.length - 1] ?? pacing.ctaFrames;

  const bodyScenes        = scenes.slice(1, -1);
  const bodyDurationFrames = durationFrames.slice(1, -1);
  const bodyStartFrames    = startFrames.slice(1, -1);

  const numBodyTrans = Math.max(0, bodyDurationFrames.length - 1);
  const totalBodyDur = bodyDurationFrames.reduce((a, b) => a + b, 0) - numBodyTrans * TRANSITION_FRAMES;
  const bodyStart    = hookDur;

  return (
    <PaletteContext.Provider value={paletteValue}>
    <AbsoluteFill style={{ fontFamily: DISPLAY_FONT, overflow: "hidden" }}>

      <TransitionSeries>
        {/* ── Hook ── */}
        <TransitionSeries.Sequence durationInFrames={hookDur}>
          <HookScene
            hook={scenes[0]?.text ?? ""}
            theme={theme} pacing={pacing} styleConf={styleConf}
            durationInFrames={hookDur} accent={accent}
            backgroundClip={resolvedImages[0] ?? undefined}
          />
        </TransitionSeries.Sequence>

        {bodyScenes.length > 0 && (
          <TransitionSeries.Overlay durationInFrames={20}>
            <LightLeak seed={1} hueShift={hue} />
          </TransitionSeries.Overlay>
        )}

        {/* ── Body sentences — directive-driven via registry ── */}
        {bodyScenes.flatMap((scene, j) => {
          const dur      = bodyDurationFrames[j] ?? 60;
          const offset   = bodyStartFrames[j] ?? bodyStart;
          const baseDirective = autoFallbackDirective([], j + 1);
          // Enhance directive with highlight words from scene data
          const directive = {
            ...baseDirective,
            highlight_words: scene.highlightWords,
          };

          const els: React.ReactNode[] = [
            <TransitionSeries.Sequence key={`seq-${j}`} durationInFrames={dur}>
              <SceneDirectiveRenderer
                directive={directive}
                sentenceIndex={j + 1}
                wordTimings={[]}
                globalFrameOffset={offset}
                durationInFrames={dur}
                theme={theme} pacing={pacing} styleConf={styleConf} accent={accent}
                sceneIndex={j}
                totalScenes={bodyScenes.length}
                fallbackClip={resolvedImages[j + 1] ?? undefined}
                sentenceText={scene.text}
                fontFamily={DISPLAY_FONT}
              />
            </TransitionSeries.Sequence>,
          ];

          if (j < bodyScenes.length - 1) {
            els.push(
              <TransitionSeries.Transition
                key={`trans-${j}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />,
            );
          }

          return els;
        })}

        {bodyScenes.length > 0 && (
          <TransitionSeries.Overlay durationInFrames={20}>
            <LightLeak seed={3} hueShift={(hue + 60) % 360} />
          </TransitionSeries.Overlay>
        )}

        {/* ── CTA ── */}
        <TransitionSeries.Sequence durationInFrames={ctaDur}>
          <CTAScene
            cta={scenes[scenes.length - 1]?.text ?? ""}
            theme={theme} pacing={pacing} styleConf={styleConf}
            accent={accent}
            backgroundClip={resolvedImages[resolvedImages.length - 1] ?? undefined}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Title overlay spans the body section */}
      {totalBodyDur > 0 && (
        <Sequence from={bodyStart} durationInFrames={totalBodyDur}>
          <TitleOverlay title="" theme={theme} pacing={pacing} accent={accent} />
        </Sequence>
      )}
    </AbsoluteFill>
    </PaletteContext.Provider>
  );
};
