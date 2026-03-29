# [CLAUDE.md](http://CLAUDE.md) — Shorts Automation Pipeline

> Read this file fully at the start of every session. Every section is load-bearing.
> This is the single source of truth for architecture, visual identity, animation system, and code standards.
> There are no other [CLAUDE.md](http://CLAUDE.md) files in this project.


---

## 1. Project Overview

A fully automated short-form video generation pipeline. Given a topic brief, it produces a
publication-ready `.mp4` vertical video (1080×1920, 9:16) with narration audio, kinetic
typography, contextual visuals, data animations, and editorial motion — zero manual editing.

**Target aesthetic: LEMMiNO** (<https://www.youtube.com/@LEMMiNO>)
Dark. Editorial. Precise. Explanatory visuals that do work, not decoration.

### Full Pipeline

```
User Brief
  │
  ├─► LLM Call 1: Script Generation
  │     └─► ScriptPackage JSON (validated by Zod)
  │
  ├─► LLM Call 2: Visual Direction
  │     └─► SentenceVisualDirective[] (one per sentence, validated by Zod)
  │
  ├─► Image Engine (external): Fetch images per visual_query → local file paths
  │
  ├─► ElevenLabs: TTS audio per line → per-line .mp3 files
  │
  ├─► Remotion: Render video from SentenceVisualDirective[] manifest
  │     ├─► Scene Router: maps each directive to correct scene component
  │     ├─► Animation Registry: maps animation_spec.type to animation component
  │     └─► Output: raw .mp4 (video only)
  │
  └─► ffmpeg: Stitch audio + video → final.mp4
```

**Two LLM calls are always separate.** Script generation and visual direction require
different reasoning modes. Never combine them into one call.


---

## 2. Project Structure

```
repo/
├── CLAUDE.md                              ← You are here. Single file, no others.
├── package.json                           ← Single package (not a monorepo)
├── tsconfig.json                          ← TS config, strict mode
├── remotion.config.ts                     ← Remotion bundler config
├── pipeline.ts                            ← Full pipeline orchestrator
├── input.txt                              ← User topic brief
│
├── lmstudio/                              ← LLM orchestration (LM Studio / OpenAI-compat)
│   └── generate-script.ts                 ← Script generation + types (ContentMetadata,
│                                             AnimationType, AnimationSpec, SceneTemplate,
│                                             SentenceSceneDirective, ANIMATION_TYPES)
│
├── elevenlabs/                            ← TTS client
│   ├── generate.ts                        ← Audio generation + word-level timestamps
│   ├── audio/                             ← Generated audio artefacts
│   └── scripts/                           ← Intermediate script data
│       ├── example.txt
│       ├── metadata.json
│       └── output.txt
│
├── public/                                ← Static assets for Remotion
│   ├── timing.json                        ← Word timings JSON
│   ├── voice.mp3                          ← TTS audio file
│   └── clips/                             ← B-roll video clips
│
├── scripts/                               ← Dev/build utility scripts
│   ├── build-world-map.ts                 ← Generates world map topology
│   └── render-demo.ts                     ← Demo render script
│
└── src/                                   ← Remotion compositions + scene engine
    ├── index.ts                           ← registerRoot() entry point
    ├── Root.tsx                            ← <Composition> registration + calculateMetadata
    ├── compositions/
    │   └── ShortsComposition.tsx           ← Main composition: scenes, karaoke, overlays
    ├── context/
    │   └── PaletteContext.tsx              ← Palette context + usePalette() hook
    ├── schemas/
    │   └── animationSpec.zod.ts            ← Zod validation for animation specs
    ├── animations/
    │   ├── registry.ts                    ← Maps AnimationType → React component
    │   ├── types.ts                       ← AnimationComponentProps interface
    │   ├── Counter.tsx
    │   ├── LineChart.tsx
    │   ├── BarChart.tsx
    │   ├── ComparisonBars.tsx
    │   ├── PercentageFill.tsx
    │   ├── MapSpread.tsx
    │   ├── WorldHighlight.tsx
    │   ├── Timeline.tsx
    │   ├── FlowDiagram.tsx
    │   ├── SvgDrawPath.tsx
    │   ├── IconArrangement.tsx
    │   ├── ShapeMetaphor.tsx
    │   └── data/
    │       └── world-countries.json       ← GeoJSON for map animations
    └── utils/
        └── sentenceBoundaries.ts           ← Sentence boundary computation from word timings
```


---

## 3. Visual Identity & Brand System

### 3.1 The Core Aesthetic

Documentary editorial. The way a film editor designs title cards — not a social media designer.
Precision over decoration. Every visual element must earn its place by doing explanatory work.

**DO:**

* Near-black backgrounds — always `#0d0d0d`, never pure `#000000`
* High contrast text — near-white `#f0f0f0` on dark
* One accent color per video, held consistently throughout every scene
* Deliberate negative space — text breathes
* Typographic hierarchy that does the visual work
* Images at 75% saturation — text always reads over them

**NEVER:**

* Gradients as decoration (only if narratively motivated)
* Drop shadows on text (use contrast instead)
* Rounded pill shapes, cards with `border-radius > 4px`
* Any pattern that looks like a social media template
* More than two font weights in one scene
* Centered text on images (except `stat_callout`)
* Animations that call attention to themselves
* Pure white or pure black as background colors

### 3.2 Color System

Every video picks ONE accent color at script-generation time. It never changes mid-video.
The accent color appears on highlight words, chart lines, map fills, counter numbers,
timeline markers — everywhere. It is the video's identity.

```typescript
// lmstudio/generate-script.ts — accentColor is a free-form hex string
// Recommended palette for the LLM prompt:
export const ACCENT_PALETTE = {
  history:     "#c8a96e",  // aged gold — antiquity, timelines, archives
  finance:     "#f0c040",  // amber — money, warning, urgency
  science:     "#4fc3f7",  // cyan — data, precision, the future
  crime:       "#ef5350",  // red — danger, conflict, tension
  health:      "#66bb6a",  // green — biology, growth, wellness
  space:       "#ce93d8",  // violet — cosmos, speculation, awe
  geopolitics: "#90a4ae",  // steel blue — borders, power, cold logic
  philosophy:  "#bcaaa4",  // warm grey — abstraction, contemplation
} as const;

export type AccentKey = keyof typeof ACCENT_PALETTE;
```

Base palette (fixed, never varies):

```
background:    #0d0d0d
text:          #f0f0f0
accent_dim:    accent at 60% opacity — secondary labels, axis lines
overlay_scrim: rgba(0, 0, 0, 0.55) — behind text on top of images
chart_grid:    rgba(255, 255, 255, 0.08) — subtle grid lines in data viz
```

### 3.3 Typography

Two fonts only. Loaded via `staticFile()` — no external network calls during render.

| Role | Font | Weights | Usage |
|----|----|----|----|
| Display | **Syne** | 700, 800 | Headlines, stat numbers, highlight words |
| Body | **DM Sans** | 400, 500 | Narration text, chart labels, captions |

Never use Inter, Roboto, Arial, or system fonts as primary.
Fallback stack for emergencies only: `system-ui, sans-serif`

Size scale at 1080×1920:

```
massive:  108px  — single stat, key word, full-frame number
display:   72px  — sentence-level text_dominant scenes
body:      48px  — narration overlay on images
caption:   32px  — chart labels, supporting text, axis values
micro:     24px  — metadata, source attribution
```

Line height: `1.15` always.
Letter-spacing on display weight: `-0.02em`
Letter-spacing on body weight: `0`


---

## 4. Scene System

### 4.1 Six Scene Templates

Every sentence maps to exactly one. The LLM chooses using the decision tree in §4.2.

| Template | When to Use | Image? | Animation? |
|----|----|----|----|
| `fullbleed` | Narrative sentences with a clear visual subject | Yes | No |
| `text_dominant` | Rhetorical questions, emotional beats, transitions | No | No |
| `stat_callout` | Any sentence with a number, date, or measurable fact | Opt. | No |
| `animated_graphic` | Anything that can be shown rather than described | No | Yes |

**Mandatory distribution:**

* `text_dominant`: minimum 20% of scenes
* `animated_graphic`: minimum 15% of scenes
* No more than 3 consecutive `fullbleed` scenes without a break

### 4.2 Scene Selection Decision Tree (LLM applies this per sentence)

```
1. Can this be SHOWN better than photographed?
   (number, stat, comparison, geographic spread, sequence, flow, concept)
   → animated_graphic

2. Rhetorical question, emotional beat, or section transition?
   → text_dominant

3. Contains a number, date, or measurable claim?
   → stat_callout

4. Default
   → fullbleed (with specific visual_query)
```

### 4.3 Image Motion (Ken Burns) — for fullbleed, stat_callout

Every image moves. No static images, ever.

| Motion | Transform | Motivation |
|----|----|----|
| `slow_zoom_in` | scale 1.0 → 1.08 | Intimacy, reveal, narrowing focus |
| `slow_zoom_out` | scale 1.08 → 1.0 | Scale, context, widening perspective |
| `pan_left` | translateX 0 → -4% | Time passage, geographic left→right |
| `pan_right` | translateX -4% → 0% | Return, rewind, right→left movement |

Duration: full scene duration. Easing: `ease-in-out` via `interpolate()`.

### 4.4 Text Animation — all scenes

| Animation | Behavior | Default for |
|----|----|----|
| `word_by_word` | Words stagger in 2–3 frames apart, fade + Y+12→0 | All narration |
| `slam_in` | Scale 1.4→1.0, opacity 0→1, 6 frames | Stat numbers, impact |
| `line_fade` | Whole line fades over 12 frames | Chart labels, captions |
| `typewriter` | Characters reveal L→R, cursor blinks | Data, technical content |

Highlight words (1–3 per sentence):

* Rendered in `accent_color`
* Font weight bumped one level: regular→bold, bold→black
* Land 2 extra frames after surrounding words

### 4.5 Scene Transitions

```
hard_cut    — default, instant. Matches LEMMiNO's editorial rhythm.
crossfade   — 8 frames max. Only for emotional register shifts.
flash_white — 3 frames to white then cut. Only for major section breaks.
```

Never use dissolves, push wipes, or slides.


---

## 5. Animation System

### 5.1 Purpose

`animated_graphic` generates visuals in-code rather than fetching photographs.
The LLM outputs an `animation_spec` describing what to render. A component registry
maps `animation_spec.type` to the correct Remotion component.

Use it whenever content has structure that can be visualised: statistics, sequences,
comparisons, geographic data, process flows, abstract metaphors.

### 5.2 Core Types

```typescript
// lmstudio/generate-script.ts
export const ANIMATION_TYPES = [
  "counter",
  "line_chart",
  "bar_chart",
  "comparison_bars",
  "percentage_fill",
  "map_spread",
  "world_highlight",
  "timeline",
  "flow_diagram",
  "svg_draw_path",
  "icon_arrangement",
  "shape_metaphor",
] as const;

export type AnimationType = typeof ANIMATION_TYPES[number];

// lmstudio/generate-script.ts
export interface AnimationSpec {
  type: AnimationType;
  data: Record<string, unknown>;
  entry_animation: "build_in" | "slam" | "draw";
  duration_ms: number;
}
```

### 5.3 Animation Registry

```typescript
// src/animations/registry.ts
export const ANIMATION_REGISTRY: Record<AnimationType, ComponentType<AnimationComponentProps>> = {
  counter, line_chart, bar_chart, comparison_bars, percentage_fill,
  map_spread, world_highlight, timeline, flow_diagram,
  svg_draw_path, icon_arrangement, shape_metaphor,
};
```

Rules:

* Every `AnimationType` must have a registry entry — no gaps
* Unknown type at render time → fall back to `TextDominantScene`, never crash
* Never add to `ANIMATION_TYPES` without simultaneously adding component + registry entry

### 5.4 Animation Component Contract

```typescript
interface AnimationComponentProps {
  spec: AnimationSpec;
  startFrame: number;
  durationInFrames: number;
  palette: PaletteContextValue;
  fps: number;
}
```

All animation components must:

* Subtract `startFrame` from `useCurrentFrame()` internally
* Use `interpolate()` only — no CSS animations, no `@keyframes`
* Use `palette.accent` for primary elements, `palette.accent_dim` for secondary
* Use `palette.text` for all labels
* Have transparent background — `AnimatedGraphicScene` provides the dark bg

### 5.5 Data Schemas Per Animation Type

```typescript
counter:
  { value: number; prefix?: string; suffix?: string; decimals?: number }

line_chart:
  { points: number[]; labels: string[]; y_label?: string; highlight_drop?: boolean }

bar_chart:
  { items: Array<{ label: string; value: number }>; unit?: string; horizontal?: boolean }

comparison_bars:
  { items: Array<{ label: string; value: number; color?: string }>; unit?: string }

percentage_fill:
  { value: number; label: string; style?: "circle" | "bar" }

map_spread:
  { highlight_countries: string[];   // ISO 3166-1 alpha-3
    spread_order?: boolean; base_color?: string; highlight_color?: string }

world_highlight:
  { regions: Array<{ country: string; intensity: number }>; legend?: string }

timeline:
  { events: Array<{ date: string; label: string; sublabel?: string }>;
    direction: "horizontal" | "vertical" }

flow_diagram:
  { nodes: string[];
    connections?: Array<[number, number]>;
    style: "arrow_chain" | "tree" | "cycle" }

svg_draw_path:
  { path: string; stroke_width?: number; fill?: boolean }

icon_arrangement:
  { icons: string[];   // Phosphor icon names only — see §5.6
    layout: "scatter" | "grid" | "radial" | "stack";
    labels?: string[] }

shape_metaphor:
  { concept: string;
    style: "tower_vs_flat" | "shrinking" | "expanding" | "splitting" | "merging" | "filling" }
```

### 5.6 Icon Vocabulary (icon_arrangement only)

Use only Phosphor Icons. Reference by exact kebab-case name. Do not invent names.
If uncertain, use `shape_metaphor` instead.

```
Medical:  hospital, virus, person, heart, heartbeat, pill, syringe, dna, microscope
Finance:  bank, currency-dollar, trend-up, trend-down, chart-bar, coins, percent
Geo:      globe, map-pin, airplane, ship, map-trifold
Infra:    building, factory, bridge, house
Science:  atom, flask, lightning, fire, snowflake, thermometer
Learning: book, graduation-cap, pencil
Status:   warning, shield, lock, check-circle, x-circle, clock, timer
Motion:   arrow-right, arrow-up, arrow-down, arrow-left, arrows-out
```

### 5.7 Animation Selection Guide (LLM)

```
Single large number or statistic            → counter
Change over time, multiple data points      → line_chart
Multiple items compared                     → comparison_bars or bar_chart
Percentage or proportion                    → percentage_fill
Geographic spread or affected countries     → map_spread or world_highlight
Chronological sequence of events            → timeline
Cause-effect or step-by-step process        → flow_diagram
Custom drawn shape or emphasis element      → svg_draw_path
Abstract concept with symbolic icons        → icon_arrangement
Simple conceptual metaphor                  → shape_metaphor
```


---

## 6. Full SentenceSceneDirective Schema

```typescript
// lmstudio/generate-script.ts
export type SentenceSceneDirective = {
  scene_template:  SceneTemplate | "animated_graphic";
  //   SceneTemplate = "fullbleed" | "text_dominant" | "stat_callout"
  image_motion:    ImageMotion | null;   // null when scene_template === "animated_graphic"
  //   ImageMotion = "slow_zoom_in" | "slow_zoom_out" | "pan_left" | "pan_right" | "static"
  highlight_words: string[];             // 1–3 key words matched exactly to sentence words
  visual_query:    string | null;        // null when scene_template === "animated_graphic"
  animation_spec:  AnimationSpec | null; // non-null only when scene_template === "animated_graphic"
};
```

Visual query rules:

* Must be 4+ words — fewer words means too generic, validation rejects it
* Specific enough for a photo researcher to find exactly one image
* Include: subject + context + time period if relevant
* **Bad**: `"finance growth"` / **Good**: `"NYSE trading floor panic October 1987"`
* Always `null` for `text_dominant`, `animated_graphic`


---

## 7. LLM Prompts

Prompts are defined as string constants in `lmstudio/generate-script.ts`.

### 7.1 Visual-director prompt — art director persona:

```
You are an art director for a documentary short-form video series in the style of LEMMiNO.
Dark, editorial, precise. Every frame does explanatory work.

Your job: produce a JSON array of SentenceVisualDirective — one per sentence.
You are not picking templates. You are art directing every single frame.

SCENE SELECTION (apply in this order per sentence):
1. Can this be SHOWN rather than photographed? (number, stat, comparison, spread, sequence, flow)
   → animated_graphic with appropriate animation_spec.type
2. Rhetorical question, emotional beat, section transition? → text_dominant
3. Contains number, date, or measurable claim? → stat_callout
4. Default: fullbleed

DISTRIBUTION REQUIREMENTS:
- At least 20% of scenes must be text_dominant
- At least 15% of scenes must be animated_graphic
- No more than 3 consecutive fullbleed scenes

ACCENT COLOR:
Choose ONE for the entire video. Never change it. Every directive uses the same accent.
  history=#c8a96e  finance=#f0c040  science=#4fc3f7  crime=#ef5350
  health=#66bb6a   space=#ce93d8   geopolitics=#90a4ae  philosophy=#bcaaa4

ANIMATION SPEC (required for animated_graphic, null for all others):
type must be one of:
  counter, line_chart, bar_chart, comparison_bars, percentage_fill,
  map_spread, world_highlight, timeline, flow_diagram, svg_draw_path,
  icon_arrangement, shape_metaphor

Selection:
  Single large number → counter
  Change over time → line_chart
  Items compared → comparison_bars or bar_chart
  Percentage/proportion → percentage_fill
  Geographic spread → map_spread or world_highlight
  Event sequence → timeline
  Cause-effect/process → flow_diagram
  Custom drawn element → svg_draw_path
  Abstract concept + icons → icon_arrangement (Phosphor names only)
  Conceptual metaphor → shape_metaphor

VISUAL QUERY (null for animated_graphic, text_dominant):
Must be 4+ specific words. Brief a photo researcher, not a search engine.
Bad: "science lab" | Good: "CERN Large Hadron Collider tunnel blue rings 2008"

HIGHLIGHT WORDS: 1–3 per sentence. The kernel, not the whole idea.
Render in accent color, one weight heavier, 2 frames late.

IMAGE MOTION (fullbleed, stat_callout):
slow_zoom_in = intimacy | slow_zoom_out = scale | pan_left = forward time | pan_right = rewind

TRANSITIONS: hard_cut = default | crossfade = emotional shift | flash_white = section break

OUTPUT: Valid JSON array of SentenceVisualDirective[]. No markdown. No preamble. No explanation.
```

### 7.2 Validation Gate (`lmstudio/generate-script.ts`)

```typescript
function validateVisualQuery(query: string | null, template: string): void {
  const requiresQuery = ["fullbleed"].includes(template);
  if (requiresQuery && (!query || query.trim().split(/\s+/).length < 4)) {
    throw new Error(
      `visual_query "${query}" too generic for "${template}". Use 4+ specific words or switch to text_dominant.`
    );
  }
}

function warnDistribution(directives: SentenceVisualDirective[]): void {
  const total = directives.length;
  const td = directives.filter(d => d.scene_template === "text_dominant").length;
  const ag = directives.filter(d => d.scene_template === "animated_graphic").length;
  if (td / total < 0.20) console.warn(`text_dominant: ${td}/${total} — target ≥20%`);
  if (ag / total < 0.15) console.warn(`animated_graphic: ${ag}/${total} — target ≥15%`);
}
```


---

## 8. Remotion Architecture

### 8.1 Setup

```
Resolution: 1080 × 1920  |  FPS: 30  |  Duration: sum of directive duration_ms values
```

### 8.2 PaletteContext

```typescript
interface PaletteContextValue {
  background: string;
  text: string;
  accent: string;
  accent_dim: string;      // accent at 60% opacity
  chart_grid: string;      // rgba(255,255,255,0.08)
  overlay_scrim: string;   // rgba(0,0,0,0.55)
}
```

* Set once at `<ShortsComposition>` level, never changes mid-video
* All components consume via `usePalette()` hook
* Never pass palette as individual props
* Never hardcode any hex value in any component

### 8.3 Component Contracts

Every scene and animation component must:

* Subtract `startFrame` from `useCurrentFrame()` internally
* Use `interpolate()` exclusively — no CSS `transition`, no `@keyframes`
* Use `spring()` only for entry animations
* Consume all colors via `usePalette()`
* Be fully self-contained — no shared mutable state

### 8.4 KineticText

* Splits text into individual word spans, each with independent interpolation
* Stagger: 2–3 frames between words
* `highlight_words` matching: case-insensitive, trim-normalized
* Fonts via `staticFile()` only — never external URLs

### 8.5 MotionImage

* `object-fit: cover`, `width: 100%`, `height: 100%`
* `filter: saturate(0.75)` always applied
* Gradient scrim always: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)`
* Ken Burns via `interpolate()` on CSS transform
* Pre-fetched via Remotion's `prefetch()`

### 8.6 AnimatedGraphicScene (in ShortsComposition.tsx)

* Reads `animationType` → looks up in `src/animations/registry.ts`
* Unknown type → falls back to `TextDominantScene` content, never crashes
* Layout: animation in top 70% of frame, `KaraokeBlock` in bottom 30%
* Thin accent-color divider line (2px, 80px wide) between zones
* Background: solid `palette.background`

### 8.7 Scene Routing (in ShortsComposition.tsx)

Scene selection is handled inline within the main composition. Each body sentence is
routed to one of these scene components based on its `SentenceSceneDirective`:

```typescript
// src/compositions/ShortsComposition.tsx — scene components
FullbleedScene         // fullbleed — video background + karaoke at bottom
TextDominantScene      // text_dominant — dark bg, centered karaoke
StatCalloutScene       // stat_callout — giant number slam-in + karaoke below
AnimatedGraphicScene   // animated_graphic — animation top 70% + karaoke bottom 30%
```

Auto-detection fallback (`autoDetectTemplate`) assigns scenes when no LLM directive
is available: questions → `text_dominant`, sentences with numbers → `stat_callout`,
default → `fullbleed`. Unknown animation types fall back to `TextDominantScene`.


---

## 9. TypeScript & Code Standards

* `"strict": true` in all tsconfigs — no exceptions
* No `any` — use `unknown` with type guards
* ESM only — `"type": "module"`, imports use `.js` extensions
* Zod for all external data — LLM output, API responses, anything crossing package boundaries
* No default exports in library packages — named exports only (Remotion entry files excepted)
* No silent error swallowing — throw with context or return typed `Result<T, E>`
* No magic strings — all constants in `lmstudio/generate-script.ts`
* LLM prompts live as string constants in `lmstudio/generate-script.ts`

File naming:

```
PascalCase.tsx        — React / Remotion components
camelCase.ts          — utilities, services, hooks
kebab-case.test.ts    — tests
```


---

## 10. Absolute Prohibitions

* **Never hardcode hex values** in Remotion components — always `usePalette()`
* **Never use** `any`
* **Never use CSS** `transition` or `@keyframes` in Remotion — `interpolate()` and `spring()` only
* **Never use a generic** `visual_query` — if specificity fails, use `text_dominant`
* **Never add an** `AnimationType` without component + registry entry in the same commit
* **Never add a scene template** without updating: type, Zod schema, scene router, LLM prompt, and §4 of this file
* **Never combine the two LLM calls**
* **Never render a static image** — Ken Burns on everything
* **Never use Inter, Roboto, or Arial** as primary fonts
* **Never deploy** without `tsc --noEmit` passing across all packages


---

## 11. Adding a New Animation Type — Protocol


1. Add to `ANIMATION_TYPES` in `lmstudio/generate-script.ts`
2. Add data interface to `lmstudio/generate-script.ts` (AnimationSpec)
3. Add Zod schema to `src/schemas/animationSpec.zod.ts`
4. Build component in `src/animations/NewType.tsx`
5. Add to registry in `src/animations/registry.ts`
6. Add selection rule + data example to the prompt in `lmstudio/generate-script.ts`
7. Run `tsc --noEmit` — must pass before merging


---

## 12. Feature Change Checklist

Before starting:

- [ ] Schema change? → update `lmstudio/generate-script.ts` types + Zod + LLM prompt + all consumers
- [ ] New scene template? → update type in `lmstudio/generate-script.ts`, Zod, scene routing in `ShortsComposition.tsx`, LLM prompt, §4 of this file
- [ ] New animation type? → follow §11 protocol
- [ ] Visual style change? → update §3, prompt in `lmstudio/generate-script.ts`, `PaletteContext`

After implementation:

- [ ] `tsc --noEmit` passes with zero errors
- [ ] Zod validation passes on a test manifest
- [ ] No hardcoded colors: `grep -r '"#' src/compositions src/animations src/context` — only `PaletteContext.tsx` allowed
- [ ] Benchmark test passes (§13)


---

## 13. Benchmark Test

Run after any significant change:

**Topic**: `"The Tunguska Event, 1908"`

Expected:

* ≥2 `text_dominant` scenes
* ≥1 `stat_callout` (year or explosion yield)
* ≥2 `animated_graphic` scenes — `timeline` for the event sequence + `counter` for explosion yield or km²
* Accent: `#c8a96e` (history)
* `hard_cut` default — crossfades only where emotionally motivated
* Ken Burns on all images
* `word_by_word` on all narration sentences
* No two consecutive `fullbleed` scenes with the same `image_motion`
* `tsc --noEmit` passes

Any failure = system is broken. Do not ship.


---

## 14. Key Decisions Log

| Decision | Rationale |
|----|----|
| `animated_graphic` first in decision tree | Showing > describing. Animated data is more explanatory than stock photos. |
| Animation registry pattern | Decouples LLM output from implementation. New types don't touch existing code. |
| Registry fallback to `text_dominant` | Prevents render crashes when a type hasn't been built yet. |
| Two LLM calls always separate | Different reasoning modes. One call degrades both outputs. |
| Remotion over ffmpeg | React component model maps to JSON-driven scenes. Design iteration is faster. |
| One accent color per video | Consistency signals intentionality. The color becomes the video's identity. |
| `hard_cut` as default | Matches LEMMiNO's editorial pace. Crossfades read as soft/corporate. |
| `text_dominant` 20% minimum | Forces rhythm. Prevents non-stop image slideshow feel. |
| `animated_graphic` 15% minimum | Forces explanatory visuals. LLM defaults to images if unconstrained. |
| Palette via Context | Single source of truth. Prevents drift when refactoring component trees. |
| Prompts as `.txt` files | Prompts are a product artifact — version control visibility matters. |
| Phosphor icons only | Constrained vocabulary prevents hallucinated icon names. |
| 4-word minimum on `visual_query` | Enforces specificity at the validation layer, not just prompt layer. |
| Syne + DM Sans | Editorial weight without cliché. DM Sans neutral enough not to compete. |


