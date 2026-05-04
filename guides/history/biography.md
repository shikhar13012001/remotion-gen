# Guide: History — Biography

## Identity

Intimate, revelatory, precise. The feeling of reading the most important chapter of a life
and understanding for the first time why this person changed everything — or nothing.
Reference: LEMMiNO documentary style, applied to a single human subject.

The subject is never a saint and never a villain. They are a person shaped by forces
larger than themselves, making choices with consequences they couldn't fully see.

Accent color: `#c8a96e` — aged gold. Antiquity, timelines, the weight of a life.


---

## Backgrounds

**BgDeepField** — default for narrative sentences
Use for: formative years, decision points, character-building context.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgFlare** — for the turning point and the legacy
Use for: hook (who this person was at their peak), the moment everything changed.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare fradarme={frame} startFrame={startFrame} />
```

**BgSignal** — for biographical statistics
Use for: years in power, battles won/lost, economic impact, population reached.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```


---

## Background Image Priority

* **Priority 1** — `guides/history/bg/<subject-slug>.png` or `guides/history/bg/default.png`
* **Priority 2** — `public/bg-image.png`
* **Priority 3** — Programmatic BgDeepField / BgFlare / BgSignal

Copy to `public/bg-image.png`, animate with Ken Burns:

```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.07], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.55) brightness(0.4)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)" }} />
```


---

## Typography

```typescript
TOKEN.serif  // The subject's defining actions and their consequences
TOKEN.sans   // Biographical context, historical setting, supporting facts
TOKEN.mono   // Dates, titles, positions held, locations
```

Font sizes:

* Massive stat: 160px serif 700
* Display: 72–80px serif 700
* Body: 36–42px sans 300
* Date/title label: 16–20px mono uppercase

```typescript
TOKEN.white   // defining-moment sentences
TOKEN.dim     // biographical context, background
// Accent (#c8a96e gold): subject's name in highlight, key dates, defining numbers
```


---

## Components

### KineticText

```tsx
<KineticText
  text="By 23, she had already changed the course of the war."
  accentWords={["23"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — biographical coordinates

```tsx
<Stamp label="Genghis Khan · 1162–1227 · Founder, Mongol Empire" frame={frame} startFrame={startFrame} />
```


---

## Scene Templates

### TplStatCallout — the biographical number that defines the scale

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 24000000,
  suffix: " km²",
  label: "territory ruled at peak",
  context: "the largest contiguous empire in history",
}} frame={frame} startFrame={startFrame} />
```

### TplTimeline — the life's arc, the key decisions

```tsx
<TplTimeline data={{
  type: "timeline",
  events: [
    { time: "1162", event: "Born Temüjin, son of a minor chieftain", detail: "Steppe of Mongolia" },
    { time: "1206", event: "Proclaimed Genghis Khan", detail: "Unified all Mongol tribes" },
    { time: "1227", event: "Death during Jin campaign", detail: "Cause unknown" },
  ],
}} frame={frame} startFrame={startFrame} />
```

### TplEditorialHeadline — the verdict on the life

### TplTextDominant — the moment of transformation, stated plainly


---

## Script Voice Rules

* Open with the defining action, not the birth year: "He burned his father's murderers. He was nine." not "Born in 1162…"
* The subject must be a person, not a title — emotions, decisions, failures
* The TURN is the moment the subject's trajectory changed irreversibly
* The REVEAL is the scale of the consequence — what the life actually cost or built
* "breathe" beats at death or transformation: "She never returned." / "He died alone."
* Close on legacy: what persists, what was lost, what we inherit


---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (the defining action or the defining moment)
beat = "build"   → TplTextDominant or TplTimeline (biographical arc)
beat = "turn"    → TplEditorialHeadline (the moment the life pivoted)
beat = "reveal"  → TplStatCallout (the scale of the consequence)
beat = "breathe" → TplTextDominant (one biographical fact, alone on screen)
beat = "close"   → TplEditorialHeadline (the legacy, the verdict)
dataValue != null → TplStatCallout (always)
```


---

## Distribution Rules

For a 10–18 sentence biography video:

* At least 1 `TplTimeline` — a life has a timeline
* At least 2 `TplStatCallout` — the scale of the impact
* At least 3 `TplEditorialHeadline` — hook, turning point, close
* At least 2 `TplTextDominant` for intimate moments


