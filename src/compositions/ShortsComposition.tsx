import React from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { LightLeak } from "@remotion/light-leaks";
import { loadFont as loadSyne } from "@remotion/google-fonts/Syne";
import type { ContentMetadata, VideoSpec, SentenceVisualDirective } from "../../lmstudio/index";
import {
  computeSentenceBoundaries,
  type WordTiming,
} from "../utils/sentenceBoundaries";
import { PaletteContext, buildPalette } from "../context/PaletteContext";
import { THEMES, PACING_CONFIG, STYLE_CONFIG } from "../lib/tokens";
import { hueFromAccent, pickClip, autoFallbackDirective } from "../lib/compositionUtils";
import { HookScene }               from "../scenes/HookScene";
import { CTAScene }                from "../scenes/CTAScene";
import { TitleOverlay }            from "../scenes/TitleOverlay";
import { SceneDirectiveRenderer }  from "../scenes/SceneDirectiveRenderer";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const { fontFamily: DISPLAY_FONT } = loadSyne("normal", { weights: ["700", "800"], subsets: ["latin"] });

// ─── Types ────────────────────────────────────────────────────────────────────

export { type WordTiming };

export type Props = {
  metadata: ContentMetadata;
  /** New pipeline output — when present, directives flow here instead of metadata.sceneDirectives */
  videoSpec?: VideoSpec;
  wordTimings: WordTiming[];
  audioFile: string;
  durationInFrames: number;
  backgroundClips?: string[];
  bgMusicFile?: string;
  _sentenceDurations?: number[];
};

// ─── Shared constant ──────────────────────────────────────────────────────────
export const TRANSITION_FRAMES = 12;

// ─── Main Composition ─────────────────────────────────────────────────────────

export const ShortsComposition: React.FC<Props> = ({
  metadata,
  videoSpec,
  wordTimings,
  audioFile,
  durationInFrames,
  backgroundClips = [],
  bgMusicFile,
  _sentenceDurations = [],
}) => {
  const theme     = THEMES[metadata.mood]              ?? THEMES.dark;
  const pacing    = PACING_CONFIG[metadata.pacing]     ?? PACING_CONFIG.medium;
  const styleConf = STYLE_CONFIG[metadata.visualStyle] ?? STYLE_CONFIG.bold;

  const accent = (metadata.accentColor && /^#[0-9a-f]{6}$/i.test(metadata.accentColor))
    ? metadata.accentColor
    : theme.accent;

  const hue = hueFromAccent(accent);

  const hookDur  = _sentenceDurations[0] ?? pacing.hookFrames;
  const ctaDur   = _sentenceDurations.length > 1
    ? _sentenceDurations[_sentenceDurations.length - 1]
    : pacing.ctaFrames;
  const bodyDurs = _sentenceDurations.length > 2 ? _sentenceDurations.slice(1, -1) : [];

  const boundaries     = computeSentenceBoundaries(wordTimings);
  const bodyBoundaries = boundaries.length > 0
    ? boundaries.slice(1)
    : bodyDurs.map((_, i) => ({ sentenceIndex: i + 1, startSec: 0, endSec: 0 }));

  const bodyOffsets: number[] = [];
  let accOffset = hookDur;
  for (let j = 0; j < bodyDurs.length; j++) {
    bodyOffsets.push(accOffset);
    const isLast = j === bodyDurs.length - 1;
    accOffset += bodyDurs[j] - (isLast ? 0 : TRANSITION_FRAMES);
  }

  const bodyStart    = hookDur;
  const numBodyTrans = Math.max(0, bodyDurs.length - 1);
  const totalBodyDur = bodyDurs.reduce((a, b) => a + b, 0) - numBodyTrans * TRANSITION_FRAMES;

  const paletteValue = buildPalette(accent);

  // Pre-compute body directives from VideoSpec when available.
  // VideoSpec.directives are SentenceVisualDirective[] — isNewDirective() returns true for these,
  // so SceneDirectiveRenderer.renderNewDirective() runs and convertToLegacy() correctly
  // maps template_data → animation_spec (fixing the animation data loss bug).
  const bodyDirectives: (SentenceVisualDirective | undefined)[] = React.useMemo(() => {
    if (!videoSpec) return [];
    const hookIdx  = videoSpec.sentences.findIndex(s => s.beat === "hook");
    const closeIdx = videoSpec.sentences.findIndex(s => s.beat === "close");
    return videoSpec.directives.filter(
      d => d.sentence_index !== (hookIdx + 1) && d.sentence_index !== (closeIdx + 1)
    );
  }, [videoSpec]);

  return (
    <PaletteContext.Provider value={paletteValue}>
    <AbsoluteFill style={{ fontFamily: DISPLAY_FONT, overflow: "hidden" }}>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      {bgMusicFile && <Audio src={staticFile(bgMusicFile)} volume={0.06} loop />}

      <TransitionSeries>
        {/* ── Hook ── */}
        <TransitionSeries.Sequence durationInFrames={hookDur}>
          <HookScene
            hook={metadata.hook} theme={theme} pacing={pacing} styleConf={styleConf}
            durationInFrames={hookDur} accent={accent}
            backgroundClip={pickClip(backgroundClips, 0)}
          />
        </TransitionSeries.Sequence>

        {bodyBoundaries.length > 0 && (
          <TransitionSeries.Overlay durationInFrames={20}>
            <LightLeak seed={1} hueShift={hue} />
          </TransitionSeries.Overlay>
        )}

        {/* ── Body sentences — directive-driven via registry ── */}
        {bodyBoundaries.flatMap((b, j) => {
          const dur       = bodyDurs[j] ?? 60;
          const offset    = bodyOffsets[j] ?? hookDur;
          // Prefer VideoSpec directives (SentenceVisualDirective with full template_data)
          // over legacy metadata.sceneDirectives (where animation_spec is null)
          const directive = bodyDirectives[j]
            ?? metadata.sceneDirectives?.[j]
            ?? autoFallbackDirective(wordTimings, b.sentenceIndex);

          const els: React.ReactNode[] = [
            <TransitionSeries.Sequence key={`seq-${b.sentenceIndex}`} durationInFrames={dur}>
              <SceneDirectiveRenderer
                directive={directive}
                sentenceIndex={b.sentenceIndex}
                wordTimings={wordTimings}
                globalFrameOffset={offset}
                durationInFrames={dur}
                theme={theme} pacing={pacing} styleConf={styleConf} accent={accent}
                sceneIndex={j}
                totalScenes={bodyBoundaries.length}
                fallbackClip={pickClip(backgroundClips, j + 1)}
              />
            </TransitionSeries.Sequence>,
          ];

          if (j < bodyBoundaries.length - 1) {
            els.push(
              <TransitionSeries.Transition
                key={`trans-${b.sentenceIndex}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />,
            );
          }

          return els;
        })}

        {bodyBoundaries.length > 0 && (
          <TransitionSeries.Overlay durationInFrames={20}>
            <LightLeak seed={3} hueShift={(hue + 60) % 360} />
          </TransitionSeries.Overlay>
        )}

        {/* ── CTA ── */}
        <TransitionSeries.Sequence durationInFrames={ctaDur}>
          <CTAScene
            cta={metadata.cta} theme={theme} pacing={pacing} styleConf={styleConf}
            accent={accent}
            backgroundClip={pickClip(backgroundClips, backgroundClips.length > 0 ? backgroundClips.length - 1 : 0)}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Title overlay spans the body section */}
      {totalBodyDur > 0 && (
        <Sequence from={bodyStart} durationInFrames={totalBodyDur}>
          <TitleOverlay title={metadata.title} theme={theme} pacing={pacing} accent={accent} />
        </Sequence>
      )}
    </AbsoluteFill>
    </PaletteContext.Provider>
  );
};
