# Guide: Finance

## Identity

Cold, precise, consequential. The feeling of a trading floor at the edge of collapse.
Reference: Bloomberg documentary + LEMMiNO. Not a how-to guide. Not news.

Every number is a verdict. Every chart tells a story of winners and losers.
The tone is unsparing: state what happened, let the viewer feel the weight.

Accent color: `#f0c040` — amber gold. Money, warning, urgency.

---

## Backgrounds

**BgSignal** — default for most finance scenes
Clinical grid, tight. Use for: numbers, charts, data, market analysis.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```

**BgFlare** — for impact / hook moments
Use for: the opening statement, crash moments, paradigm shifts.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```

**BgDeepField** — for editorial / narrative sentences
Use for: backstory, consequence, the human cost.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

---

## Background Image Priority

- **Priority 1** — `guides/finance/bg/<topic-slug>.png` or `guides/finance/bg/default.png`
- **Priority 2** — `public/bg-image.png`
- **Priority 3** — Programmatic BgSignal / BgFlare / BgDeepField

Copy to `public/bg-image.png`, animate with Ken Burns:
```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.5) brightness(0.35)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)" }} />
```

---

## Typography

```typescript
TOKEN.serif  // Headlines, the single defining number, verdict statements
TOKEN.sans   // Narration, captions, chart labels, context
TOKEN.mono   // Ticker symbols, dates, percentage labels, index names
```

Font sizes:
- Massive stat: 160px serif 700
- Display: 72–80px serif 700
- Body: 36–42px sans 300
- Ticker/label: 16–20px mono uppercase, `letterSpacing: "0.18em"`

```typescript
TOKEN.white         // verdict sentences, major numbers
TOKEN.dim           // body text, market context
// Accent (#f0c040): percentage numbers, chart lines, key figures in highlight
```

---

## Components

### KineticText

```tsx
<KineticText
  text="The Dow fell 22 percent in a single day."
  accentWords={["22 percent"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — market labels

```tsx
<Stamp label="NYSE · October 19, 1987" frame={frame} startFrame={startFrame} />
```

---

## Scene Templates

### TplStatCallout — the number is the story
Whenever there is a percentage, index value, dollar amount, or date.

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 22.6,
  suffix: "%",
  label: "single-day market loss",
  context: "the largest one-day drop in Wall Street history",
}} frame={frame} startFrame={startFrame} />
```

### TplFlowDiagram — contagion, cause-effect, mechanisms
Use for: how a financial crisis spreads, feedback loops, policy transmission.

```tsx
<TplFlowDiagram data={{
  type: "flow_diagram",
  nodes: ["Subprime loans default", "MBS values collapse", "Banks lose capital", "Credit freezes", "GDP contracts"],
  style: "arrow_chain",
}} frame={frame} startFrame={startFrame} />
```

### TplTimeline — events with timestamps

### TplEditorialHeadline — verdict statements
"Nobody went to prison." / "The bailout was $700 billion."

### TplTextDominant — consequence moments
Short sentences that land after a devastating number.

---

## Script Voice Rules

- Lead with the outcome: "The bank had $0 on Friday. Monday it was gone." not "In 2008, Lehman Brothers…"
- Numbers carry the drama — let them breathe: "700 billion dollars." full stop.
- No moral commentary — state the mechanism and let the viewer feel it
- Use "breathe" beats right after the most damning number
- The TURN is always the moment someone knew and did nothing, or the mechanism that made it inevitable

---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (outcome stated immediately)
beat = "build"   → TplStatCallout or TplTextDominant (stack the evidence)
beat = "turn"    → TplEditorialHeadline (the mechanism or the betrayal)
beat = "reveal"  → TplStatCallout or TplFlowDiagram (the actual scale)
beat = "breathe" → TplTextDominant (one number, nothing else)
beat = "close"   → TplEditorialHeadline (the verdict, the consequence)
dataValue != null → TplStatCallout (always)
```

---

## Distribution Rules

For a 10–18 sentence finance video:
- At least 4 `TplStatCallout` — finance is a numbers story
- At least 1 `TplFlowDiagram` — show the contagion/mechanism
- At least 2 `TplTextDominant` for pressure-release after numbers
- Use `TplTimeline` for any sequence of market events with dates
