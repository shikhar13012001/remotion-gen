# Guide: Geopolitics

## Identity

Cold, strategic, consequential. The feeling of a classified briefing delivered without euphemism.
Reference: LEMMiNO × Wendover Productions. Not opinion. Power and its mechanisms.

Map, number, consequence — that's the editorial logic of geopolitics.
Every scene either shows where power is, how it moves, or what it costs.

Accent color: `#90a4ae` — steel blue. Borders, power, cold logic.

---

## Backgrounds

**BgDeepField** — default for narration
Use for: historical context, policy explanations, power dynamics.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgSignal** — for maps, data, military strength comparisons
Use for: territorial data, troop counts, GDP comparisons, resource flows.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```

**BgFlare** — for crises, hook, decisive moments
Use for: the outbreak of conflict, sanctions, the collapse of a state.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```

---

## Background Image Priority

- **Priority 1** — `guides/geopolitics/bg/<topic-slug>.png` or `guides/geopolitics/bg/default.png`
- **Priority 2** — `public/bg-image.png`
- **Priority 3** — Programmatic BgDeepField / BgSignal / BgFlare

Copy to `public/bg-image.png`, animate with Ken Burns:
```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.45) brightness(0.38)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%)" }} />
```

---

## Typography

```typescript
TOKEN.serif  // Power-verdict statements, casualty counts, territorial claims
TOKEN.sans   // Policy explanation, strategic context, economic data
TOKEN.mono   // Country codes, treaty names, resolution numbers, dates
```

Font sizes:
- Massive stat: 160px serif 700
- Display: 72–80px serif 700
- Body: 36–42px sans 300
- Treaty/date label: 16–20px mono uppercase

```typescript
TOKEN.white   // verdict sentences, territorial numbers
TOKEN.dim     // explanatory narration
// Accent (#90a4ae steel blue): country names, strategic numbers, key actors in highlight
```

---

## Components

### KineticText

```tsx
<KineticText
  text="Forty percent of the world's oil passes through one strait."
  accentWords={["forty percent"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — treaty / resolution labels

```tsx
<Stamp label="UN Resolution 678 · November 29, 1990" frame={frame} startFrame={startFrame} />
```

---

## Scene Templates

### TplStatCallout — troop counts, territory, economic leverage

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 40,
  suffix: "%",
  label: "of global oil passes through the Strait of Hormuz",
  context: "25 million barrels per day",
}} frame={frame} startFrame={startFrame} />
```

### TplFlowDiagram — power chains, escalation sequences, sanction mechanisms

### TplTimeline — conflict timelines, diplomatic sequences

### TplEditorialHeadline — strategic verdicts, the consequences of inaction

### TplTextDominant — the blunt geopolitical reality stated once

---

## Script Voice Rules

- Name the actors and their interests, not abstractions: "Russia needed a warm-water port" not "geopolitical considerations"
- The TURN is the moment the strategic calculation changed, or the miscalculation that triggered consequences
- The REVEAL shows what the real leverage is — the resource, the treaty clause, the demographic reality
- Never take a side — state interests and consequences, let the viewer draw conclusions
- "breathe" beats after casualty numbers or territorial losses: "60,000 square kilometres." / "Gone."

---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (the power reality stated immediately)
beat = "build"   → TplStatCallout or TplTextDominant (accumulate strategic facts)
beat = "turn"    → TplFlowDiagram or TplEditorialHeadline (the mechanism, the calculation)
beat = "reveal"  → TplStatCallout (the real leverage or cost)
beat = "breathe" → TplTextDominant (one territory number or casualty count)
beat = "close"   → TplEditorialHeadline (the strategic reality after all is said)
dataValue != null → TplStatCallout (always)
```

---

## Distribution Rules

For a 10–18 sentence geopolitics video:
- At least 1 `TplFlowDiagram` — explain the mechanism or the alliance structure
- At least 2 `TplStatCallout` — territory, troops, or economic figures
- At least 1 `TplTimeline` for diplomatic or conflict chronology
- At least 2 `TplTextDominant` for editorial weight between data scenes
