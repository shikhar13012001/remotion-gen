# Guide: Philosophy & Society

## Identity

Contemplative, precise, unsettling. The feeling of an argument you cannot refute
but aren't sure you want to accept.
Reference: LEMMiNO × Philosophy Tube × a well-structured journal paper.

The tone is neither preaching nor neutral — it presents a framework and lets it do its work.
Every sentence either builds the argument or demolishes an assumption.

Accent color: `#bcaaa4` — warm grey. Abstraction, contemplation, earned uncertainty.

---

## Backgrounds

**BgDeepField** — default for most scenes
Use for: conceptual build-up, argument construction, historical grounding.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgFlare** — for the central paradox or the paradigm-shift moment
Use for: hook (the contradiction), the reveal (the argument's payoff).

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```

**BgSignal** — for empirical data underpinning the argument
Use for: psychological experiment results, social statistics, research findings.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```

---

## Background Image Priority

- **Priority 1** — `guides/philosophy/bg/<topic-slug>.png` or `guides/philosophy/bg/default.png`
- **Priority 2** — `public/bg-image.png`
- **Priority 3** — Programmatic BgDeepField / BgFlare / BgSignal

Copy to `public/bg-image.png`, animate with Ken Burns:
```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.35) brightness(0.35)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.72) 100%)" }} />
```

---

## Typography

```typescript
TOKEN.serif  // The central claim, the argument's conclusion, philosophical terms
TOKEN.sans   // Supporting reasoning, empirical grounding, examples
TOKEN.mono   // Philosopher names, publication years, experiment labels
```

Font sizes:
- Massive statement: 80–96px serif 700 — for the central thesis, one idea per frame
- Display: 60–72px serif 700
- Body: 36–42px sans 300
- Attribution: 16–20px mono uppercase

```typescript
TOKEN.white   // the thesis, the central claim
TOKEN.dim     // supporting argument, qualification
// Accent (#bcaaa4 warm grey): key philosophical terms, thinker names in highlight
```

---

## Components

### KineticText

```tsx
<KineticText
  text="Every choice you make was determined before you were born."
  accentWords={["determined"]}
  fontSize={52}
  fontFamily={TOKEN.serif}
  fontWeight={700}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — philosophical attribution

```tsx
<Stamp label="Hume · An Enquiry Concerning Human Understanding · 1748" frame={frame} startFrame={startFrame} />
```

---

## Scene Templates

### TplEditorialHeadline — the argument's claims and paradoxes

Use most for philosophy. Each claim should make the viewer stop.

```tsx
<TplEditorialHeadline data={{
  type: "editorial_headline",
  stamp_label: "Trolley Problem · Philippa Foot · 1967",
  line1: "Five people will die.",
  line2: "Unless you act.",
  highlight_line: "But acting makes you responsible.",
  subtext: "The difference between killing and letting die has never been satisfactorily resolved.",
}} frame={frame} startFrame={startFrame} />
```

### TplStatCallout — empirical research underpinning the argument

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 95,
  suffix: "%",
  label: "of people said they would pull the lever",
  context: "but only 68% said they would push the man",
}} frame={frame} startFrame={startFrame} />
```

### TplFlowDiagram — argument structure, logical chains, dilemmas

```tsx
<TplFlowDiagram data={{
  type: "flow_diagram",
  nodes: ["If free will exists", "Then choices could be otherwise", "But causes determine outcomes", "Therefore choices could not be otherwise", "Contradiction"],
  style: "arrow_chain",
}} frame={frame} startFrame={startFrame} />
```

### TplTextDominant — the central paradox, stated alone

### TplTimeline — history of an idea across philosophers and decades

---

## Script Voice Rules

- Open with the paradox or the central tension, not the definition: "You cannot choose not to choose." not "Free will is a philosophical concept…"
- Each sentence should be the next step of the argument, not just adjacent context
- The TURN is the moment the intuitive answer is shown to be insufficient
- The REVEAL is the reframing — what we learn when we take the argument seriously
- "breathe" beats work at the pivot: "That's the problem." / "Both are true."
- Close by showing the implication for how the viewer lives, not just what the philosophers said

---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (the paradox, stated sharply)
beat = "build"   → TplTextDominant or TplEditorialHeadline (build the argument)
beat = "turn"    → TplFlowDiagram or TplEditorialHeadline (the insufficiency of the intuition)
beat = "reveal"  → TplEditorialHeadline or TplStatCallout (the reframe)
beat = "breathe" → TplTextDominant (the pause that lets the argument land)
beat = "close"   → TplEditorialHeadline (the implication for living)
dataValue != null → TplStatCallout (empirical data backing the argument)
```

---

## Distribution Rules

For a 10–18 sentence philosophy video:
- At least 4 `TplEditorialHeadline` — the argument is the visual
- At least 1 `TplFlowDiagram` — make the logical structure visible
- At least 3 `TplTextDominant` — contemplation requires pause
- `TplStatCallout` only when empirical research is used to ground the claim
