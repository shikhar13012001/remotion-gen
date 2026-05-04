# Guide: Space & Astronomy

## Identity

Vast, humbling, precise. The feeling of staring at something incomprehensibly large
and suddenly understanding exactly what you're looking at.
Reference: LEMMiNO × Carl Sagan × a physics textbook with great cinematography.

Scale is the narrative engine. Every scene either increases or contextualises the scale.
The tone is awe grounded in fact — never mysticism, always mechanism.

Accent color: `#ce93d8` — violet. Cosmos, speculation, the edge of the known.

---

## Backgrounds

**BgDeepField** — default for most scenes
Drifting blobs on near-black — evokes deep space. Use for: distances, ages, narration.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgFlare** — for scale-rupture moments
Use for: hook, the scale revelation, impact events (supernovae, collisions).

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```

**BgSignal** — for orbital mechanics, data
Use for: mission timelines, distance tables, planetary comparison.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```

---

## Background Image Priority

- **Priority 1** — `guides/space/bg/<topic-slug>.png` or `guides/space/bg/default.png`
- **Priority 2** — `public/bg-image.png`
- **Priority 3** — Programmatic BgDeepField / BgFlare / BgSignal

Copy to `public/bg-image.png`, animate with Ken Burns:
```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.1], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.6) brightness(0.3)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)" }} />
```

---

## Typography

```typescript
TOKEN.serif  // Scale numbers, distances, ages — the monumental facts
TOKEN.sans   // Mechanism explanations, mission detail, context
TOKEN.mono   // Mission designations, coordinates, instrument names, wavelengths
```

Font sizes:
- Massive stat: 160px serif 700 — for distances and ages
- Display: 72–80px serif 700
- Body: 36–42px sans 300
- Mission label: 16–20px mono uppercase

```typescript
TOKEN.white   // primary facts
TOKEN.dim     // contextual narration
// Accent (#ce93d8 violet): key distances, mission names, discovery names in highlight
```

---

## Components

### KineticText

```tsx
<KineticText
  text="Voyager 1 is now 23 billion kilometres from Earth."
  accentWords={["23 billion kilometres"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — mission / observation labels

```tsx
<Stamp label="Voyager 1 · Launched September 5, 1977" frame={frame} startFrame={startFrame} />
```

---

## Scene Templates

### TplStatCallout — distances, ages, temperatures, masses

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 13800000000,
  suffix: " years",
  label: "since the Big Bang",
  context: "13.8 billion years ago",
}} frame={frame} startFrame={startFrame} />
```

### TplTimeline — mission chronology, cosmic event sequences

```tsx
<TplTimeline data={{
  type: "timeline",
  events: [
    { time: "T+0",      event: "Apollo 11 launch", detail: "Kennedy Space Center" },
    { time: "T+76h",    event: "Lunar orbit insertion", detail: "238,000 km from Earth" },
    { time: "T+102h",   event: "Eagle lands", detail: "Sea of Tranquility" },
  ],
}} frame={frame} startFrame={startFrame} />
```

### TplFlowDiagram — orbital mechanics, stellar evolution stages

### TplEditorialHeadline — scale revelations, paradigm shifts

### TplTextDominant — the incomprehensible stated simply

---

## Script Voice Rules

- Scale shifts are the narrative — lead small, cut to cosmic, return to human
- Every large number needs a comparison: "1 billion km — wider than 700 Earths laid end to end"
- Use "breathe" beats at the scale transition: "Nothing." / "For a billion years."
- The TURN in space stories is often a discovery that changed what we thought we knew
- Mission beats: name it, its target, the single most important thing it found
- Close by returning to the human frame: what this means for us, here, now

---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (scale stated at full force)
beat = "build"   → TplStatCallout or TplTextDominant (stack the distances/ages)
beat = "turn"    → TplEditorialHeadline or TplFlowDiagram (the discovery or mechanism)
beat = "reveal"  → TplStatCallout (the number that changes everything)
beat = "breathe" → TplTextDominant (one cosmic fact, nothing else)
beat = "close"   → TplEditorialHeadline (back to the human, reframed by the cosmic)
dataValue != null → TplStatCallout (always)
```

---

## Distribution Rules

For a 10–18 sentence space video:
- At least 3 `TplStatCallout` — space is scale, scale is numbers
- At least 1 `TplTimeline` for mission or discovery sequences
- At least 2 `TplTextDominant` for scale-shift breathing room
- BgDeepField on most narration scenes — it evokes deep space naturally
