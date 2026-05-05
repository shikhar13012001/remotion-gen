# Video Render Workflow

End-to-end flow: topic brief → published MP4.


---

## Overview

```
input.txt
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  npm run pipeline                                           │
│                                                             │
│  Step 1 · Load design system + guide                        │
│  Step 2 · Read input.txt                                    │
│  Step 3 · Generate script (LLM Call 1 → script.json)       │
│  Step 4 · Generate audio (ElevenLabs, optional)             │
│  Step 5 · Extract design tokens → design_block.txt         │
│  Step 6 · Art direction (LLM Call 2 → art_direction.md)    │
│  Step 7 · Save handoff prompt → out/prompt/claude.md        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Build composition (Claude agent reads out/prompt/claude.md)
    │
    ├── Read data/output/script.json
    ├── Read data/output/art_direction.md
    ├── Read data/output/design_block.txt
    └── Read guide file (path listed in prompt)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  npm run start                (Remotion Studio preview)     │
│  npm run build                (render silent video)         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
out/video.mp4  (silent)
    │
    ├── npm run audio:generate  (ElevenLabs TTS → voice.mp3)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  npm run audio:stitch         (ffmpeg merge)                │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
out/video_with_audio.mp4  ✓ done
```


---

## Step 1 — Write a topic brief

Edit `data/input/input.txt`. One plain-English paragraph describing the topic, tone, and
any key facts you want covered.

```
The Tunguska Event, 1908. A massive explosion over Siberia flattened 2000 km² of forest.
No crater. No meteorite. Eyewitnesses 60 km away were knocked off their feet.
Scientists still debate what actually hit.
```


---

## Step 2 — Run the pipeline

```bash
npm run pipeline -- --design designs/vercel/DESIGN.md --guide guides/history/documentary.md --skip-audio
```

| Flag | Required | Purpose |
|----|----|----|
| `--design <path>` | Optional | DESIGN.md to extract color/font tokens from. Defaults to the neutral built-in token set. |
| `--guide <path>` | Optional | Category guide (backgrounds, typography, component list). |
| `--skip-audio` | Optional | Skip ElevenLabs call. Always use during composition development. |
| `--voice-id <id>` | Optional | ElevenLabs voice ID. Only needed when generating audio. |

**What gets written:**

| File | Contents |
|----|----|
| `data/output/script.json` | Script — sentences, beat tags, highlightWords, dataValues |
| `data/output/art_direction.md` | Per-scene visual direction from the art director LLM |
| `data/output/design_block.txt` | `const DESIGN = {...} as const` ready to paste into scene files |
| `data/output/design_tokens.json` | Design tokens for Root.tsx at render time |
| `out/prompt/claude.md` | Composition brief for the coding agent |


---

## Step 3 — Build the composition

Open `out/prompt/claude.md`. It contains the task brief with file paths to read — not embedded content.
The coding agent reads:

* `data/output/script.json` — to understand each sentence's beat, text, highlightWords
* `data/output/art_direction.md` — to understand the per-scene layout and animation intent
* `data/output/design_block.txt` — to get the `const DESIGN` block to paste into every file
* The guide file (path listed in the prompt) — for available background components and typography

The agent creates:

```
src/
├── compositions/<slug>/
│   ├── index.ts
│   └── <VideoName>Composition.tsx
└── scenes/<slug>/
    ├── index.ts
    └── [one file per distinct scene layout]
```

Then registers the composition in `src/Root.tsx`.


---

## Step 4 — Preview

```bash
npm run start
```

Opens Remotion Studio at `http://localhost:3000`. Scrub through every scene.
Check text legibility, highlight word timing, background treatment, animation feel.


---

## Step 5 — Render silent video

```bash
npm run build
```

Outputs `out/video.mp4`. 1080×1920, 30fps, no audio track.

To render a specific composition by name:

```bash
npx remotion render <VideoName>Composition out/video.mp4
```


---

## Step 6 — Generate audio (optional)

Requires `ELEVENLABS_API_KEY` in your `.env`.

```bash
npm run audio:generate
# or with a specific voice:
npm run audio:generate -- --voice-id <voice-id>
```

Outputs:

* `public/voice.mp3` — full narration
* `public/timing.json` — word-level timestamps for karaoke sync


---

## Step 7 — Stitch audio

```bash
npm run audio:stitch
```

Combines `out/video.mp4` + `public/voice.mp3` → `out/video_with_audio.mp4` using ffmpeg.
Video codec is copied (no re-encode). Audio is encoded as AAC.


---

## Rebuild the prompt without re-running the pipeline

If you change the guide file or want to refresh `out/prompt/claude.md` without re-running LLM calls:

```bash
npm run regen-prompt -- designs/vercel/DESIGN.md guides/finance/general.md
```

Reads existing `data/output/script.json` and `data/output/art_direction.md`.
Accepts positional args (design path first, guide path second) or named flags.


---

## Available designs

```
designs/vercel/DESIGN.md    — dark navy, Geist/Inter, clean
designs/claude/DESIGN.md    — warm dark, editorial
designs/clay/DESIGN.md      — canvas-white, rounded, vibrant cards
```

## Available guides

```
guides/history/documentary.md    — archival tone, image-first when assets exist, diagram surfaces for timelines/mechanisms
guides/finance/general.md        — BgSignal default, clinical/cold
guides/science/general.md        — BgSignal default, precise/data-driven
```


---

## Full run (from scratch)

```bash
# 1. Write brief
echo "Your topic here" > data/input/input.txt

# 2. Pipeline (skip audio for now)
npm run pipeline -- --design designs/vercel/DESIGN.md --guide guides/history/documentary.md --skip-audio

# 3. Build the composition (agent step — read out/prompt/claude.md)

# 4. Preview
npm run start

# 5. Render
npm run build

# 6. Audio (when ready)
npm run audio:generate
npm run audio:stitch

# Final output: out/video_with_audio.mp4
```

