# AGENTS.md — Claude Code Agent Instructions

> This file is for Claude Code agents building compositions.
> Guides and design tokens are **resources for prompting Claude**, not to be hardcoded into components.
> Read this fully before starting any composition work.


---

## Section 0: Guides & Design Tokens for Claude Prompting

### The Model

This project uses two resource types for Claude Code prompting:


1. **Guides** (`guides/**/*.md`)
   * Scene templates and their use cases
   * Component examples (KineticText, Stamp, GoldDivider, Annotation)
   * Animation engine rules (prog, lerp, easing curves)
   * Typography scale and color rules specific to the topic
   * Visual direction for that category (history, science, crime, etc.)
2. **Design Tokens** (`designs/**/*.tokens.json`)
   * Colors (primary, accent, surface, text)
   * Typography scales (size, weight, letter-spacing)
   * Spacing system (xxs through section)
   * Border radius, transitions, shadows

### How to Use Them

**When Claude generates a composition:**


1. Pass the guide file path and tokens file path **in your Claude Code prompt**
2. Claude reads the guide to understand available scene templates and components
3. Claude reads the tokens to extract exact color values, font sizes, spacing
4. Claude builds the composition using this information

**The composition code itself:**

* Never hardcodes hex values like `"#cc785c"`
* Never hardcodes font sizes like `"64px"`
* Never hardcodes spacing like `"32px"`
* All styling comes from imported TOKEN constants or context values

### Example Claude Code Prompt Structure

```
You are building a Remotion composition for a [TOPIC] short video.

Script is in: data/output/script.json
Design guide: guides/[category]/[topic].md
Design tokens: designs/claude/claude.tokens.json

Each sentence has:
- beat: hook | build | turn | reveal | breathe | close
- highlightWords: 1–3 words to render in accent color
- dataValue: number for stat callouts (if present)

Use the guide to:
1. Map each beat to a scene template (TplEditorialHeadline, TplTextDominant, etc.)
2. Route based on content type (narrative, data, rhetorical)
3. Apply motion and animation rules from the guide

Use the tokens to:
1. Extract exact color values from colors.* (primary, accentTeal, etc.)
2. Extract typography from typography.* (displayXl, body, etc.)
3. Extract spacing from spacing.* (xl, lg, sm, etc.)

Build src/compositions/GeneratedComposition.tsx with:
- Import TOKEN from 'path/to/tokens.json'
- Use TOKEN.colors.primary, TOKEN.typography.displayXl, etc.
- Never hardcode colors, fonts, or spacing
```

### Topic-Wise Structure

Guides are organized by category. Use the appropriate guide for your topic:

```
guides/
├── history/
│   ├── documentary.md          ← Timelines, historical events, dates
│   ├── biography.md             ← Historical figures, personal stories
│   └── conflict.md              ← Wars, revolutions, violence
├── science/
│   ├── physics.md               ← Forces, matter, energy
│   ├── biology.md               ← Life, organisms, health
│   └── space.md                 ← Cosmos, planets, astronomy
├── finance/
│   ├── markets.md               ← Trading, stocks, indices
│   ├── crypto.md                ← Blockchain, digital assets
│   └── economics.md             ← Systems, policy, inflation
└── [category]/
    └── [topic].md               ← Topic-specific guide
```

Each guide contains:

* Scene templates available for that category
* Color accents recommended for that category
* Animation types that work best for that content
* Typography and spacing rules specific to the tone


---

## Important Constraints

### Never Hardcode Design Values

**Bad** ❌ (in your composition code):

```typescript
<div style={{ color: '#cc785c', fontSize: '64px', padding: '32px' }}>
```

**Good** ✅:

```typescript
import TOKEN from '../designs/claude/claude.tokens.json';

<div style={{ 
  color: TOKEN.colors.primary, 
  fontSize: TOKEN.typography.displayXl.size, 
  padding: TOKEN.spacing.xl 
}}>
```

### Guides Are Topic-Wise, Not Monolithic

* `guides/history/documentary.md` for Kennedy assassination
* `guides/science/physics.md` for quantum mechanics
* `guides/finance/markets.md` for stock market
* Each guide is **specific to its category**, not a universal template

### Components Must Be Modular

* One component per file
* No 500-line monolithic compositions
* Every scene type lives in its own file inside the video's `scenes/<video-name>/` folder
* Shared animation components live in `src/animations/` only when they are reusable across multiple videos

### Video-Specific Folder Structure

Every generated composition must be self-contained inside a folder named after the video.
The `<video-name>` is a kebab-case slug derived from the video topic (e.g. `tunguska-1908`).

```
src/
├── animations/          ← SHARED only — reusable animation components
├── lib/                 ← SHARED only — utilities used across multiple videos
├── components/          ← SHARED only — generic UI components (KineticText, etc.)
├── context/             ← SHARED only — PaletteContext, hooks
│
├── compositions/
│   └── <video-name>/    ← ONE folder per video
│       ├── index.ts     ← REQUIRED: re-exports the composition
│       └── <VideoName>Composition.tsx
│
└── scenes/
    └── <video-name>/    ← ONE folder per video
        ├── index.ts     ← REQUIRED: re-exports all scenes for this video
        ├── HookScene.tsx
        ├── BodyScene.tsx
        └── CloseScene.tsx
```

**Rules that have no exceptions:**


1. **Never** place video-specific code directly in `compositions/` or `scenes/` roots — always in a named subfolder.
2. **Every** `compositions/<video-name>/` and `scenes/<video-name>/` folder must have an `index.ts` that re-exports its public surface.
3. `src/Root.tsx` imports only from `compositions/<video-name>/index` — never from deeply nested files.
4. Constants, helpers, or types used by only one video live inside that video's folder — not in `lib/` or `utils/`.
5. Video-specific prompt text lives in `.txt` files (see §Prompt File Organisation below) — not hardcoded in TypeScript.

### Prompt File Organisation

All prompt strings must be stored in `.txt` files and loaded at runtime — never hardcoded in source.

```
lmstudio/
└── prompts/
    └── prompt_call1_script.txt    ← LLM prompt for Call 1 script generation
```

For video-specific prompts (e.g. a custom system prompt for a particular topic):

```
data/
└── prompts/
    └── <video-name>/
        └── custom_system.txt
```

Loading pattern:

```typescript
// Good ✅ — load from .txt file
const prompt = fs.readFileSync(
  path.join(__dirname, "../lmstudio/prompts/prompt_call1_script.txt"),
  "utf-8"
);

// Bad ❌ — hardcoded prompt string in source
const prompt = `You are an art director for a documentary short-form video series...`;
```

### Shared vs Video-Specific Decision Tree

Before creating any new file, ask:

```
Is this code used by more than one video?
  Yes → Put it in animations/, lib/, components/, or context/
  No  → Put it inside compositions/<video-name>/ or scenes/<video-name>/

Is this a prompt string?
  Yes → It must be a .txt file in lmstudio/prompts/ or data/prompts/<video-name>/
  No  → Proceed with the above rule
```

### Design-Driven Composition

The composition is **not** built from scratch. It's generated from:


1. **Script metadata** (beat, highlightWords, dataValue)
2. **Guide templates** (what scene types are available)
3. **Design tokens** (colors, fonts, spacing)

Claude builds the routing logic, not the design.


---

## Workflow: From Brief to Video

### Stage 1: Generate Script (Deterministic)

```bash
npm run pipeline --guide guides/history/documentary.md --tokens designs/claude/claude.tokens.json
```

Output:

* `data/output/script.json` — 19 sentences with metadata
* `data/output/claude_prompt.txt` — Handoff guide

### Stage 2: Build Composition (Claude Code)


1. Open `out/prompt/claude.md` (handoff prompt generated by the pipeline)
2. Derive `<video-name>` from the topic slug (e.g. `tunguska-1908`)
3. Read `guides/history/documentary.md` (available templates, components, animation rules)
4. Read `designs/claude/claude.tokens.json` (colors, typography, spacing)
5. Create `src/scenes/<video-name>/` — one file per scene type, plus `index.ts`
6. Create `src/compositions/<video-name>/` — one composition file, plus `index.ts`
7. Register in `src/Root.tsx` by importing from `compositions/<video-name>/index`

### Stage 3: Render Video (Deterministic)

```bash
npm run start          # Preview
npm run build          # Render to MP4
```

### Stage 4 (Optional): Add Audio

```bash
npm run audio:generate --voice-id <voice-id>
npm run audio:stitch
```


---

## Checklist for Claude Code Agents

Before you start building a composition:

- [ ] Derive `<video-name>` slug from the topic (kebab-case, lowercase)
- [ ] Create `src/scenes/<video-name>/` with one file per scene type
- [ ] Create `src/scenes/<video-name>/index.ts` that re-exports all scenes
- [ ] Create `src/compositions/<video-name>/` with the main composition file
- [ ] Create `src/compositions/<video-name>/index.ts` that re-exports the composition
- [ ] Import into `src/Root.tsx` from `compositions/<video-name>/index` only
- [ ] Read the guide file fully
- [ ] Extract all colors from tokens
- [ ] Extract all typography scales from tokens
- [ ] Extract all spacing values from tokens
- [ ] Understand the beat field mapping (hook → which scene?)
- [ ] Verify no hardcoded hex values in your code
- [ ] Verify no hardcoded font sizes in your code
- [ ] Verify no hardcoded spacing in your code
- [ ] Verify no prompt strings are hardcoded — all prompts loaded from `.txt` files
- [ ] Verify no video-specific code leaked into `animations/`, `lib/`, or `components/`
- [ ] Keep each component in its own file
- [ ] Use TOKEN.\* for all design values


---

## Questions?

See:

* `CLAUDE.md` — Full architecture and design system
* `WORKFLOW.md` — Stage-by-stage pipeline guide
* `README_RESTRUCTURED.md` — Project overview
* `guides/history/documentary.md` — Scene templates, components, animation rules
* `designs/claude/claude.tokens.json` — Available design tokens


