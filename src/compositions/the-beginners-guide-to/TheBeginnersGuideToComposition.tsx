import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadSyne } from "@remotion/google-fonts/Syne";
import { PaletteContext, buildPalette } from "../../context/PaletteContext";
import { HookScene } from "../../scenes/the-beginners-guide-to/HookScene";
import { BodyScene } from "../../scenes/the-beginners-guide-to/BodyScene";
import { CloseScene } from "../../scenes/the-beginners-guide-to/CloseScene";
import type { Beat } from "../../scenes/the-beginners-guide-to/BodyScene";
import type { Props } from "../ShortsComposition";

const { fontFamily: DISPLAY_FONT } = loadSyne("normal", {
  weights: ["700", "800"],
  subsets: ["latin"],
});

// Sentence metadata from data/output/script.json (17 sentences)
const SENTENCE_META: { beat: Beat | "hook" | "close"; needsImage: boolean }[] = [
  { beat: "hook", needsImage: true }, // 0: You can own a skyscraper for 200 dollars
  { beat: "build", needsImage: true }, // 1: Real Estate Investment Trusts...
  { beat: "build", needsImage: true }, // 2: Those properties — malls, hotels...
  { beat: "build", needsImage: false }, // 3: That rent flows directly to investors
  { beat: "breathe", needsImage: false }, // 4: 90 percent
  { beat: "build", needsImage: false }, // 5: By law, a REIT must distribute...
  { beat: "turn", needsImage: false }, // 6: That obligation is what separates...
  { beat: "build", needsImage: false }, // 7: Singapore REITs averaged 8.1%...
  { beat: "build", needsImage: false }, // 8: That gap is the entire argument...
  { beat: "build", needsImage: false }, // 9: But REITs borrow heavily...
  { beat: "turn", needsImage: false }, // 10: Higher borrowing costs compress...
  { beat: "breathe", needsImage: false }, // 11: Rate risk
  { beat: "reveal", needsImage: false }, // 12: Before selecting any REIT...
  { beat: "build", needsImage: false }, // 13: A low gearing ratio...
  { beat: "build", needsImage: true }, // 14: High occupancy confirms...
  { beat: "build", needsImage: false }, // 15: REITs do not replace...
  { beat: "close", needsImage: false }, // 16: That skyscraper was always out...
];

const TRANSITION_FRAMES = 12;

export const TheBeginnersGuideToComposition: React.FC<Props> = ({
  scenes,
  sentenceDurations,
  suggestedDurations,
  tokens,
}) => {
  const { fps } = useVideoConfig();

  const durations = sentenceDurations.length === scenes.length
    ? sentenceDurations
    : suggestedDurations;

  const durationFrames = durations.map((ms) => Math.max(30, Math.round((ms / 1000) * fps)));

  const accent = tokens.colors["accent"] ?? "#f0c040";
  const palette = buildPalette(accent);

  const hookFrames = durationFrames[0] ?? 96;
  const closeFrames = durationFrames[durationFrames.length - 1] ?? 114;

  const bodyScenes = scenes.slice(1, -1);
  const bodyFrames = durationFrames.slice(1, -1);
  const bodyMeta = SENTENCE_META.slice(1, -1);

  return (
    <PaletteContext.Provider value={palette}>
      <AbsoluteFill style={{ fontFamily: DISPLAY_FONT, overflow: "hidden" }}>
        <TransitionSeries>

          {/* Hook */}
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

          {/* Body sentences */}
          {bodyScenes.flatMap((scene, j) => {
            const dur = bodyFrames[j] ?? 60;
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

          {/* Close */}
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
