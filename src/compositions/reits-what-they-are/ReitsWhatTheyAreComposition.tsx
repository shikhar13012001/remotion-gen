import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadSyne } from "@remotion/google-fonts/Syne";
import { PaletteContext, buildPalette } from "../../context/PaletteContext";
import { HookScene }  from "../../scenes/reits-what-they-are/HookScene";
import { BodyScene }  from "../../scenes/reits-what-they-are/BodyScene";
import { CloseScene } from "../../scenes/reits-what-they-are/CloseScene";
import type { Beat }  from "../../scenes/reits-what-they-are/BodyScene";
import type { Props } from "../ShortsComposition";

// ─── Fonts ─────────────────────────────────────────────────────────────────────
const { fontFamily: DISPLAY_FONT } = loadSyne("normal", {
  weights: ["700", "800"],
  subsets: ["latin"],
});

// ─── Static beat/needsImage metadata from data/output/script.json ──────────────
// These mirror the script's sentences array exactly (17 sentences).
const SENTENCE_META: { beat: Beat | "hook" | "close"; needsImage: boolean }[] = [
  { beat: "hook",    needsImage: true  },  // 0  "You own a skyscraper…"
  { beat: "build",   needsImage: true  },  // 1  "Real Estate Investment Trusts…"
  { beat: "build",   needsImage: true  },  // 2  "Hotels, hospitals, warehouses…"
  { beat: "turn",    needsImage: true  },  // 3  "That portfolio generates rent…"
  { beat: "reveal",  needsImage: false },  // 4  "90% paid out…"  (dataValue=90)
  { beat: "build",   needsImage: false },  // 5  "That legal requirement…"
  { beat: "breathe", needsImage: false },  // 6  "A company can choose…"
  { beat: "build",   needsImage: true  },  // 7  "Singapore REITs averaged…" (dataValue=8.1)
  { beat: "build",   needsImage: true  },  // 8  "That gap is why income investors…"
  { beat: "turn",    needsImage: false },  // 9  "But the structure carries a hidden…"
  { beat: "reveal",  needsImage: true  },  // 10 "REITs borrow heavily…"
  { beat: "build",   needsImage: true  },  // 11 "Rising rates also make bonds…"
  { beat: "breathe", needsImage: false },  // 12 "The same economic force…"
  { beat: "build",   needsImage: false },  // 13 "Income up. Price down."
  { beat: "build",   needsImage: false },  // 14 "That tension is the defining feature…"
  { beat: "turn",    needsImage: true  },  // 15 "Gearing ratio, dividend yield…"
  { beat: "close",   needsImage: false },  // 16 "A skyscraper in a portfolio…"
];

const TRANSITION_FRAMES = 12;

/**
 * ReitsWhatTheyAreComposition
 *
 * Beat-driven composition for "REITs: What They Are and How to Invest".
 * 17 sentences mapped to scene templates via SENTENCE_META:
 *   hook   → HookScene    (BgFlare, large serif, accent glow)
 *   close  → CloseScene   (BgDeepField, word-by-word, GoldDivider)
 *   body   → BodyScene    (routes by beat: stat / breathe / editorial / narrative)
 *
 * Accent: #f0c040 (amber — finance palette)
 */
export const ReitsWhatTheyAreComposition: React.FC<Props> = ({
  scenes,
  sentenceDurations,
  suggestedDurations,
  tokens,
}) => {
  const { fps } = useVideoConfig();

  // Prefer real ElevenLabs durations; fall back to LLM-suggested durations
  const durations = sentenceDurations.length === scenes.length
    ? sentenceDurations
    : suggestedDurations;

  const durationFrames = durations.map((ms) => Math.max(30, Math.round((ms / 1000) * fps)));

  const accent   = tokens.colors["accent"] ?? "#f0c040";
  const palette  = buildPalette(accent);

  // Hook (first) and Close (last) durations
  const hookFrames  = durationFrames[0] ?? 96;
  const closeFrames = durationFrames[durationFrames.length - 1] ?? 114;

  // Body sentences (everything except first and last)
  const bodyScenes  = scenes.slice(1, -1);
  const bodyFrames  = durationFrames.slice(1, -1);
  const bodyMeta    = SENTENCE_META.slice(1, -1);

  return (
    <PaletteContext.Provider value={palette}>
      <AbsoluteFill style={{ fontFamily: DISPLAY_FONT, overflow: "hidden" }}>
        <TransitionSeries>

          {/* ── Hook ─────────────────────────────────────────────────────── */}
          <TransitionSeries.Sequence durationInFrames={hookFrames}>
            <HookScene
              text={scenes[0]?.text ?? ""}
              highlightWords={scenes[0]?.highlightWords ?? []}
              accent={accent}
              durationInFrames={hookFrames}
            />
          </TransitionSeries.Sequence>

          <TransitionSeries.Transition
            presentation={fade()}
            timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          />

          {/* ── Body sentences ───────────────────────────────────────────── */}
          {bodyScenes.flatMap((scene, j) => {
            const dur  = bodyFrames[j] ?? 60;
            const meta = bodyMeta[j] ?? { beat: "build" as Beat, needsImage: false };
            const beat = meta.beat as Beat;

            const elements: React.ReactNode[] = [
              <TransitionSeries.Sequence key={`body-seq-${j}`} durationInFrames={dur}>
                <BodyScene
                  text={scene.text}
                  highlightWords={scene.highlightWords}
                  dataValue={scene.dataValue}
                  accent={accent}
                  durationInFrames={dur}
                  sceneIndex={j}
                  beat={beat}
                  needsImage={meta.needsImage}
                />
              </TransitionSeries.Sequence>,
            ];

            // Add transition after every body scene except the last
            if (j < bodyScenes.length - 1) {
              elements.push(
                <TransitionSeries.Transition
                  key={`body-trans-${j}`}
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />,
              );
            }

            return elements;
          })}

          <TransitionSeries.Transition
            presentation={fade()}
            timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          />

          {/* ── Close ────────────────────────────────────────────────────── */}
          <TransitionSeries.Sequence durationInFrames={closeFrames}>
            <CloseScene
              text={scenes[scenes.length - 1]?.text ?? ""}
              highlightWords={scenes[scenes.length - 1]?.highlightWords ?? []}
              accent={accent}
              durationInFrames={closeFrames}
            />
          </TransitionSeries.Sequence>

        </TransitionSeries>
      </AbsoluteFill>
    </PaletteContext.Provider>
  );
};
