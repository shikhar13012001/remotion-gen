# Build Remotion Composition from Generated Script

Topic         : The Beginner's Guide to REITs: What They Are and How to Invest
Script        : D:\claude-work\yt-shorts-gen\data\output\script.json
Sentences     : 16
Accent Color  : #f0c040
Video Slug    : the-beginners-guide-to
Design System : ./designs/vercel/DESIGN.md
Design Guide  : guides/science/general.md
(No audio — run `npm run audio:generate` to generate separately)

---

## Step 1 — Read before writing any code

1. Read the full script: `D:\claude-work\yt-shorts-gen\data\output\script.json`
   Each sentence has: `index`, `text`, `beat`, `highlightWords`, `dataValue`, `needsImage`, `suggested_duration_ms`

2. Read the design guide: `guides/science/general.md`
   Learn what scene templates, components, backgrounds, and animation rules apply.

3. Read the design system: `./designs/vercel/DESIGN.md`
   Extract colors, typography, and spacing. Use these values directly — do not guess or hardcode.

---

## Step 2 — File layout (mandatory)

Every video is self-contained in two folders named after the video slug.
The slug for this video is: `the-beginners-guide-to`

```
src/
├── compositions/
│   └── the-beginners-guide-to/
│       ├── index.ts                      ← REQUIRED: re-exports the composition
│       └── TheBeginnersGuideToComposition.tsx
│
└── scenes/
    └── the-beginners-guide-to/
        ├── index.ts                      ← REQUIRED: re-exports all scenes
        ├── HookScene.tsx                 ← beat=hook sentence
        ├── CloseScene.tsx                ← beat=close sentence
        └── BodyScene.tsx                 ← all body sentences (or split by type)
```

**Rules:**
- Never place files directly in `compositions/` or `scenes/` roots — always in a named subfolder
- Every subfolder must have an `index.ts` that re-exports its public surface
- `src/Root.tsx` imports only from `compositions/the-beginners-guide-to/index` — never from nested files
- Helpers or types used only by this video live inside the video folder, not in `lib/` or `utils/`

---

## Step 3 — Composition file structure

The main composition file wires everything together:

```tsx
// src/compositions/the-beginners-guide-to/TheBeginnersGuideToComposition.tsx
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TOKEN } from "../../packages/video-renderer/src/tokens";
import { PaletteContext, buildPalette } from "../../context/PaletteContext";
import { HookScene }  from "../../scenes/the-beginners-guide-to/HookScene";
import { BodyScene }  from "../../scenes/the-beginners-guide-to/BodyScene";
import { CloseScene } from "../../scenes/the-beginners-guide-to/CloseScene";
import type { Props } from "../ShortsComposition";

export const TheBeginnersGuideToComposition: React.FC<Props> = ({
  scenes, sentenceDurations, suggestedDurations, tokens,
}) => {
  const { fps } = useVideoConfig();
  const durations = sentenceDurations.length === scenes.length ? sentenceDurations : suggestedDurations;
  const frames = durations.map(ms => Math.round((ms / 1000) * fps));
  const accent = tokens.colors["accent"] ?? "#f0c040";
  const palette = buildPalette(accent);

  return (
    <PaletteContext.Provider value={palette}>
      <AbsoluteFill>
        <TransitionSeries>
          {/* Hook */}
          <TransitionSeries.Sequence durationInFrames={frames[0] ?? 96}>
            <HookScene text={scenes[0]?.text ?? ""} accent={accent} durationInFrames={frames[0] ?? 96} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

          {/* Body scenes — one Sequence per sentence */}
          {scenes.slice(1, -1).map((scene, i) => (
            <React.Fragment key={i}>
              <TransitionSeries.Sequence durationInFrames={frames[i + 1] ?? 60}>
                <BodyScene
                  text={scene.text}
                  highlightWords={scene.highlightWords}
                  dataValue={scene.dataValue}
                  accent={accent}
                  durationInFrames={frames[i + 1] ?? 60}
                  sceneIndex={i}
                />
              </TransitionSeries.Sequence>
              {i < scenes.length - 3 && (
                <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
              )}
            </React.Fragment>
          ))}

          <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

          {/* Close */}
          <TransitionSeries.Sequence durationInFrames={frames[frames.length - 1] ?? 114}>
            <CloseScene text={scenes[scenes.length - 1]?.text ?? ""} accent={accent}
              durationInFrames={frames[frames.length - 1] ?? 114} />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </AbsoluteFill>
    </PaletteContext.Provider>
  );
};
```

---

## Step 4 — Scene component pattern

Each scene file follows this contract:

```tsx
// src/scenes/the-beginners-guide-to/BodyScene.tsx
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TOKEN } from "../../../packages/video-renderer/src/tokens";
import { usePalette } from "../../context/PaletteContext";

interface BodySceneProps {
  text:             string;
  highlightWords:   string[];
  dataValue:        number | null;
  accent:           string;
  durationInFrames: number;
  sceneIndex:       number;
}

export const BodyScene: React.FC<BodySceneProps> = ({
  text, highlightWords, dataValue, accent, durationInFrames, sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = usePalette();

  // All animation via interpolate() or spring() — never CSS transitions or @keyframes
  const fadeIn = spring({ frame, fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 20 });

  return (
    <AbsoluteFill style={{ background: TOKEN.colors.surfaceDark }}>
      {/* Your scene layout here */}
    </AbsoluteFill>
  );
};
```

**Mandatory rules for every scene component:**
- Use `useCurrentFrame()` — subtract a `startFrame` offset only when needed inside TransitionSeries
- Animate with `interpolate()` or `spring()` only — no CSS `transition`, no `@keyframes`
- All colors from `TOKEN.*` or `usePalette()` — never hardcode hex values
- All font sizes from `TOKEN.typography.*` — never hardcode pixel values
- All spacing from `TOKEN.spacing.*` — never hardcode spacing numbers
- Background defined per-scene — not globally

---

## Step 5 — Scene template mapping

Map each sentence to a template using this decision tree:

```
beat = "hook"              → HookScene    (impact text, BgFlare or strong background)
beat = "close"             → CloseScene   (echo the hook, callback to opening)
dataValue != null          → StatScene    (giant number slam-in, accent color)
needsImage = true          → FullbleedScene (text over atmospheric background)
beat = "breathe"           → TextDominant (text only, centered, negative space)
beat = "turn" or "reveal"  → EditorialScene (bold statement, accent divider)
default                    → BodyScene    (narration text, word-by-word reveal)
```

**Accent words:** render each word in `highlightWords` in `accent` color, bumped one font weight heavier.

**Word-by-word reveal pattern:**
```tsx
{text.split(" ").map((word, i) => {
  const wordFrame = Math.max(0, frame - i * 3);  // 3-frame stagger
  const wordOp = interpolate(wordFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const wordY  = interpolate(wordFrame, [0, 8], [12, 0], { extrapolateRight: "clamp" });
  const isAccent = highlightWords.some(w => w.toLowerCase() === word.toLowerCase().replace(/[^a-z0-9]/g, ""));
  return (
    <span key={i} style={{
      opacity: wordOp,
      transform: `translateY(${wordY}px)`,
      display: "inline-block",
      marginRight: "0.25em",
      color: isAccent ? accent : TOKEN.colors.onDark,
      fontWeight: isAccent ? 700 : 400,
    }}>
      {word}
    </span>
  );
})}
```

---

## Step 6 — Design freedom (backgrounds + visual style)

**You are free to design the backgrounds.** Do not copy existing backgrounds rigidly.
Choose based on the topic tone: `The Beginner's Guide to REITs: What They Are and How to Invest`
Accent: `#f0c040`

**Token values to build backgrounds with:**
```
TOKEN.colors.surfaceDark          // near-black base
TOKEN.colors.surfaceDarkElevated  // slightly lifted surface
TOKEN.colors.surfaceDarkSoft      // warm dark
TOKEN.colors.canvas               // off-white (use for light/inverted scenes)
TOKEN.colors.accentTeal           // teal accent (secondary highlight)
TOKEN.colors.accentAmber          // amber accent (warm emphasis)
```

**Per-scene background ideas:**
- hook / close → geometric radial, strong vignette, accent glow
- stat / data → tight grid, clinical, colder tone
- narrative → drifting blobs, film grain, editorial feel
- breathe / transition → near-black with subtle texture, maximum negative space

**Grid pattern (CSS, inline):**
```tsx
backgroundImage: `linear-gradient(${TOKEN.colors.muted}18 1px, transparent 1px),
                  linear-gradient(90deg, ${TOKEN.colors.muted}18 1px, transparent 1px)`,
backgroundSize: "48px 48px",
```

**Background image priority — check this before coding any background:**
- **Priority 1 — Guide bg** `guides/science/bg/*.png` — if an image exists, copy to `public/bg-image.png` and use `staticFile()`
- **Priority 2 — Repo fallback** `public/bg-image.png` — always present, use directly
- **Priority 3 — Programmatic** BgDeepField / BgFlare / BgSignal — only when no image available

When using a static image, always apply Ken Burns — never render it motionless:
```tsx
import { Img, staticFile, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
const { durationInFrames } = useVideoConfig();
const frame = useCurrentFrame();
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], { extrapolateRight: "clamp" });
// render:
<Img src={staticFile("bg-image.png")} style={{
  position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.65) brightness(0.45)",
  transform: `scale(${imgScale})`,
}} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)" }} />
```

---

## Step 7 — index.ts files (required)

```ts
// src/compositions/the-beginners-guide-to/index.ts
export { TheBeginnersGuideToComposition } from "./TheBeginnersGuideToComposition";

// src/scenes/the-beginners-guide-to/index.ts
export { HookScene }  from "./HookScene";
export { BodyScene }  from "./BodyScene";
export { CloseScene } from "./CloseScene";
```

---

## Step 8 — Register in src/Root.tsx

Add to the existing `Root.tsx`:

```tsx
import { TheBeginnersGuideToComposition } from "./compositions/the-beginners-guide-to/index";

// Inside <Root>:
<Composition
  id="TheBeginnersGuideToComposition"
  component={TheBeginnersGuideToComposition}
  fps={30}
  width={1080}
  height={1920}
  durationInFrames={900}
  calculateMetadata={calculateMetadata}
  defaultProps={scriptToProps(script)}
/>
```

Import the script JSON at the top:
```tsx
import script from "../data/output/script.json";
```

---

## Step 9 — Validate before rendering

Run after writing all files:
```bash
npx tsc --noEmit
```
Must pass with zero errors. Fix any type errors before rendering.

Then render:
```bash
npx remotion render TheBeginnersGuideToComposition out/video.mp4
```
