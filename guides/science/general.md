# Guide: Science

## Identity

Clinical, precise, awe-inducing. The feeling of a paper abstract becoming vivid.
Reference: Kurzgesagt meets LEMMiNO. Not a lecture. Not a vlog.

Every frame must carry explanatory weight. Numbers are visual events, not data points.
The tone is confident certainty — not wonder at the unknown, but revelation of the known.

Accent color: `#4fc3f7` — cyan. Data, precision, the future.


---

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


---

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


---

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


---

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


---

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


---

## Script Voice Rules

* Lead with the phenomenon, not the history: "Light bends. Mass warps space." not "In 1915, Einstein published…"
* Scale shifts are cinematic: move from human scale → planetary → cosmic → subatomic
* Numbers require context: never leave a large number without a comparison
* Mechanism before implication: explain the mechanism first, then its consequence
* "breathe" beats work well at scale transitions: "One photon." / "Absolute zero."


---

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


---

## Distribution Rules

For a 10–18 sentence science video:

* At least 3 `TplStatCallout` scenes — science is numbers
* At least 1 `TplFlowDiagram` — explain a mechanism, not just a fact
* At least 2 `TplTextDominant` for breathing room at scale shifts
* No more than 3 consecutive `TplEditorialHeadline` or narration scenes


