# YT Shorts Generation — Restructured Pipeline

## Overview

This project generates publication-ready YouTube Shorts (1080×1920, 30fps) using a **three-stage pipeline**:

1. **Script Generation** (LLM-based) → `data/output/script.json`
2. **Video Rendering** (Remotion) → `out/video.mp4`
3. **Audio Stitching** (optional, ffmpeg) → `out/video_with_audio.mp4`

Audio and stitching are **completely optional and separate** from the main pipeline.

---

## Quick Start

### Minimal: Just render a silent video

```bash
npm run pipeline --guide guides/history/documentary.md --tokens designs/claude/claude.tokens.json
npm run build
```

Output: `out/video.mp4`

### Complete: Render + add narration

```bash
npm run pipeline --guide guides/history/documentary.md --tokens designs/claude/claude.tokens.json
npm run build
npm run audio:generate --voice-id <voice-id>
npm run audio:stitch
```

Output: `out/video_with_audio.mp4`

### Preview before rendering

```bash
npm run start
# Opens http://localhost:3000 — preview, edit, render
```

---

## Stage 1: Script Generation

**When**: Once per topic

**Command**:
```bash
npm run pipeline \
  --guide guides/history/documentary.md \
  --tokens designs/claude/claude.tokens.json
```

**What happens**:
1. Reads your topic brief from `data/input/input.txt`
2. Loads design guide and tokens
3. Generates a 19-sentence script with metadata:
   - `beat`: hook | build | turn | reveal | breathe | close
   - `highlightWords`: 1–3 words to render in accent color
   - `dataValue`: numbers for stat callouts
   - `suggested_duration_ms`: timing fallback

**Output**:
- `data/output/script.json` — The complete script
- `data/output/claude_prompt.txt` — Handoff guide (saved to file, not printed)

---

## Stage 2: Video Rendering

**When**: After script is generated, whenever you want to adjust the composition

**Commands**:
```bash
npm run start          # Preview in studio
npm run build          # Final render to MP4
```

**What happens**:
1. Loads the generated script
2. Routes each sentence to a scene template based on its `beat` and content
3. Applies colors, typography, spacing from `designs/claude/claude.tokens.json`
4. Renders a silent 1080×1920 video at 30fps

**Output**:
- `out/video.mp4` — Silent video

**Design-driven**:
- Scene templates come from: `guides/history/documentary.md`
- Colors/fonts/spacing come from: `designs/claude/claude.tokens.json`
- You never hardcode hex values or font names

---

## Stage 3: Audio Generation (Optional)

**When**: Only if you want narration

**Command**:
```bash
npm run audio:generate --voice-id <eleven-labs-voice-id>
```

**Requires**:
- `ELEVEN_LABS_API_KEY` environment variable
- ElevenLabs account with a voice ID

**What happens**:
1. Reads all sentence text from `data/output/script.json`
2. Calls ElevenLabs API to generate voice-over
3. Captures word-level timing data

**Output**:
- `public/voice.mp3` — Full narration (mp3)
- `public/timing.json` — Word timings (JSON)

---

## Stage 4: Audio Stitching (Optional)

**When**: After both video and audio are ready

**Command**:
```bash
npm run audio:stitch
```

**Requires**:
- `out/video.mp4` (from Stage 2)
- `public/voice.mp3` (from Stage 3)
- ffmpeg installed (`brew install ffmpeg` or `choco install ffmpeg`)

**What happens**:
1. Reads video (no audio track)
2. Reads audio from ElevenLabs
3. Combines them using ffmpeg (fast, no re-encoding)

**Output**:
- `out/video_with_audio.mp4` — Final video with audio

---

## Directory Structure

```
.
├── data/
│   ├── input/
│   │   └── input.txt                 ← Your topic brief goes here
│   └── output/
│       ├── script.json                ← Generated: 19 sentences + metadata
│       └── claude_prompt.txt           ← Generated: handoff guide
├── guides/
│   └── history/
│       └── documentary.md              ← Scene templates, components, rules
├── designs/
│   └── claude/
│       └── claude.tokens.json          ← Design tokens: colors, typography, spacing
├── public/
│   ├── voice.mp3                       ← Generated audio (optional)
│   └── timing.json                     ← Generated word timings (optional)
├── src/
│   ├── Root.tsx                        ← Loads script.json, registers composition
│   └── compositions/
│       └── GeneratedComposition.tsx    ← Built by you using the handoff guide
├── out/
│   ├── video.mp4                       ← Rendered silent video
│   └── video_with_audio.mp4            ← Final video with audio (optional)
├── pipeline.ts                          ← Script generation
├── audio-workflow.ts                    ← Audio generation + stitching
├── WORKFLOW.md                          ← Complete workflow guide
└── RESTRUCTURE_SUMMARY.md               ← What changed and why
```

---

## Key Design Decisions

### Why separate audio?

1. **Optional** — Videos often work better without narration
2. **Reusable** — Same script + video, different audio (multi-language, re-record)
3. **Independent** — Can fail/retry without affecting video
4. **Clear** — Each tool has one job

### Why save handoff prompt to file?

1. **Persistent** — Won't scroll away or get lost
2. **Referenceable** — Open anytime from `data/output/claude_prompt.txt`
3. **Clean** — Terminal stays readable

### Why use design tokens?

1. **Consistency** — All colors, fonts, spacing defined in one place
2. **Reusable** — Swap `designs/claude/claude.tokens.json` for a different design
3. **No hardcoding** — Composition uses `TOKEN.*` constants
4. **Maintainable** — Change the design without touching code

### Why route scenes by beat + content?

The script generator produces:
```json
{ beat: "hook", highlightWords: ["motorcade", "plaza"], ... }
```

The composition uses these to automatically pick the right template:
- `beat === "hook"` → TplEditorialHeadline (bold, large)
- `dataValue !== null` → TplStatCallout (giant number)
- `beat === "build"` → TplTextDominant or TplSplitPhotoData
- etc.

No guessing. No manual routing. Metadata drives the layout.

---

## Environment Variables

Create `.env` in the root:

```env
ELEVEN_LABS_API_KEY=sk-...          # For Stage 3
LM_STUDIO_BASE_URL=http://localhost:1234/v1  # For Stage 1
```

Or set them directly:
```bash
export ELEVEN_LABS_API_KEY=sk-...
export LM_STUDIO_BASE_URL=http://localhost:1234/v1
npm run pipeline
```

---

## Example Workflow

### Input: Topic brief

File: `data/input/input.txt`
```
The Kennedy assassination on November 22, 1963 in Dallas, Texas.
Explore the events, key figures, and historical impact of this pivotal moment.
```

### Run Stage 1: Generate script

```bash
npm run pipeline \
  --guide guides/history/documentary.md \
  --tokens designs/claude/claude.tokens.json
```

**Output**:
- `data/output/script.json`: 19 sentences with beat, highlightWords, dataValue
- `data/output/claude_prompt.txt`: Handoff guide

### Build composition (using handoff guide)

Open `data/output/claude_prompt.txt` and follow:
1. Read `guides/history/documentary.md` for templates
2. Read `designs/claude/claude.tokens.json` for tokens
3. Build `src/compositions/GeneratedComposition.tsx`
4. Update `src/Root.tsx`

### Run Stage 2: Render video

```bash
npm run start          # Preview in studio
npm run build          # Render to MP4
```

**Output**: `out/video.mp4` (silent)

### Run Stage 3 & 4: Add audio (optional)

```bash
npm run audio:generate --voice-id <voice-id>
npm run audio:stitch
```

**Output**: `out/video_with_audio.mp4` (with narration)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Script generation fails** | Check LM Studio is running (`http://localhost:1234`) |
| **Pipeline won't start** | Verify `data/input/input.txt` exists and is not empty |
| **Video renders but looks wrong** | Review guide + tokens, check beat field in script |
| **Audio generation fails** | Check `ELEVEN_LABS_API_KEY` is set, verify internet |
| **Audio stitch fails** | Ensure ffmpeg is installed, check video.mp4 and voice.mp3 exist |
| **"Can't find module X"** | Run `npm install` to ensure all dependencies are present |

---

## What Changed from the Original

| Aspect | Before | After |
|--------|--------|-------|
| **Pipeline scope** | Script + audio generation | Script generation only |
| **Handoff method** | Printed large block to terminal | Saved `claude_prompt.txt` to file |
| **Design system** | Guides embedded in comments | Loaded from `guides/*.md` + tokens |
| **Audio** | Optional flag in main pipeline | Completely separate workflow |
| **Composition** | Built during pipeline | Built using handoff guide + script |

---

## Next Steps

1. **Generate a script** → `npm run pipeline --guide ... --tokens ...`
2. **Review the handoff prompt** → Open `data/output/claude_prompt.txt`
3. **Build the composition** → Use guide + tokens to create scenes
4. **Render the video** → `npm run build`
5. **(Optional) Add audio** → `npm run audio:generate && npm run audio:stitch`

That's it. No more guessing. Guides and tokens tell you everything.
