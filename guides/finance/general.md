# Guide: Finance

## Identity

Precise, mechanical, and consequential. Finance videos should feel like opening
a machine and watching money, risk, time, and incentives move through it.

The goal is not a generic dark documentary mood. The goal is explanation through
designed systems: ledgers, thresholds, flows, comparison bars, balance-sheet
panels, rate dials, ownership maps, and diagnostic dashboards.

Accent color: `#f0c040` - amber gold. Use it for money paths, warning thresholds,
active values, and the single most important figure in a scene.

Never imitate any named creator, YouTube channel, or documentary reference style.


---

## Visual Priority

Use this order when designing a finance scene:


1. **Constructed visual system** - chart, flow, ledger, matrix, meter, timeline,
   annotated balance sheet, ownership map, or diagnostic panel.
2. **Hybrid image + overlay** - only when a real place/object adds information.
   The overlay must still carry the argument.
3. **Text-dominant frame** - only for short verdicts or breath beats.
4. **Pure background treatment** - last resort, never the scene's main idea.

At least half the scenes in a 10-18 sentence finance video should be diagrammatic
or structurally visual.


---

## Backgrounds

Backgrounds are surfaces, not the concept. Do not default to a dark theme. Choose
light, dark, paper, terminal, dashboard, or photographic treatment based on the
scene's informational job and the provided DESIGN tokens.

**Signal surface** - for charts, grids, dashboards, diagnostics, market structure.
Use when numbers need axes, rows, columns, thresholds, or comparison.

**Editorial surface** - for verdicts and breath beats.
Can be light or dark depending on DESIGN.bg / DESIGN.surface and legibility.

**Photo surface** - for places, assets, buildings, exchanges, or institutions.
Always use Ken Burns and an information-bearing overlay: labels, lines, panels,
flow routes, or annotation.


---

## Background Image Priority

* **Priority 1** - `guides/finance/bg/<topic-slug>.png` or `guides/finance/bg/default.png`
* **Priority 2** - `public/bg-image.png`
* **Priority 3** - designed surfaces and diagram fields

Images must never be static and must never be used only for atmosphere. If an image
does not clarify the sentence, build a diagram instead.


---

## Typography

Use tokenized typography only.

* `DESIGN.stat` - decisive figures, thresholds, percentages, dollar amounts
* `DESIGN.display` - section labels, large nouns, binary oppositions
* `DESIGN.body` - explanatory sentence text
* `DESIGN.caption` - tickers, labels, dates, context, chart annotations

Financial labels should often be uppercase, compact, and aligned to chart structure.
Do not let captions float without a relationship to a line, axis, row, or object.


---

## Core Visual Components

### Money Flow

Use for rent, dividends, borrowing, capital, and payouts.

Structure:
`Tenant / Asset -> REIT box -> Dividend / Investor`

Motion:
Lines draw first. Nodes snap in. Amount labels arrive last.

### Yield Comparison

Use for percentage gaps, spreads, alternatives, opportunity cost.

Structure:
Two horizontal bars or rows sharing one axis. Accent marks the active instrument;
muted value marks the benchmark.

### Risk Compression

Use for rising rates, falling prices, margin pressure, leverage.

Structure:
Two plates or bands squeeze a central profit block. Arrows point inward or downward.

### Diagnostic Dashboard

Use for metrics viewers should inspect.

Structure:
Three to five rows with status markers, warning thresholds, or meters. Do not make
it decorative; each row should teach what to look at.

### Liquidity Split

Use for wrapper/core contradictions.

Structure:
A binary frame, membrane, lock, or shell/core diagram. One side moves quickly;
the other stays fixed.


---

## Scene Template Mapping

```
beat = "hook"    -> high-impact object, number, or contradiction
beat = "build"   -> diagram assembly, comparison, matrix, dashboard
beat = "turn"    -> system breaks, splits, reverses, or gets relabeled
beat = "reveal"  -> threshold, mechanism, or number made visually unavoidable
beat = "breathe" -> restrained visual with one precise object, not empty by default
beat = "close"   -> completed system or callback with new annotation
dataValue != null -> show scale with chart, meter, threshold, or comparison
```


---

## Distribution Rules

For a 10-18 sentence finance video:

* At least 4 quantitative scenes with visible scale.
* At least 2 mechanism scenes using flows, arrows, pipes, compression, or layered systems.
* At least 1 diagnostic dashboard or checklist.
* At least 1 binary contradiction or tradeoff scene.
* No more than 2 consecutive text-dominant scenes.
* No more than 3 image-led scenes unless every image has a meaningful overlay.


---

## Script Voice Rules

* Lead with the outcome or mechanism.
* Numbers carry drama, but diagrams explain why they matter.
* Avoid moral commentary. Show incentives and consequences.
* Breath beats should clarify, not stall.
* Turns should expose the variable that changes the system.


