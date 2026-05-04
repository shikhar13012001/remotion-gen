# Guide: Crime

## Identity

Tense, atmospheric, methodical. The feeling of a case file being opened in a dark room.
Reference: True crime documentary + LEMMiNO. Not sensationalism. Forensic precision.

The tone is investigative: build evidence, reveal the mechanism, deliver the verdict.
Every visual earns its place by serving the investigation, not the spectacle.

Accent color: `#ef5350` — red. Danger, blood, the moment things went wrong.


---

## Backgrounds

**BgDeepField** — default for most scenes
Use for: narration, establishing facts, building the timeline.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgFlare** — for impact moments
Use for: hook, the crime itself, the arrest, the verdict.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```

**BgSignal** — for forensic data
Use for: statistics, body counts, timelines, cause-of-death sequences.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```


---

## Background Image Priority

* **Priority 1** — `guides/crime/bg/<topic-slug>.png` or `guides/crime/bg/default.png`
* **Priority 2** — `public/bg-image.png`
* **Priority 3** — Programmatic BgDeepField / BgFlare / BgSignal

Copy to `public/bg-image.png`, animate with Ken Burns:

```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.07], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.4) brightness(0.35)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)" }} />
```


---

## Typography

```typescript
TOKEN.serif  // Case-defining statements, victim counts, verdicts
TOKEN.sans   // Evidence narration, witness detail, timeline
TOKEN.mono   // Case numbers, dates, locations, evidence codes
```

Font sizes:

* Massive stat: 160px serif 700
* Display: 72–80px serif 700
* Body: 36–42px sans 300
* Evidence label: 16–20px mono uppercase

```typescript
TOKEN.white   // verdict sentences, names, defining numbers
TOKEN.dim     // evidence narration, secondary facts
// Accent (#ef5350 red): victim counts, key dates, suspect names in highlight
```


---

## Components

### KineticText

```tsx
<KineticText
  text="He was convicted on evidence found 22 years later."
  accentWords={["22 years"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — case file labels

```tsx
<Stamp label="Case No. 74-CR-0041 · Chicago, 1974" frame={frame} startFrame={startFrame} />
```


---

## Scene Templates

### TplTimeline — the sequence of events

Crime stories live in chronology. Use for: sequence of the crime, investigation steps.

```tsx
<TplTimeline data={{
  type: "timeline",
  events: [
    { time: "11:42 PM", event: "Last sighting", detail: "Seen leaving the bar" },
    { time: "2:14 AM",  event: "Body discovered", detail: "Industrial district, 3km away" },
    { time: "6 weeks later", event: "First arrest", detail: "Wrong suspect" },
  ],
}} frame={frame} startFrame={startFrame} />
```

### TplStatCallout — counts, sentences, durations

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 27,
  label: "years served",
  context: "for a crime he did not commit",
}} frame={frame} startFrame={startFrame} />
```

### TplFlowDiagram — investigation chains, cover-up mechanisms

### TplEditorialHeadline — verdicts and reveals

### TplTextDominant — the moment of realisation or injustice stated simply


---

## Script Voice Rules

* Begin with the crime itself or the injustice, not the backstory
* Never name the victim in the hook — build to it
* The TURN is always the moment the investigation went wrong, or the piece of evidence that changed everything
* The REVEAL is the actual perpetrator, the exoneration, or the systemic failure
* "breathe" beats land best after a victim count or a wrongful conviction duration: "Eighteen years." / "Never charged."
* Close on consequence: what changed, or what didn't


---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (crime stated immediately, viscerally)
beat = "build"   → TplTimeline or TplTextDominant (accumulate the investigation)
beat = "turn"    → TplEditorialHeadline (the moment the case broke or the cover-up began)
beat = "reveal"  → TplStatCallout or TplFlowDiagram (the truth, the scale of the injustice)
beat = "breathe" → TplTextDominant (one damning fact alone on screen)
beat = "close"   → TplEditorialHeadline (the verdict, the legacy, what remains unsolved)
dataValue != null → TplStatCallout (always)
```


---

## Distribution Rules

For a 10–18 sentence crime video:

* At least 1 `TplTimeline` — crime stories require chronology
* At least 2 `TplStatCallout` — victim counts, sentences, durations
* At least 2 `TplTextDominant` for atmospheric pressure-release
* No more than 3 consecutive image-backed scenes


