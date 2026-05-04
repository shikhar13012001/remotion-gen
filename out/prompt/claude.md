# Build Remotion Composition from Generated Script

Topic         : The Beginner's Guide to REITs: What They Are and How to Invest
Script        : D:\\claude-work\\yt-shorts-gen\\data\\output\\script.json
Sentences     : 17
Accent Color  : #f0c040
Video Slug    : the-beginners-guide-to
Design System : ./designs/vercel/DESIGN.md
Design Guide  : guides/science/general.md
(No audio — run `npm run audio:generate` to generate separately)


---

## Step 1 — Context (already loaded below)


1. Read the full script: `D:\claude-work\yt-shorts-gen\data\output\script.json`
   Each sentence has: `index`, `text`, `beat`, `highlightWords`, `dataValue`, `needsImage`, `suggested_duration_ms`
2. Design guide (`guides/science/general.md`) — embedded at the bottom of this file.
   Use it for scene templates, components, backgrounds, and animation rules.
3. Design system (`./designs/vercel/DESIGN.md`) — embedded at the bottom of this file.
   Extract colors, typography, and spacing directly from it. Do not guess or hardcode.


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

* Never place files directly in `compositions/` or `scenes/` roots — always in a named subfolder
* Every subfolder must have an `index.ts` that re-exports its public surface
* `src/Root.tsx` imports only from `compositions/the-beginners-guide-to/index` — never from nested files
* Helpers or types used only by this video live inside the video folder, not in `lib/` or `utils/`


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

* Use `useCurrentFrame()` — subtract a `startFrame` offset only when needed inside TransitionSeries
* Animate with `interpolate()` or `spring()` only — no CSS `transition`, no `@keyframes`
* All colors from `TOKEN.*` or `usePalette()` — never hardcode hex values
* All font sizes from `TOKEN.typography.*` — never hardcode pixel values
* All spacing from `TOKEN.spacing.*` — never hardcode spacing numbers
* Background defined per-scene — not globally


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

* hook / close → geometric radial, strong vignette, accent glow
* stat / data → tight grid, clinical, colder tone
* narrative → drifting blobs, film grain, editorial feel
* breathe / transition → near-black with subtle texture, maximum negative space

**Grid pattern (CSS, inline):**

```tsx
backgroundImage: `linear-gradient(${TOKEN.colors.muted}18 1px, transparent 1px),
                  linear-gradient(90deg, ${TOKEN.colors.muted}18 1px, transparent 1px)`,
backgroundSize: "48px 48px",
```

**Background image priority — check this before coding any background:**

* **Priority 1 — Guide bg** `guides/science/bg/*.png` — if an image exists, copy to `public/bg-image.png` and use `staticFile()`
* **Priority 2 — Repo fallback** `public/bg-image.png` — always present, use directly
* **Priority 3 — Programmatic** BgDeepField / BgFlare / BgSignal — only when no image available

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


---

## Design Guide — guides/science/general.md

# Guide: Science

## Identity

Clinical, precise, awe-inducing. The feeling of a paper abstract becoming vivid.
Reference: Kurzgesagt meets LEMMiNO. Not a lecture. Not a vlog.

Every frame must carry explanatory weight. Numbers are visual events, not data points.
The tone is confident certainty — not wonder at the unknown, but revelation of the known.

Accent color: `#4fc3f7` — cyan. Data, precision, the future.


## Backgrounds

Three backgrounds are available. Pick based on the emotional register of the scene:

**BgDeepField** — default for most scenes
Drifting blobs on near-black. Use for: narration, context-setting, explanations.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgSignal** — for data and technical content
Tight grid, clinical. Use for: numbers, processes, cause-effect chains, formulas.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```

**BgFlare** — for reveals and impact moments
Circle geometry, dramatic. Use for: the hook, major reveals, paradigm shifts.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```


## Background Image Priority

Before coding a programmatic background, check for static images:

* **Priority 1** — `guides/science/bg/<topic-slug>.png` or `guides/science/bg/default.png`
* **Priority 2** — `public/bg-image.png` (repo fallback)
* **Priority 3** — Programmatic BgDeepField / BgSignal / BgFlare

To use a static image, copy it to `public/bg-image.png`, then animate with Ken Burns:

```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.55) brightness(0.4)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)" }} />
```


## Typography

```typescript
import { TOKEN } from "@yt-shorts/video-renderer";

TOKEN.serif  // Display headlines, stat numbers — use for the ONE big fact per scene
TOKEN.sans   // Narration body text, captions, explanatory text
TOKEN.mono   // Formulas, units, technical labels, instrument names
```

Font sizes (1080×1920):

* Massive (single stat): 160px serif 700 — one number, filling the frame
* Display: 72–80px serif 700, `letterSpacing: "-0.025em"`
* Body: 36–42px sans 300–400
* Label: 16–20px mono uppercase, `letterSpacing: "0.18em"`

Color rules:

```typescript
TOKEN.white      // primary headline text
TOKEN.dim        // body text, secondary facts
TOKEN.faint      // tertiary labels, units
// Accent (#4fc3f7 cyan): highlight words, chart lines, counters, timeline nodes
```


## Components

### KineticText — word-by-word reveal

```tsx
import { KineticText, TOKEN } from "@yt-shorts/video-renderer";

<KineticText
  text="Light takes 8 minutes to reach Earth from the Sun."
  accentWords={["8 minutes"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — unit / scale label

```tsx
import { Stamp } from "@yt-shorts/video-renderer";
<Stamp label="299,792 km/s · Speed of Light" frame={frame} startFrame={startFrame} />
```

### GoldDivider — accent divider between text tiers

```tsx
import { GoldDivider } from "@yt-shorts/video-renderer";
<GoldDivider frame={frame} startFrame={startFrame + 14} />
```


## Scene Templates

### TplEditorialHeadline — paradigm-shift statements

Use for: hook (opening fact), major reveals, section breaks where perspective shifts.

```tsx
<TplEditorialHeadline data={{
  type: "editorial_headline",
  stamp_label: "Quantum Mechanics · 1927",
  line1: "The particle was in both places.",
  line2: "Until you looked.",
  highlight_line: "Observation changes reality.",
  subtext: "Heisenberg's uncertainty principle redefined what 'knowing' means.",
}} frame={frame} startFrame={startFrame} />
```

### TplStatCallout — numbers as visual events

Use for: any measurable quantity, distance, speed, temperature, time.

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 13800000000,
  suffix: " years",
  label: "age of the universe",
  context: "13.8 billion years",
}} frame={frame} startFrame={startFrame} />
```

### TplTimeline — sequences, discoveries, stages

Use for: experimental steps, discovery timelines, evolutionary stages.

### TplFlowDiagram — mechanisms, cause-effect chains

Use for: explaining HOW something works (nuclear fission, DNA replication, etc.).

### TplTextDominant — breathe moments, abstract statements

Use for: conceptual pivots, rhetorical questions, transition between scales.


## Script Voice Rules

* Lead with the phenomenon, not the history: "Light bends. Mass warps space." not "In 1915, Einstein published…"
* Scale shifts are cinematic: move from human scale → planetary → cosmic → subatomic
* Numbers require context: never leave a large number without a comparison
* Mechanism before implication: explain the mechanism first, then its consequence
* "breathe" beats work well at scale transitions: "One photon." / "Absolute zero."


## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (paradigm-disrupting opening fact)
beat = "build"   → TplTextDominant or TplStatCallout (accumulate evidence)
beat = "turn"    → TplEditorialHeadline (the mechanism is not what you assumed)
beat = "reveal"  → TplStatCallout or TplFlowDiagram (the actual number / process)
beat = "breathe" → TplTextDominant, BgDeepField (single fact, negative space)
beat = "close"   → TplEditorialHeadline (reframe with the new knowledge)
dataValue != null → TplStatCallout (always)
```


## Distribution Rules

For a 10–18 sentence science video:

* At least 3 `TplStatCallout` scenes — science is numbers
* At least 1 `TplFlowDiagram` — explain a mechanism, not just a fact
* At least 2 `TplTextDominant` for breathing room at scale shifts
* No more than 3 consecutive `TplEditorialHeadline` or narration scenes




## Design System — ./designs/vercel/DESIGN.md

# Design System Inspired by Vercel

## 1. Visual Theme & Atmosphere

Vercel's website is the visual thesis of developer infrastructure made invisible — a design system so restrained it borders on philosophical. The page is overwhelmingly white (`#ffffff`) with near-black (`#171717`) text, creating a gallery-like emptiness where every element earns its pixel. This isn't minimalism as decoration; it's minimalism as engineering principle. The Geist design system treats the interface like a compiler treats code — every unnecessary token is stripped away until only structure remains.

The custom Geist font family is the crown jewel. Geist Sans uses aggressive negative letter-spacing (-2.4px to -2.88px at display sizes), creating headlines that feel compressed, urgent, and engineered — like code that's been minified for production. At body sizes, the tracking relaxes but the geometric precision persists. Geist Mono completes the system as the monospace companion for code, terminal output, and technical labels. Both fonts enable OpenType `"liga"` (ligatures) globally, adding a layer of typographic sophistication that rewards close reading.

What distinguishes Vercel from other monochrome design systems is its shadow-as-border philosophy. Instead of traditional CSS borders, Vercel uses `box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.08)` — a zero-offset, zero-blur, 1px-spread shadow that creates a border-like line without the box model implications. This technique allows borders to exist in the shadow layer, enabling smoother transitions, rounded corners without clipping, and a subtler visual weight than traditional borders. The entire depth system is built on layered, multi-value shadow stacks where each layer serves a specific purpose: one for the border, one for soft elevation, one for ambient depth.

**Key Characteristics:**

* Geist Sans with extreme negative letter-spacing (-2.4px to -2.88px at display) — text as compressed infrastructure
* Geist Mono for code and technical labels with OpenType `"liga"` globally
* Shadow-as-border technique: `box-shadow 0px 0px 0px 1px` replaces traditional borders throughout
* Multi-layer shadow stacks for nuanced depth (border + elevation + ambient in single declarations)
* Near-pure white canvas with `#171717` text — not quite black, creating micro-contrast softness
* Workflow-specific accent colors: Ship Red (`#ff5b4f`), Preview Pink (`#de1d8d`), Develop Blue (`#0a72ef`)
* Focus ring system using `hsla(212, 100%, 48%, 1)` — a saturated blue for accessibility
* Pill badges (9999px) with tinted backgrounds for status indicators

## 2. Color Palette & Roles

### Primary

* **Vercel Black** (`#171717`): Primary text, headings, dark surface backgrounds. Not pure black — the slight warmth prevents harshness.
* **Pure White** (`#ffffff`): Page background, card surfaces, button text on dark.
* **True Black** (`#000000`): Secondary use, `--geist-console-text-color-default`, used in specific console/code contexts.

### Workflow Accent Colors

* **Ship Red** (`#ff5b4f`): `--ship-text`, the "ship to production" workflow step — warm, urgent coral-red.
* **Preview Pink** (`#de1d8d`): `--preview-text`, the preview deployment workflow — vivid magenta-pink.
* **Develop Blue** (`#0a72ef`): `--develop-text`, the development workflow — bright, focused blue.

### Console / Code Colors

* **Console Blue** (`#0070f3`): `--geist-console-text-color-blue`, syntax highlighting blue.
* **Console Purple** (`#7928ca`): `--geist-console-text-color-purple`, syntax highlighting purple.
* **Console Pink** (`#eb367f`): `--geist-console-text-color-pink`, syntax highlighting pink.

### Interactive

* **Link Blue** (`#0072f5`): Primary link color with underline decoration.
* **Focus Blue** (`hsla(212, 100%, 48%, 1)`): `--ds-focus-color`, focus ring on interactive elements.
* **Ring Blue** (`rgba(147, 197, 253, 0.5)`): `--tw-ring-color`, Tailwind ring utility.

### Neutral Scale

* **Gray 900** (`#171717`): Primary text, headings, nav text.
* **Gray 600** (`#4d4d4d`): Secondary text, description copy.
* **Gray 500** (`#666666`): Tertiary text, muted links.
* **Gray 400** (`#808080`): Placeholder text, disabled states.
* **Gray 100** (`#ebebeb`): Borders, card outlines, dividers.
* **Gray 50** (`#fafafa`): Subtle surface tint, inner shadow highlight.

### Surface & Overlay

* **Overlay Backdrop** (`hsla(0, 0%, 98%, 1)`): `--ds-overlay-backdrop-color`, modal/dialog backdrop.
* **Selection Text** (`hsla(0, 0%, 95%, 1)`): `--geist-selection-text-color`, text selection highlight.
* **Badge Blue Bg** (`#ebf5ff`): Pill badge background, tinted blue surface.
* **Badge Blue Text** (`#0068d6`): Pill badge text, darker blue for readability.

### Shadows & Depth

* **Border Shadow** (`rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`): The signature — replaces traditional borders.
* **Subtle Elevation** (`rgba(0, 0, 0, 0.04) 0px 2px 2px`): Minimal lift for cards.
* **Card Stack** (`rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px`): Full multi-layer card shadow.
* **Ring Border** (`rgb(235, 235, 235) 0px 0px 0px 1px`): Light gray ring-border for tabs and images.

## 3. Typography Rules

### Font Family

* **Primary**: `Geist`, with fallbacks: `Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol`
* **Monospace**: `Geist Mono`, with fallbacks: `ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Liberation Mono, DejaVu Sans Mono, Courier New`
* **OpenType Features**: `"liga"` enabled globally on all Geist text; `"tnum"` for tabular numbers on specific captions.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|----|----|----|----|----|----|----|
| Display Hero | Geist | 48px (3.00rem) | 600 | 1.00–1.17 (tight) | -2.4px to -2.88px | Maximum compression, billboard impact |
| Section Heading | Geist | 40px (2.50rem) | 600 | 1.20 (tight) | -2.4px | Feature section titles |
| Sub-heading Large | Geist | 32px (2.00rem) | 600 | 1.25 (tight) | -1.28px | Card headings, sub-sections |
| Sub-heading | Geist | 32px (2.00rem) | 400 | 1.50 | -1.28px | Lighter sub-headings |
| Card Title | Geist | 24px (1.50rem) | 600 | 1.33 | -0.96px | Feature cards |
| Card Title Light | Geist | 24px (1.50rem) | 500 | 1.33 | -0.96px | Secondary card headings |
| Body Large | Geist | 20px (1.25rem) | 400 | 1.80 (relaxed) | normal | Introductions, feature descriptions |
| Body | Geist | 18px (1.13rem) | 400 | 1.56 | normal | Standard reading text |
| Body Small | Geist | 16px (1.00rem) | 400 | 1.50 | normal | Standard UI text |
| Body Medium | Geist | 16px (1.00rem) | 500 | 1.50 | normal | Navigation, emphasized text |
| Body Semibold | Geist | 16px (1.00rem) | 600 | 1.50 | -0.32px | Strong labels, active states |
| Button / Link | Geist | 14px (0.88rem) | 500 | 1.43 | normal | Buttons, links, captions |
| Button Small | Geist | 14px (0.88rem) | 400 | 1.00 (tight) | normal | Compact buttons |
| Caption | Geist | 12px (0.75rem) | 400–500 | 1.33 | normal | Metadata, tags |
| Mono Body | Geist Mono | 16px (1.00rem) | 400 | 1.50 | normal | Code blocks |
| Mono Caption | Geist Mono | 13px (0.81rem) | 500 | 1.54 | normal | Code labels |
| Mono Small | Geist Mono | 12px (0.75rem) | 500 | 1.00 (tight) | normal | `text-transform: uppercase`, technical labels |
| Micro Badge | Geist | 7px (0.44rem) | 700 | 1.00 (tight) | normal | `text-transform: uppercase`, tiny badges |

### Principles

* **Compression as identity**: Geist Sans at display sizes uses -2.4px to -2.88px letter-spacing — the most aggressive negative tracking of any major design system. This creates text that feels *minified*, like code optimized for production. The tracking progressively relaxes as size decreases: -1.28px at 32px, -0.96px at 24px, -0.32px at 16px, and normal at 14px.
* **Ligatures everywhere**: Every Geist text element enables OpenType `"liga"`. Ligatures aren't decorative — they're structural, creating tighter, more efficient glyph combinations.
* **Three weights, strict roles**: 400 (body/reading), 500 (UI/interactive), 600 (headings/emphasis). No bold (700) except for tiny micro-badges. This narrow weight range creates hierarchy through size and tracking, not weight.
* **Mono for identity**: Geist Mono in uppercase with `"tnum"` or `"liga"` serves as the "developer console" voice — compact technical labels that connect the marketing site to the product.

## 4. Component Stylings

### Buttons

**Primary White (Shadow-bordered)**

* Background: `#ffffff`
* Text: `#171717`
* Padding: 0px 6px (minimal — content-driven width)
* Radius: 6px (subtly rounded)
* Shadow: `rgb(235, 235, 235) 0px 0px 0px 1px` (ring-border)
* Hover: background shifts to `var(--ds-gray-1000)` (dark)
* Focus: `2px solid var(--ds-focus-color)` outline + `var(--ds-focus-ring)` shadow
* Use: Standard secondary button

**Primary Dark (Inferred from Geist system)**

* Background: `#171717`
* Text: `#ffffff`
* Padding: 8px 16px
* Radius: 6px
* Use: Primary CTA ("Start Deploying", "Get Started")

**Pill Button / Badge**

* Background: `#ebf5ff` (tinted blue)
* Text: `#0068d6`
* Padding: 0px 10px
* Radius: 9999px (full pill)
* Font: 12px weight 500
* Use: Status badges, tags, feature labels

**Large Pill (Navigation)**

* Background: transparent or `#171717`
* Radius: 64px–100px
* Use: Tab navigation, section selectors

### Cards & Containers

* Background: `#ffffff`
* Border: via shadow — `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`
* Radius: 8px (standard), 12px (featured/image cards)
* Shadow stack: `rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px`
* Image cards: `1px solid #ebebeb` with 12px top radius
* Hover: subtle shadow intensification

### Inputs & Forms

* Radio: standard styling with focus `var(--ds-gray-200)` background
* Focus shadow: `1px 0 0 0 var(--ds-gray-alpha-600)`
* Focus outline: `2px solid var(--ds-focus-color)` — consistent blue focus ring
* Border: via shadow technique, not traditional border

### Navigation

* Clean horizontal nav on white, sticky
* Vercel logotype left-aligned, 262x52px
* Links: Geist 14px weight 500, `#171717` text
* Active: weight 600 or underline
* CTA: dark pill buttons ("Start Deploying", "Contact Sales")
* Mobile: hamburger menu collapse
* Product dropdowns with multi-level menus

### Image Treatment

* Product screenshots with `1px solid #ebebeb` border
* Top-rounded images: `12px 12px 0px 0px` radius
* Dashboard/code preview screenshots dominate feature sections
* Soft gradient backgrounds behind hero images (pastel multi-color)

### Distinctive Components

**Workflow Pipeline**

* Three-step horizontal pipeline: Develop → Preview → Ship
* Each step has its own accent color: Blue → Pink → Red
* Connected with lines/arrows
* The visual metaphor for Vercel's core value proposition

**Trust Bar / Logo Grid**

* Company logos (Perplexity, ChatGPT, Cursor, etc.) in grayscale
* Horizontal scroll or grid layout
* Subtle `#ebebeb` border separation

**Metric Cards**

* Large number display (e.g., "10x faster")
* Geist 48px weight 600 for the metric
* Description below in gray body text
* Shadow-bordered card container

## 5. Layout Principles

### Spacing System

* Base unit: 8px
* Scale: 1px, 2px, 3px, 4px, 5px, 6px, 8px, 10px, 12px, 14px, 16px, 32px, 36px, 40px
* Notable gap: jumps from 16px to 32px — no 20px or 24px in primary scale

### Grid & Container

* Max content width: approximately 1200px
* Hero: centered single-column with generous top padding
* Feature sections: 2–3 column grids for cards
* Full-width dividers using `border-bottom: 1px solid #171717`
* Code/dashboard screenshots as full-width or contained with border

### Whitespace Philosophy

* **Gallery emptiness**: Massive vertical padding between sections (80px–120px+). The white space IS the design — it communicates that Vercel has nothing to prove and nothing to hide.
* **Compressed text, expanded space**: The aggressive negative letter-spacing on headlines is counterbalanced by generous surrounding whitespace. The text is dense; the space around it is vast.
* **Section rhythm**: White sections alternate with white sections — there's no color variation between sections. Separation comes from borders (shadow-borders) and spacing alone.

### Border Radius Scale

* Micro (2px): Inline code snippets, small spans
* Subtle (4px): Small containers
* Standard (6px): Buttons, links, functional elements
* Comfortable (8px): Cards, list items
* Image (12px): Featured cards, image containers (top-rounded)
* Large (64px): Tab navigation pills
* XL (100px): Large navigation links
* Full Pill (9999px): Badges, status pills, tags
* Circle (50%): Menu toggle, avatar containers

## 6. Depth & Elevation

| Level | Treatment | Use |
|----|----|----|
| Flat (Level 0) | No shadow | Page background, text blocks |
| Ring (Level 1) | `rgba(0,0,0,0.08) 0px 0px 0px 1px` | Shadow-as-border for most elements |
| Light Ring (Level 1b) | `rgb(235,235,235) 0px 0px 0px 1px` | Lighter ring for tabs, images |
| Subtle Card (Level 2) | Ring + `rgba(0,0,0,0.04) 0px 2px 2px` | Standard cards with minimal lift |
| Full Card (Level 3) | Ring + Subtle + `rgba(0,0,0,0.04) 0px 8px 8px -8px` + inner `#fafafa` ring | Featured cards, highlighted panels |
| Focus (Accessibility) | `2px solid hsla(212, 100%, 48%, 1)` outline | Keyboard focus on all interactive elements |

**Shadow Philosophy**: Vercel has arguably the most sophisticated shadow system in modern web design. Rather than using shadows for elevation in the traditional Material Design sense, Vercel uses multi-value shadow stacks where each layer has a distinct architectural purpose: one creates the "border" (0px spread, 1px), another adds ambient softness (2px blur), another handles depth at distance (8px blur with negative spread), and an inner ring (`#fafafa`) creates the subtle highlight that makes the card "glow" from within. This layered approach means cards feel built, not floating.

### Decorative Depth

* Hero gradient: soft, pastel multi-color gradient wash behind hero content (barely visible, atmospheric)
* Section borders: `1px solid #171717` (full dark line) between major sections
* No background color variation — depth comes entirely from shadow layering and border contrast

## 7. Do's and Don'ts

### Do

* Use Geist Sans with aggressive negative letter-spacing at display sizes (-2.4px to -2.88px at 48px)
* Use shadow-as-border (`0px 0px 0px 1px rgba(0,0,0,0.08)`) instead of traditional CSS borders
* Enable `"liga"` on all Geist text — ligatures are structural, not optional
* Use the three-weight system: 400 (body), 500 (UI), 600 (headings)
* Apply workflow accent colors (Red/Pink/Blue) only in their workflow context
* Use multi-layer shadow stacks for cards (border + elevation + ambient + inner highlight)
* Keep the color palette achromatic — grays from `#171717` to `#ffffff` are the system
* Use `#171717` instead of `#000000` for primary text — the micro-warmth matters

### Don't

* Don't use positive letter-spacing on Geist Sans — it's always negative or zero
* Don't use weight 700 (bold) on body text — 600 is the maximum, used only for headings
* Don't use traditional CSS `border` on cards — use the shadow-border technique
* Don't introduce warm colors (oranges, yellows, greens) into the UI chrome
* Don't apply the workflow accent colors (Ship Red, Preview Pink, Develop Blue) decoratively
* Don't use heavy shadows (> 0.1 opacity) — the shadow system is whisper-level
* Don't increase body text letter-spacing — Geist is designed to run tight
* Don't use pill radius (9999px) on primary action buttons — pills are for badges/tags only
* Don't skip the inner `#fafafa` ring in card shadows — it's the glow that makes the system work

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|----|----|----|
| Mobile Small | <400px | Tight single column, minimal padding |
| Mobile | 400–600px | Standard mobile, stacked layout |
| Tablet Small | 600–768px | 2-column grids begin |
| Tablet | 768–1024px | Full card grids, expanded padding |
| Desktop Small | 1024–1200px | Standard desktop layout |
| Desktop | 1200–1400px | Full layout, maximum content width |
| Large Desktop | >1400px | Centered, generous margins |

### Touch Targets

* Buttons use comfortable padding (8px–16px vertical)
* Navigation links at 14px with adequate spacing
* Pill badges have 10px horizontal padding for tap targets
* Mobile menu toggle uses 50% radius circular button

### Collapsing Strategy

* Hero: display 48px → scales down, maintains negative tracking proportionally
* Navigation: horizontal links + CTAs → hamburger menu
* Feature cards: 3-column → 2-column → single column stacked
* Code screenshots: maintain aspect ratio, may horizontally scroll
* Trust bar logos: grid → horizontal scroll
* Footer: multi-column → stacked single column
* Section spacing: 80px+ → 48px on mobile

### Image Behavior

* Dashboard screenshots maintain border treatment at all sizes
* Hero gradient softens/simplifies on mobile
* Product screenshots use responsive images with consistent border radius
* Full-width sections maintain edge-to-edge treatment

## 9. Agent Prompt Guide

### Quick Color Reference

* Primary CTA: Vercel Black (`#171717`)
* Background: Pure White (`#ffffff`)
* Heading text: Vercel Black (`#171717`)
* Body text: Gray 600 (`#4d4d4d`)
* Border (shadow): `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`
* Link: Link Blue (`#0072f5`)
* Focus ring: Focus Blue (`hsla(212, 100%, 48%, 1)`)

### Example Component Prompts

* "Create a hero section on white background. Headline at 48px Geist weight 600, line-height 1.00, letter-spacing -2.4px, color #171717. Subtitle at 20px Geist weight 400, line-height 1.80, color #4d4d4d. Dark CTA button (#171717, 6px radius, 8px 16px padding) and ghost button (white, shadow-border rgba(0,0,0,0.08) 0px 0px 0px 1px, 6px radius)."
* "Design a card: white background, no CSS border. Use shadow stack: rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px. Radius 8px. Title at 24px Geist weight 600, letter-spacing -0.96px. Body at 16px weight 400, #4d4d4d."
* "Build a pill badge: #ebf5ff background, #0068d6 text, 9999px radius, 0px 10px padding, 12px Geist weight 500."
* "Create navigation: white sticky header. Geist 14px weight 500 for links, #171717 text. Dark pill CTA 'Start Deploying' right-aligned. Shadow-border on bottom: rgba(0,0,0,0.08) 0px 0px 0px 1px."
* "Design a workflow section showing three steps: Develop (text color #0a72ef), Preview (#de1d8d), Ship (#ff5b4f). Each step: 14px Geist Mono uppercase label + 24px Geist weight 600 title + 16px weight 400 description in #4d4d4d."

### Iteration Guide


1. Always use shadow-as-border instead of CSS border — `0px 0px 0px 1px rgba(0,0,0,0.08)` is the foundation
2. Letter-spacing scales with font size: -2.4px at 48px, -1.28px at 32px, -0.96px at 24px, normal at 14px
3. Three weights only: 400 (read), 500 (interact), 600 (announce)
4. Color is functional, never decorative — workflow colors (Red/Pink/Blue) mark pipeline stages only
5. The inner `#fafafa` ring in card shadows is what gives Vercel cards their subtle inner glow
6. Geist Mono uppercase for technical labels, Geist Sans for everything else


