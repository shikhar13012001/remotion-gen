# Guide: History Documentary

## Identity

Dark, editorial, precise. Every frame teaches something.
The feeling: classified documents being declassified in real time.
Reference: LEMMiNO. Not social media. Not a vlog.

When someone watches this, they should feel like they're reading a well-researched article that moves. The typography does the work. The backgrounds are atmosphere, not decoration. Every word earns its frame.


---

## Backgrounds

Three backgrounds are available. Pick based on the emotional register of the scene:

**BgDeepField** — default for most scenes
Two slow-drifting royal-blue blobs on near-black. Subtle 48px grid. Strong vignette.
Use for: narration, context-setting, editorial statements.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgSignal** — for data and technical content
Tight grid, clinical, colder. Use for: numbers, timelines, flow diagrams, cause-effect chains.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```

**BgFlare** — for reveals and impact moments
Circle geometry, strong vignette, dramatic. Use for: the hook scene, major reveal sentences, section breaks.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```

---

## Background Image Priority

Before reaching for a programmatic background, check for static images. Use this priority order:

### Priority 1 — Guide-specific background (`guides/history/bg/`)

Place topic- or category-specific background images here:

```
guides/history/bg/
├── default.png         ← general history/documentary feel
├── wartime.png         ← conflict and war topics
├── archive.png         ← archival/research topics
└── <topic-slug>.png    ← one image per specific topic (optional)
```

In Remotion, static files must live inside `public/`. Before rendering, copy your
preferred guide image to `public/bg-image.png`:

```bash
# Example: set the background for this render
cp guides/history/bg/default.png public/bg-image.png
```

Then reference it in scene components using Remotion's `staticFile()`:

```tsx
import { Img, staticFile } from "remotion";

// Inside a scene component — Ken Burns motion via interpolate()
<Img
  src={staticFile("bg-image.png")}
  style={{
    position: "absolute", inset: 0,
    width: "100%", height: "100%",
    objectFit: "cover",
    filter: "saturate(0.65) brightness(0.45)",
    transform: `scale(${imgScale})`,         // Ken Burns — never static
    transformOrigin: "center center",
  }}
/>
```

Apply a dark scrim so text always reads:

```tsx
{/* Scrim — always on top of the image */}
<div style={{
  position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)",
}} />
```

### Priority 2 — Generic fallback (`public/bg-image.png`)

If no guide-specific image exists, `public/bg-image.png` is the catch-all fallback.
This file is already present in the repository and safe to use immediately.
Same usage pattern as Priority 1 — identical `<Img>` code.

### Priority 3 — Programmatic background (generated in code)

Use `BgDeepField`, `BgSignal`, or `BgFlare` only when:
- No static image exists in `guides/<category>/bg/`
- No `public/bg-image.png` is present or appropriate
- The scene explicitly benefits from a generated (animated) background

**Decision table:**

| Situation | Background to use |
|---|---|
| `guides/history/bg/<topic>.png` exists | Use it (Priority 1) |
| Only `public/bg-image.png` exists | Use it (Priority 2) |
| Stat/data scene, no image needed | `BgSignal` (Priority 3) |
| Hook/reveal, dramatic moment | `BgFlare` (Priority 3) |
| Everything else | `BgDeepField` (Priority 3) |

**Never** render a static, motionless image — always apply Ken Burns via `interpolate()`.


---

## Typography

Three font roles. Never mix them within a single text element.

```typescript
import { TOKEN } from "@yt-shorts/video-renderer";

TOKEN.serif  // Georgia — display headlines, stat numbers, impact moments
TOKEN.sans   // Helvetica Neue — narration body text, captions, labels
TOKEN.mono   // Courier New — stamps, dates, classified-file labels, data
```

**Font sizes (1080×1920):**

* Massive (single stat): 160px serif 700
* Display (headline): 72–80px serif 700, `letterSpacing: "-0.025em"`
* Body (narration): 36–42px sans 300–400, `letterSpacing: "0.01em"`
* Label (stamp/date): 16–20px mono uppercase, `letterSpacing: "0.18em"`
* Caption (chart labels): 20–24px sans 300, `letterSpacing: "0.01em"`

**Color rules:**

```typescript
TOKEN.white      // headlines only — maximum weight
TOKEN.dim        // body text, facts — rgba(255,255,255,0.55)
TOKEN.faint      // tertiary, labels — rgba(255,255,255,0.18)
TOKEN.gold       // accent — use on 1–3 words per scene MAXIMUM
TOKEN.goldGlow   // rgba(200,169,110,0.20) — gold haze behind key elements
TOKEN.muted      // rgba(255,255,255,0.08) — borders, dividers
```


---

## Components

### KineticText — word-by-word reveal

The primary narration component. Words slide up from clipped containers with stagger.
Accent words render in TOKEN.gold, automatically bumped one weight heavier.

```tsx
import { KineticText, TOKEN } from "@yt-shorts/video-renderer";

<KineticText
  text="The explosion flattened 2,000 square kilometres of forest."
  accentWords={["2,000", "flattened"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

For headlines, switch to serif:

```tsx
<KineticText
  text="No crater. No meteorite. Nothing."
  accentWords={["Nothing"]}
  fontSize={80}
  fontFamily={TOKEN.serif}
  fontWeight={700}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — date/source label

Courier mono, uppercase, TOKEN.faint → TOKEN.gold on reveal.
Use for: dates, location labels, source attributions.

```tsx
import { Stamp, TOKEN } from "@yt-shorts/video-renderer";
<Stamp label="Siberia · June 30, 1908" frame={frame} startFrame={startFrame} />
```

### GoldDivider — typographic accent line

A 2px horizontal gold line that draws in. Use between headline tiers or above callout text.

```tsx
import { GoldDivider } from "@yt-shorts/video-renderer";
<GoldDivider frame={frame} startFrame={startFrame + 14} />
```

### Annotation — arrow + label pointing at an area

Use sparingly — one annotation per scene maximum. Points at a specific screen coordinate.

```tsx
import { Annotation } from "@yt-shorts/video-renderer";
// side="left": text right-aligned, arrow points right toward subject
// side="right": text left-aligned, arrow points left toward subject
<Annotation text="Impact epicentre" side="left" frame={frame} startFrame={startFrame} />
```


---

## Scene Templates

Eight templates available. Match template to sentence type:

### TplEditorialHeadline — impact statements, section breaks

Two large serif lines + gold italic highlight + subtext.
BgDeepField or BgFlare. Use for rhetorical questions, emotional beats, section transitions.

```tsx
import { TplEditorialHeadline } from "@yt-shorts/video-renderer";

<TplEditorialHeadline
  data={{
    type: "editorial_headline",
    stamp_label: "Tunguska · 1908",
    line1: "No crater.",
    line2: "No meteorite.",
    highlight_line: "Nothing made sense.",
    subtext: "Scientists found only flattened forest stretching for 60 kilometres.",
  }}
  frame={frame}
  startFrame={startFrame}
/>
```

### TplStatCallout — numbers and dates

Giant number slam-in with label below. BgSignal.
Use for: death tolls, areas, distances, dates, percentages.

```tsx
import { TplStatCallout } from "@yt-shorts/video-renderer";

<TplStatCallout
  data={{
    type: "stat_callout",
    value: 2150,
    label: "square kilometres flattened",
    context: "roughly the size of London",
    suffix: "km²",
  }}
  frame={frame}
  startFrame={startFrame}
/>
```

### TplTimeline — chronological sequences

Vertical list of dated events that build in one by one. BgSignal.
Use for: event sequences, chains of cause-and-effect.

```tsx
import { TplTimeline } from "@yt-shorts/video-renderer";

<TplTimeline
  data={{
    type: "timeline",
    events: [
      { time: "07:14", event: "Eyewitnesses report a column of bluish light", detail: "Brighter than the sun" },
      { time: "07:17", event: "Explosion — heard 1,000 km away", detail: "Windows shattered in Vanavara" },
      { time: "07:20", event: "Seismic waves detected worldwide", detail: "Equivalent to 10–15 megatons" },
    ],
  }}
  frame={frame}
  startFrame={startFrame}
/>
```

### TplFlowDiagram — cause-effect chains, processes

Nodes connected by arrows. BgSignal. Use for: theories, mechanisms, step-by-step logic.

```tsx
import { TplFlowDiagram } from "@yt-shorts/video-renderer";

<TplFlowDiagram
  data={{
    type: "flow_diagram",
    nodes: ["Comet enters atmosphere", "Air burst at 8–10 km altitude", "Thermal pulse ignites forest", "Pressure wave flattens trees outward"],
    style: "arrow_chain",
  }}
  frame={frame}
  startFrame={startFrame}
/>
```

### TplTextDominant — narration-only, no background imagery

Clean dark background, KineticText centered. BgDeepField.
Use for: transitional sentences, abstract concepts, voice-over emphasis.

```tsx
import { TplTextDominant } from "@yt-shorts/video-renderer";

<TplTextDominant
  data={{
    type: "text_dominant",
    lines: ["For decades, no one knew what hit."],
  }}
  frame={frame}
  startFrame={startFrame}
/>
```

### TplSplitPhotoData — photo + fact list

Upper half: image with gold overlay line. Lower half: headline + 2–3 bullet facts.
Use for: key figures, locations, artifacts where a photo adds documentary authority.

```tsx
import { TplSplitPhotoData } from "@yt-shorts/video-renderer";

<TplSplitPhotoData
  data={{
    type: "split_photo_data",
    image_query: "Leonid Kulik 1927 Tunguska expedition Siberia",
    headline: "First expedition: 1927",
    facts: [
      "Led by mineralogist Leonid Kulik",
      "Found no crater — only burnt, flattened trees",
      "Estimated 80 million trees destroyed",
    ],
  }}
  frame={frame}
  startFrame={startFrame}
/>
```

### TplSubjectCutout — person/subject feature

Full-frame image with annotation arrows and caption. Use for: key figures, eyewitnesses.

```tsx
import { TplSubjectCutout } from "@yt-shorts/video-renderer";

<TplSubjectCutout
  data={{
    type: "subject_cutout",
    image_query: "Semen Semyonov Vanavara eyewitness 1908 portrait",
    annotation: "Semen Semyonov — closest known survivor, 60 km from the epicentre",
  }}
  frame={frame}
  startFrame={startFrame}
/>
```

### TplTransitionWipe — section break

Flash + label wipe. Use to mark major narrative shifts. Max 1–2 per video.

```tsx
import { TplTransitionWipe } from "@yt-shorts/video-renderer";

<TplTransitionWipe
  data={{ type: "transition_wipe", label: "The Search for Answers" }}
  frame={frame}
  startFrame={startFrame}
/>
```


---

## Animation Engine

All timing uses `prog()` and `lerp()` from the engine — never CSS `transition` or `@keyframes`.

```typescript
import { E, lerp, prog } from "@yt-shorts/video-renderer";

// p = progress 0–1 from frame, starting at startFrame+delay, over 18 frames
const p = prog(frame, startFrame + delay, 18);

// Ease out: element slides up and fades in
const y  = lerp(p, 28, 0, E.out4);   // translateY: 28px → 0
const op = lerp(p, 0, 1, E.out3);    // opacity: 0 → 1

// Available easings:
// E.out3     — standard ease-out cubic (most elements)
// E.out4     — stronger ease-out (headlines, larger elements)
// E.out5     — very strong ease-out (stat numbers)
// E.outExpo  — exponential ease-out (snap-in, impact)
// E.inOut3   — symmetric ease (dividers, expanding lines)
// E.spring   — spring overshoot (numbers, emphasis elements)
```


---

## Composition Structure

A composition for a 12-sentence script typically has this shape:


1. **Hook** (sentence 0, beat=hook) → `TplEditorialHeadline` with BgFlare
2. **Build** sentences (beats=build) → `TplTextDominant` or `TplSplitPhotoData`
3. **Turn/Reveal** sentences → `TplStatCallout`, `TplTimeline`, `TplFlowDiagram`
4. **Breathe** sentence → `TplTextDominant` (short, single line)
5. **Close** sentence (beat=close) → `TplEditorialHeadline` with GoldDivider

Each scene is a `<Sequence from={offset} durationInFrames={dur}>` block.
Scene durations come from `sentence.suggested_duration_ms` converted to frames at 30fps.

```tsx
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { TOKEN, TplEditorialHeadline, TplStatCallout, TplTextDominant } from "@yt-shorts/video-renderer";
import type { ScriptPackage } from "../../lmstudio/index";

interface Props { script: ScriptPackage }

export default function GeneratedComposition({ script }: Props) {
  const frame = useCurrentFrame();
  // Map sentences to offsets
  let offset = 0;
  const scenes = script.sentences.map(s => {
    const dur = Math.round(s.suggested_duration_ms / (1000 / 30));
    const start = offset;
    offset += dur;
    return { s, start, dur };
  });

  return (
    <AbsoluteFill style={{ background: TOKEN.bgVoid }}>
      {scenes.map(({ s, start, dur }) => (
        <Sequence key={s.index} from={start} durationInFrames={dur}>
          {/* Route by beat */}
          {s.beat === "hook" || s.beat === "close"
            ? <TplEditorialHeadline data={{ type: "editorial_headline", line1: s.text, line2: "", highlight_line: "", subtext: "" }} frame={frame} startFrame={start} />
            : <TplTextDominant data={{ type: "text_dominant", lines: [s.text] }} frame={frame} startFrame={start} />
          }
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
```

The above is a minimal skeleton. Expand it: route by beat and content type, vary templates, add KineticText for accent words, add Stamp for dates, add TplStatCallout for numbers, add TplTimeline for sequences.


---

## Distribution Rules

For a 10–14 sentence video:

* At least 2 scenes must be `TplEditorialHeadline` (hook + at least one mid-point or close)
* At least 2 scenes must be data/structure templates (`TplStatCallout`, `TplTimeline`, or `TplFlowDiagram`)
* At least 1 scene must be `TplTextDominant` (breathing room)
* No more than 3 consecutive `TplSplitPhotoData` or `TplSubjectCutout`

Vary backgrounds: don't use the same background type more than 3 times in a row.


---

## What NOT to Do

* No color photos — if using TplSplitPhotoData, the image has a 0.75 saturation filter applied automatically
* No more than 3 gold accent words per scene
* Never hardcode hex values — use TOKEN.\* constants only
* No CSS `transition:` or `@keyframes:` — use `prog()` + `lerp()` only
* No rounded corners (`border-radius > 4px`) on any container
* No drop shadows on text — contrast is the effect
* No centered body text — left-aligned always (except TplTextDominant which centers single lines)
* No gradient text (WebkitBackgroundClip) — flat color only
* Don't use the same template for more than 3 consecutive scenes
* Never import from `../../src/` — only from `@yt-shorts/video-renderer`


