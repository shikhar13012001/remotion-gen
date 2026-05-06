# Composition Brief: Introducing the Model Context Protocol

Build `IntroducingTheModelContextComposition` for a 1080×1920 Remotion short.

---

## Identity

- Slug: `introducing-the-model-context`
- Component: `IntroducingTheModelContextComposition`
- Sentences: 14
- Accent: `#da291c`
- Audio: Audio is not available yet. Derive all scene durations strictly from `suggested_duration_ms` in the script. Do not hardcode frame counts.

---

## Read First — In This Order

Do not write a single line of code until all of these are read and internalized.

- `D:\claude-work\yt-shorts-gen\data\output\script.json` — sentence text, beats, durations, highlightWords, dataValue, needsImage.
- `data/output/art_direction.md` — per-scene visual plan. Follow it unless it directly conflicts with the guide or a hard Remotion constraint below.
- `data/output/design_tokens.json` — the only permitted source for colors, typography, spacing, radius, and surface values. Import it; never copy-paste constants.
- `data/output/image_manifest.json` — resolved image assets. Sentence-level assets take priority over the shared background. When a query yields multiple assets, choose the one that best serves the scene layout.
- `data/output/design_block.txt` — human-readable token reference only. Do not paste values from this file into code.
- `guides/finance/general.md` — category guide; scene-template and visual-language authority.
- `AGENTS.md` — repository structure and composition rules.
- `.agents/skills/remotion-best-practices/SKILL.md` — Remotion rules; read all relevant rule files before writing any Remotion code.

---

## Implementation Contract

### File Structure
- All video-specific code lives exclusively under `src/compositions/introducing-the-model-context/` and `src/scenes/introducing-the-model-context/`.
- Add `index.ts` to both folders.
- Import the composition in `src/Root.tsx` only from `./compositions/introducing-the-model-context/index`.
- One video-local design adapter if needed — reads `data/output/design_tokens.json`. No scattered copied constants anywhere in the codebase.
- Prompt/copy text belongs in `.txt` files, not hardcoded in TypeScript.
- One distinct scene layout per file. Extract a shared video-local renderer only when it eliminates duplication across three or more scenes.

### Design Token Authority
- Every color, typeface, font size, font weight, line height, spacing step, border width, corner radius, and surface must reference a DESIGN TOKEN value. Zero hardcoded design values.
- Treat DESIGN TOKEN surfaces as the brand ground truth. If the design system is light, keep the video light — only invert a single scene if it has an explicit content reason to do so.
- The design file owns brand surfaces, typography, corner radius, and accent behavior.
- The topic guide owns scene vocabulary, content patterns, and visual language.
- Do not impose a dark theme, documentary house style, or any named creator/channel reference unless it comes directly from the design tokens.

---

## Animation Rules — Non-Negotiable

Every scene must feel kinetic. Static frames are failures.

- **All animation** must be driven by `useCurrentFrame()`, `interpolate()`, and `spring()`. No exceptions.
- **Zero** CSS transitions, CSS `@keyframes`, or third-party auto-animation libraries.
- **Charts and diagrams** must animate via React/SVG controlled by frame values. Disable any built-in library animation.
- **Images** must use Remotion `<Img>` with `staticFile()` and frame-driven Ken Burns (slow pan + subtle scale). No native `<img>`. No CSS `background-image`.
- **TransitionSeries**: If used, account for overlap duration inside `calculateMetadata` so total frame count stays accurate.
- **Spring config guidance**:
  - Entrances: `{ damping: 14, stiffness: 120 }` — snappy, confident
  - Data reveals: `{ damping: 20, stiffness: 80 }` — weighted, deliberate
  - Breathe scenes: `{ damping: 28, stiffness: 60 }` — slow, considered
- **Stagger**: When multiple elements enter a scene, offset each by 3–6 frames. Never reveal a group simultaneously.
- **Text entrances**: Prefer upward translate + fade (translateY from +24px to 0, opacity 0→1 over 12–18 frames). Avoid left-slide for body copy.
- **HighlightWords**: Must receive a visually distinct treatment — weight shift, accent color underline, scale pulse, or background chip. Never ignored.
- **Exit animations**: Every scene must have an intentional exit — scale down, fade, or clip-path wipe. No hard cuts unless the beat explicitly calls for one.

---

## Typography Rules

Typography is a primary design element, not just a container for text.

- Load all typefaces via `@remotion/google-fonts` or local `staticFile()`. No system font fallbacks for display text.
- **Display / Hero text**: Use a typeface with strong visual authority — high contrast, wide range of weights. Push sizes large; oversized display text that bleeds near the frame edge is intentional.
- **Monospace / Data text**: Reserve for dataValues, counters, timestamps, and labels. Monospace creates an "information is precise" signal.
- **Body / UI text**: Clean, readable, distinct from the display face. Should feel like a different design object, not a scaled-down version.
- **Weight contrast**: Mix weights dramatically within related elements — a thin label above a black-weight headline reads as intentional design, not inconsistency.
- **Letter-spacing extremes**: Tight tracking (−0.02em to −0.05em) on large headlines. Loose tracking (0.1em–0.2em) on small caps or category labels. Never neutral tracking on display text.
- **Line height**: Tight on headlines (1.0–1.1). Generous on body (1.4–1.6). Never default line height on display type.
- **Text must never overflow its container.** Verify at the longest sentence in the script before marking complete.
- **Absolute or flex layout only** for text positioning. No implicit document flow that can break at unexpected frame counts.

---

## Visual Construction Rules

Prefer constructed visuals over decorative ones. Every scene should show something the viewer could not have seen as clearly in text alone.

**Constructed visual types by beat:**

| Beat | Preferred Visual Form |
|------|----------------------|
| hook | High-impact single object. Bold scale. Immediate legibility. Sets the stakes. |
| build | Layered reveals. Each beat adds exactly one new element. Nothing appears before its moment. |
| data | Diagram, chart, timeline, matrix, gauge, ledger, or annotated object. Never a raw number alone. Must show scale, comparison, threshold, or consequence. |
| breathe | Restrained but precise. One clear visual idea. Not decorative filler. |
| close | Callback to the hook with new understanding. New framing, not a repeat. |

**Layout principles:**
- Asymmetric compositions over centered symmetry — break the grid intentionally.
- Overlap elements with z-depth for perceived dimensionality.
- Generous negative space in breathe scenes. Controlled density in data scenes.
- Hairline rules, grid lines, and structural borders carry weight — use them as design elements, not just separators.
- Glassmorphism (backdrop-filter blur + low-opacity surface) is permitted for floating overlays and callout chips only. Not as a general background treatment.

**Image usage:**
- Use image backgrounds only when they add place, context, or evidence that a constructed visual cannot.
- Check `guides/finance/bg` first, then `public/bg-image.png`.
- Prefer fetched assets in `public/assets/introducing-the-model-context/` when `image_manifest.json` provides them.
- Respect the sentence's intended visualQuery role: background plate, split panel, subject cutout, or annotated evidence.
- All images get frame-driven Ken Burns — minimum 2% scale change and a slow translate across the duration of the scene.

---

## Scene Mapping Reference

Read `art_direction.md` for per-scene specifics. Use `beat`, `dataValue`, `needsImage` as override signals:

- `dataValue` present → scene must render a constructed data visual. A large number alone is not acceptable.
- `needsImage: true` → pull sentence-level asset from `image_manifest.json` first; fall back to shared background asset; apply Ken Burns always.
- `beat: "close"` → callback scene. Reference a visual motif from the hook scene. Do not simply repeat it — reframe it with the information the viewer now has.

---

## Validation Checklist

Run both commands. Fix all errors before responding.

**TypeScript:**
```
# Windows
node_modules\.bin\tsc.cmd --noEmit

# Unix
npx tsc --noEmit
```

**Render:**
```
# Windows
node_modules\.bin\remotion.cmd render IntroducingTheModelContextComposition out\video.mp4

# Unix
npx remotion render IntroducingTheModelContextComposition out/video.mp4
```

**Confirm all of the following before marking done:**

- [ ] No blank frames anywhere in the timeline
- [ ] No text overflow on any sentence at any frame
- [ ] No static (unanimated) image backgrounds
- [ ] No stale audio timing mismatches
- [ ] All `dataValue` scenes show a constructed visual — no raw number dumps
- [ ] All `needsImage` scenes use `<Img>` + `staticFile()` with Ken Burns motion
- [ ] All `highlightWords` receive a distinct visual treatment
- [ ] Every scene has both an entrance and an intentional exit animation
- [ ] Staggered element reveals in every multi-element scene (3–6 frame offsets)
- [ ] Zero hardcoded hex values, font strings, or spacing numbers in any `.tsx` file
- [ ] Zero CSS transitions or `@keyframes` anywhere in the codebase
- [ ] All typefaces loaded via `@remotion/google-fonts` or `staticFile()`

If any item is unchecked, fix it. Do not ask for permission to fix — just fix it.
