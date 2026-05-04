# Guide: History — Conflict

## Identity

Stark, unflinching, structured. The feeling of a war documentary that does not
look away from the cost, but refuses to sensationalise it.
Reference: LEMMiNO × The Why Files. Not glorification. Not pacifism. Causation.

Every conflict has a mechanism. The guide finds it: who had what, who wanted what,
what they miscalculated. The human cost is stated plainly, not performed.

Accent color: `#c8a96e` — aged gold. Antiquity, archived suffering, the weight of history.


---

## Backgrounds

**BgDeepField** — default for most scenes
Use for: strategic context, political background, post-war consequence.

```tsx
import { BgDeepField } from "@yt-shorts/video-renderer";
<BgDeepField frame={frame} startFrame={startFrame} />
```

**BgFlare** — for the outbreak and the decisive moment
Use for: hook (the cost), the declaration of war, the moment the battle turned.

```tsx
import { BgFlare } from "@yt-shorts/video-renderer";
<BgFlare frame={frame} startFrame={startFrame} />
```

**BgSignal** — for order of battle, casualty data, territorial comparison
Use for: troop numbers, casualty counts, territory gained/lost, timeline of campaign.

```tsx
import { BgSignal } from "@yt-shorts/video-renderer";
<BgSignal frame={frame} startFrame={startFrame} />
```


---

## Background Image Priority

* **Priority 1** — `guides/history/bg/wartime.png`, `guides/history/bg/<conflict-slug>.png`, or `guides/history/bg/default.png`
* **Priority 2** — `public/bg-image.png`
* **Priority 3** — Programmatic BgDeepField / BgFlare / BgSignal

Copy to `public/bg-image.png`, animate with Ken Burns:

```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.07], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.4) brightness(0.38)", transform: `scale(${imgScale})` }} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.72) 100%)" }} />
```


---

## Typography

```typescript
TOKEN.serif  // Casualty counts, territorial verdicts, defining-moment statements
TOKEN.sans   // Strategic context, campaign narration, cause-and-effect
TOKEN.mono   // Dates, unit designations, battle names, treaty titles
```

Font sizes:

* Massive stat: 160px serif 700
* Display: 72–80px serif 700
* Body: 36–42px sans 300
* Battle/treaty label: 16–20px mono uppercase

```typescript
TOKEN.white   // casualty numbers, strategic verdicts
TOKEN.dim     // campaign context, background
// Accent (#c8a96e gold): key dates, casualty figures, decisive moments in highlight
```


---

## Components

### KineticText

```tsx
<KineticText
  text="Sixty million dead in six years."
  accentWords={["Sixty million"]}
  fontSize={52}
  fontFamily={TOKEN.serif}
  fontWeight={700}
  frame={frame}
  startFrame={startFrame}
/>
```

### Stamp — battle or treaty labels

```tsx
<Stamp label="Battle of Verdun · February–December 1916" frame={frame} startFrame={startFrame} />
```


---

## Scene Templates

### TplStatCallout — casualty counts, territory, duration

```tsx
<TplStatCallout data={{
  type: "stat_callout",
  value: 700000,
  label: "casualties at Verdun",
  context: "in ten months of fighting",
}} frame={frame} startFrame={startFrame} />
```

### TplTimeline — campaign chronology, escalation sequence

```tsx
<TplTimeline data={{
  type: "timeline",
  events: [
    { time: "Aug 1914",  event: "Germany invades Belgium", detail: "Schlieffen Plan activated" },
    { time: "Sep 1914",  event: "Battle of the Marne", detail: "German advance halted" },
    { time: "Nov 1914",  event: "Trenches established", detail: "700km of static front" },
  ],
}} frame={frame} startFrame={startFrame} />
```

### TplFlowDiagram — the miscalculation, the alliance chain, the escalation mechanism

### TplEditorialHeadline — the cost stated as verdict

### TplTextDominant — single casualty numbers or territorial facts as impact statements


---

## Script Voice Rules

* Lead with the cost, not the declaration: "Sixty million dead." not "In September 1939, Germany invaded Poland."
* The TURN is always the miscalculation or the moment the stated objective became unachievable
* The REVEAL shows what was actually decided, what was actually gained, what was permanently lost
* "breathe" beats carry the weight of casualty numbers: "700,000." / "In ten months."
* Name the decision-makers and their calculations — not "the Germans" but "the High Command assumed"
* Close on what remained: what the war created that still exists, what it destroyed permanently


---

## Scene Template Mapping

```
beat = "hook"    → TplEditorialHeadline + BgFlare (the cost, stated immediately)
beat = "build"   → TplTimeline or TplStatCallout (strategic context, mounting losses)
beat = "turn"    → TplFlowDiagram or TplEditorialHeadline (the miscalculation)
beat = "reveal"  → TplStatCallout (the actual cost, the strategic outcome)
beat = "breathe" → TplTextDominant (one casualty number, nothing else)
beat = "close"   → TplEditorialHeadline (what was created, what was destroyed)
dataValue != null → TplStatCallout (always)
```


---

## Distribution Rules

For a 10–18 sentence conflict video:

* At least 3 `TplStatCallout` — conflict is casualty numbers and territory
* At least 1 `TplTimeline` — campaigns have chronology
* At least 1 `TplFlowDiagram` — show the mechanism or the alliance chain
* At least 2 `TplTextDominant` for the weight of isolated casualty facts


