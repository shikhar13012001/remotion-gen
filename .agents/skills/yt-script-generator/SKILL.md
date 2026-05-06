
---

## name: yt-script-generator

description: Generate all pipeline output files for a YouTube Shorts video directly — without running any code or LLM API calls. Use this skill when the user asks to "generate a script", "write the script", "create a video script", or "run the pipeline" for a given topic. The agent reads the source files and writes all five output files itself: script.json, output.txt, design_block.txt, art_direction.md, and out/prompt/claude.md.

# YT Script Generator Skill

You are the pipeline. The user gives a topic (or it is already in `data/input/input.txt`).
You produce every file the pipeline would produce — with no code execution, no npm commands,
and no API calls. You write the files directly using the file system tools.


---

## Files you must read first (always)

Before generating anything, read these files to understand the constraints:

| File | What to extract |
|----|----|
| `lmstudio/prompts/prompt_call1_script.txt` | Voice rules, structural rules, beat definitions, duration rules, self-check |
| `lmstudio/schemas/schemaA_script.json` | Exact field names, types, constraints for every sentence |
| `lmstudio/prompts/prompt_art_director.txt` | Art direction rules, output format per scene |
| `data/input/input.txt` | The topic brief (if no topic was provided in chat) |

If a design file path is mentioned (e.g. `designs/vercel/DESIGN.md`), read it too.
If a guide file path is mentioned (e.g. `guides/finance/general.md`), read it too.


---

## Step 1 — Generate `data/output/script.json`

Apply every rule from `prompt_call1_script.txt` exactly as if you were the LLM
receiving that system prompt. Write the ScriptPackage JSON.

### Structural requirements (non-negotiable)

* `sentences`: exactly **10–16** items
* `total_words`: **150–220** (count every word across all sentence texts)
* `accentColor`: use the design file's primary/accent color; if none provided, use category fallback:
  * history `#c8a96e` · finance `#f0c040` · science `#4fc3f7` · crime `#ef5350`
  * health `#66bb6a` · space `#ce93d8` · geopolitics `#90a4ae` · philosophy `#bcaaa4`
  * technology/protocol `#4fc3f7` · default `#c8a96e`

### Every sentence must have all required fields

```
index                 integer, 1-based
text                  string ≥5 chars
beat                  "hook"|"build"|"turn"|"reveal"|"breathe"|"close"
word_count            integer (count the text words exactly)
suggested_duration_ms integer 2000–8000 (see duration rules below)
visualQuery           string (3-4 words) | null
needsImage            boolean
highlightWords        string[] (0–3 words verbatim from text)
dataValue             number | null
```

### Beat rules

* **Exactly 1** `hook` — first sentence, ≤8 words, most arresting fact stripped bare
* **Exactly 1** `close` — last sentence, consequence or reframe that echoes the hook
* **At least 2** `breathe` — ≤6 words each, `visualQuery: null`, `needsImage: false`
* **At least 1** `turn` — reversal or contradiction
* **At least 1** `reveal` — the key insight or hidden truth
* Remaining sentences: `build`
* Interior beat distribution must not be monotone (no run of 5+ identical beats)

### Narrative arc shape

```
hook → build → build → [breathe] → build → turn → build → build → breathe → build → reveal → [build] → [breathe] → close
```

### Duration rules

* Base: `word_count × 130ms`, rounded to nearest 100ms
* Min 2000ms, max 8000ms
* `hook`: minimum 3200ms
* `close`: minimum 3800ms
* `breathe`: fixed 2400ms regardless of word count
* `reveal`: base + 600ms
* `turn`: base + 300ms
* **Total** sum of all `suggested_duration_ms` must be **60,000–90,000ms**

### visualQuery rules

* `null` for every `breathe` and `close` sentence
* `null` for any sentence that does not need a background image
* When non-null: exactly 3–4 concrete nouns, no articles, no verbs
  * Bad: `"AI technology"` · Good: `"GitHub API integration dashboard"`

### highlightWords rules

* 1–3 words (or phrases joined with space) verbatim from the sentence text
* Case-insensitive match must work: if `"Fragmented"` is in text, `"Fragmented"` is valid
* Never include words not present in the sentence text

### Self-check before writing the file

```
□ total_words 150–220
□ sentence count 10–16
□ sum(suggested_duration_ms) 60,000–90,000ms
□ exactly 1 hook (first), exactly 1 close (last)
□ ≥2 breathe, ≥1 turn, ≥1 reveal
□ every breathe/close has needsImage=false and visualQuery=null
□ every highlightWords entry is verbatim in the sentence text
□ every non-null visualQuery is exactly 3-4 words
□ every dataValue is a raw number or null (no units, no commas)
```

Write the file to: `data/output/script.json`


---

## Step 2 — Generate `data/output/output.txt`

Concatenate all sentence `text` values joined by a single space.

```
<sentence1 text> <sentence2 text> ... <sentenceN text>
```

Write the file to: `data/output/output.txt`


---

## Step 3 — Generate `data/output/design_block.txt`

If a design file was provided, extract and format a `const DESIGN` block.
If no design file was provided, use the default dark system below.

### Default dark design block

```typescript
const DESIGN = {
  // Surfaces
  bg:          "#0d0d0d",
  surface:     "#1a1a1a",
  surfaceRaised: "#242424",

  // Text
  textOn:      "#f0f0f0",
  textMuted:   "rgba(255,255,255,0.55)",

  // Accent (from accentColor in script.json)
  accent:      "<accentColor from script>",
  accentDim:   "<accentColor at 60% opacity>",
  accentGlow:  "<accentColor at 20% opacity>",

  // Lines
  border:      "rgba(255,255,255,0.08)",
  grid:        "rgba(255,255,255,0.06)",

  // Typography
  fontDisplay: "Syne, system-ui, sans-serif",
  fontBody:    "DM Sans, system-ui, sans-serif",
  fontMono:    "JetBrains Mono, monospace",

  // Type scales (px values as strings)
  stat:     { size: "108px", weight: 800, lineHeight: 1.0 },
  display:  { size:  "72px", weight: 700, lineHeight: 1.1 },
  body:     { size:  "48px", weight: 400, lineHeight: 1.3 },
  caption:  { size:  "32px", weight: 400, lineHeight: 1.4 },
  micro:    { size:  "24px", weight: 400, lineHeight: 1.5 },
} as const;
```

**If a design file was provided:** parse it for:

* `accentColor` / `primary` / `brand` → `DESIGN.accent`
* `background` / `bg` hex → `DESIGN.bg`
* `text` / `textOn` / `foreground` hex → `DESIGN.textOn`
* `fontDisplay` / `font-family` display font name → `DESIGN.fontDisplay`
* `fontBody` / body font name → `DESIGN.fontBody`
* Replace the default values with extracted values; keep all field names identical

Write the file to: `data/output/design_block.txt`


---

## Step 4 — Generate `data/output/art_direction.md`

Apply every rule from `prompt_art_director.txt`. For each sentence in `script.json`,
write one scene section in the exact format below.

### Output format per scene (repeat for every sentence)

```
---
### Scene [N] - "[first 6 words of sentence text]..."
**Beat:** [beat] | **Duration:** ~[suggested_duration_ms/1000]s | **Highlight words:** [highlightWords joined by ", "]

**Visual concept:**
[1–3 sentences. What specific diagram, chart, map, ledger, meter, flow, or annotated
object carries this sentence? Where is the text positioned? Be concrete — not "text
appears" but "a two-column ledger routes three payment lines through a central node
into dividend slips at the right margin".]

**Entry animation:**
[Describe the specific entry motion. Not "fade in" — name the thing that moves:
"the three connection lines draw from left simultaneously over 16 frames; the
protocol label slams in at frame 17 in DESIGN.accent".]

**Background:**
[Describe what sits behind the foreground: designed surface, diagram field,
chart grid, photo with Ken Burns, or clean void. For breathe/close beats:
near-pure DESIGN.bg with the sentence in DESIGN.textOn, centred.]

**Why this is different from the previous scene:**
[One sentence on the visual contrast — layout shift, diagram-type change,
information-density change, or rhythm change.]
```

### Art direction rules

* **At least half** the scenes must have a constructed visual system: diagram, chart, matrix, meter, timeline, map, ledger, annotated object, or flow
* **Never** repeat the same visual structure on consecutive scenes
* `breathe` / `close` beats: full-screen typographic treatment, `DESIGN.bg` background, `DESIGN.textOn` text, no diagram
* `dataValue != null`: the number must appear in a visual relationship (bar, gauge, axis, threshold, counter)
* `needsImage=true`: explain exactly how the image is framed and what overlay information it carries
* All color, font, and size references must use `DESIGN.*` — never raw hex or pixel values

Write the file to: `data/output/art_direction.md`


---

## Step 5 — Generate `out/prompt/claude.md`

Build the handoff brief for the composition-building agent.

Derive from the script:

```
videoSlug    = topic.toLowerCase()
                 .replace(/[^a-z0-9 ]/g, "")
                 .trim().split(" ").slice(0,4).join("-")

VideoName    = videoSlug.split("-").map(w => w[0].toUpperCase()+w.slice(1)).join("")
```

Write the file with this exact structure:

```markdown
# Composition Brief — {topic}

## Task
Build a Remotion composition in `src/compositions/{videoSlug}/` and `src/scenes/{videoSlug}/`.
Read the source files listed below before building each component.

---

## Video Identity

| Property  | Value |
|-----------|-------|
| Slug      | `{videoSlug}` |
| Component | `{VideoName}Composition` |
| Accent    | `{accentColor}` |
| Scenes    | {sentenceCount} |
| Audio     | public/voice.mp3 + public/timing.json — run `npm run audio:generate` if missing |

---

## Source Files — read before building

| File | Contains | Read when |
|------|----------|-----------|
| `data/output/script.json` | {sentenceCount} sentences — text, beat, highlightWords, dataValue | Before mapping scene types |
| `data/output/art_direction.md` | Per-scene visual direction — layout, animation, background | Before building each scene |
| `data/output/design_block.txt` | `const DESIGN = {...} as const` — all colors, fonts, sizes | Copy verbatim into your files |
{guideLine}

---

## DESIGN Constants

Read `data/output/design_block.txt` and copy the `const DESIGN = {...} as const` block into any
file that uses colors, fonts, or sizes. Use `DESIGN.*` for **everything** — never hardcode values.
```

DESIGN.bg / DESIGN.surface / DESIGN.textOn / DESIGN.textMuted  — surfaces & text
DESIGN.accent / DESIGN.accentDim / DESIGN.accentGlow           — accent color
DESIGN.border / DESIGN.grid                                     — lines & grids
DESIGN.fontDisplay / DESIGN.fontBody / DESIGN.fontMono          — font families
DESIGN.display / DESIGN.body / DESIGN.caption / DESIGN.stat    — typographic scales

```

---

## Code Contracts (non-negotiable)

1. **Colors, fonts, sizes** — always `DESIGN.*`; never raw hex, font strings, or pixel values
2. **Animations** — `interpolate()` or `spring()` only; never CSS `transition` or `@keyframes`
3. **`useCurrentFrame()`** — called inside each scene component; never passed as a prop
4. **Backgrounds** — each scene owns its own; no shared background component
5. **Highlight words** — `DESIGN.accent` color, one font weight heavier, 2-frame stagger delay
6. **Images** — always Ken Burns (animated scale via `interpolate`); never static

---

## File Structure
```

src/
├── compositions/{videoSlug}/
│   ├── index.ts                    ← exports {VideoName}Composition
│   └── {VideoName}Composition.tsx
└── scenes/{videoSlug}/
├── index.ts                    ← exports all scene components
└── \[one file per distinct layout from art_direction.md\]

```

- Never place files in `compositions/` or `scenes/` roots — always inside the named subfolder
- `src/Root.tsx` imports only from `compositions/{videoSlug}/index`
- Helpers for this video only → inside the video folder, not `src/lib/`

---

## Background Image Priority

1. `guides/<category>/bg/*.png` — if present, copy to `public/bg-image.png`, use `staticFile()` with Ken Burns
2. `public/bg-image.png` — fallback, always present
3. Programmatic (`BgSignal` / `BgFlare` / `BgDeepField`) — last resort

Ken Burns pattern (never render an image static):
```tsx
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], { extrapolateRight: "clamp" });
<Img src={staticFile("bg-image.png")} style={{ objectFit: "cover", transform: `scale(${imgScale})` }} />
```


---

## Root Registration

```tsx
// src/Root.tsx — add:
import { {VideoName}Composition } from "./compositions/{videoSlug}/index";

<Composition
  id="{VideoName}Composition"
  component={{VideoName}Composition}
  fps={30} width={1080} height={1920}
  durationInFrames={900}
  calculateMetadata={calculateMetadata}
  defaultProps={scriptToProps(script)}
/>
```


---

## Validation

```bash
npx tsc --noEmit
npx remotion render {VideoName}Composition out/video.mp4
```

```

Where `{guideLine}` is:
- If a guide was provided: `| \`{guidePath}\` | Backgrounds, typography, component library | When designing scene visuals |`
- Otherwise: *(omit the row)*

Write the file to: **`out/prompt/claude.md`** (create `out/prompt/` directory if missing)

---

## Output summary

After writing all five files, print a confirmation table:
```

✅ Script generated — {sentenceCount} sentences · {totalWords} words · \~{totalSeconds}s
Accent : {accentColor}
Topic  : {topic}
Slug   : {videoSlug}

Files written:
data/output/script.json
data/output/output.txt
data/output/design_block.txt
data/output/art_direction.md
out/prompt/claude.md

Next step:
Read out/prompt/claude.md and build the Remotion composition.
Then: npm run start  (preview)  →  npm run build  (render)

```

---

## Do not

- Do not run any terminal commands (no `npm run pipeline`, no `npx tsx`, no `node`)
- Do not call any LLM API or external service
- Do not read or write any file not listed in this skill
- Do not add sentences outside the 10–16 range
- Do not hardcode hex values or font strings in the `design_block.txt` output — use the format above
- Do not skip the self-check in Step 1 — verify every box before writing `script.json`
```


