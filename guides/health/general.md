# Guide: Health & Medicine

## Identity

Human, precise, sobering. The feeling of a medical report being translated into plain language.
Reference: LEMMiNO × medical journalism. Not fear-mongering. Empirical clarity.

The body is the subject. Numbers are lives. Mechanisms are not abstract — they are happening
inside someone right now. The tone treats the viewer as capable of understanding complexity.

Accent color: `#66bb6a` — green. Biology, growth, the tension between life and illness.


---

## Backgrounds

**BgDeepField** — default for narration
Use for: mechanism explanations, epidemiological context, personal stories.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgSignal** — for clinical data
Use for: mortality rates, trial results, statistical comparisons.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```

**BgFlare** — for paradigm-shift moments
Use for: hook (the scale of the problem), major reveals, the discovery.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```


---

## Background Image Priority

* **Priority 1** — `guides/health/bg/<topic-slug>.png` or `guides/health/bg/default.png`
* **Priority 2** — `public/bg-image.png`
* **Priority 3** — Programmatic BgDeepField / BgSignal / BgFlare

Copy to `public/bg-image.png`, animate with Ken Burns:

```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.07], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.5) brightness(0.38)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)" }} />
```


---

## Typography

```typescript
TOKEN.serif  // Mortality numbers, discovery statements, verdict sentences
TOKEN.sans   // Mechanism explanations, clinical context, symptom descriptions
TOKEN.mono   // Drug names, gene labels, trial IDs, dosage units
```

Font sizes:

* Massive stat: 160px serif 700
* Display: 72–80px serif 700
* Body: 36–42px sans 300
* Clinical label: 16–20px mono uppercase

```typescript
TOKEN.white   // primary facts, headline sentences
TOKEN.dim     // mechanism narration, supporting evidence
// Accent (#66bb6a green): survival rates, discovery names, key numbers in highlight
```


---

## Components

### KineticText

```tsx
<KineticText
  text="One in eight women will develop breast cancer in her lifetime."
  accentWords={["one in eight"]}
  fontSize={42}
  fontFamily={TOKEN.sans}
  fontWeight={300}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — clinical reference labels

```tsx
<Stamp label="WHO · 2023 Global Cancer Report" frame={frame} startFrame={startFrame} />
```


---

## Scene Templates

### TplStatCallout — survival rates, mortality, prevalence

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 98,
  suffix: "%",
  label: "5-year survival rate",
  context: "when caught at Stage 1",
}} frame={frame} startFrame={startFrame} />
```

### TplFlowDiagram — biological mechanisms, treatment pathways

```tsx
<TplFlowDiagram data={{
  type: "flow_diagram",
  nodes: ["Virus enters cell", "Hijacks replication", "Cell produces copies", "Immune response triggered", "Inflammation"],
  style: "arrow_chain",
}} frame={frame} startFrame={startFrame} />
```

### TplTimeline — discovery history, treatment evolution

### TplEditorialHeadline — the scale of the problem, paradigm shifts

### TplTextDominant — the human cost stated plainly


---

## Script Voice Rules

* Lead with the human scale: not the pathogen, but what it does to people
* Always pair a percentage with its absolute number and its human equivalent
* The TURN is the mechanism that makes the disease worse than expected, or the treatment that changed everything
* "breathe" beats work at the moment of mortality: "Seven million dead." / "Still no cure."
* Close on what has changed or what the viewer can understand that they couldn't before


---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (the scale of the problem)
beat = "build"   → TplStatCallout or TplTextDominant (accumulate clinical facts)
beat = "turn"    → TplFlowDiagram (the mechanism, the complication)
beat = "reveal"  → TplStatCallout (the actual mortality / survival rate / discovery)
beat = "breathe" → TplTextDominant (one number, maximum negative space)
beat = "close"   → TplEditorialHeadline (what we now know, or what we still don't)
dataValue != null → TplStatCallout (always)
```


---

## Distribution Rules

For a 10–18 sentence health video:

* At least 3 `TplStatCallout` — health is statistics
* At least 1 `TplFlowDiagram` — explain the mechanism
* At least 2 `TplTextDominant` for emotional pacing
* `TplTimeline` for any discovery/treatment history spanning multiple decades


