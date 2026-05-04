# YT Shorts Generation Workflow

This pipeline is **intentionally separated into independent stages**:


1. **Script Generation** (via LLM)
2. **Video Rendering** (via Remotion)
3. **Audio Generation** (via ElevenLabs) — *optional, separate workflow*
4. **Audio Stitching** (via ffmpeg) — *optional, separate workflow*


---

## Stage 1: Script Generation

**Input**: Topic brief in `data/input/input.txt`

**Command**:

```bash
npm run pipeline [--guide guides/history/documentary.md] [--tokens designs/claude/claude.tokens.json]
```

**Output**:

* `data/output/script.json` — 19 sentences with metadata (beat, highlightWords, dataValue)
* `data/output/claude_prompt.txt` — Handoff guide for composition building

**What it does**:

* Reads guide and design tokens (if provided)
* Generates script using LLM
* Saves handoff prompt to file (NOT console)

**Example**:

```bash
npm run pipeline --guide guides/history/documentary.md --tokens designs/claude/claude.tokens.json
```


---

## Stage 2: Video Rendering

**Input**: Generated script in `data/output/script.json`

**Command**:

```bash
npm run start          # Preview in dev studio (http://localhost:3000)
npm run build          # Render to MP4
```

**Output**:

* `out/video.mp4` — Silent video (no audio track)

**What it does**:

* Loads script.json via Root.tsx
* Routes sentences to scene templates (HookScene, BodyScenes, CTAScene)
* Applies design tokens for styling
* Renders 1080×1920 vertical video at 30fps

**Design-Driven**:
The composition respects the design guide (`guides/history/documentary.md`) for:

* Scene templates (TplEditorialHeadline, TplStatCallout, etc.)
* Typography (serif display, sans body, mono code)
* Colors (from `designs/claude/claude.tokens.json`)
* Motion & animation (prog/lerp functions, easing curves)


---

## Stage 3: Audio Generation (Optional)

**Input**: Generated script in `data/output/script.json`

**Command**:

```bash
npm run audio:generate [--voice-id <eleven-labs-voice-id>]
```

**Output**:

* `public/voice.mp3` — Full narration audio
* `public/timing.json` — Word-level timestamps (start/end per word)

**What it does**:

* Reads sentences from script.json
* Calls ElevenLabs API (requires `ELEVEN_LABS_API_KEY`)
* Generates per-word timing data for karaoke sync

**Note**: This step is entirely optional. The video renders correctly without it.


---

## Stage 4: Audio Stitching (Optional)

**Input**:

* `out/video.mp4` (silent video from Stage 2)
* `public/voice.mp3` (audio from Stage 3)

**Command**:

```bash
npm run audio:stitch
```

**Output**:

* `out/video_with_audio.mp4` — Final video with audio track

**What it does**:

* Uses ffmpeg to combine video + audio
* Copies video codec (no re-encoding)
* Encodes audio as AAC
* Outputs publication-ready MP4


---

## Quick Start

### Just render a silent video:

```bash
npm run pipeline --guide guides/history/documentary.md --tokens designs/claude/claude.tokens.json
npm run start          # Preview
npm run build          # Render
# → out/video.mp4
```

### Render + add audio:

```bash
npm run pipeline --guide guides/history/documentary.md --tokens designs/claude/claude.tokens.json
npm run build
npm run audio:generate --voice-id <voice-id>
npm run audio:stitch
# → out/video_with_audio.mp4
```


---

## Key Design Decisions

### Why separate?


1. **Audio is optional** — Many videos are better without narration or use different workflows
2. **Independence** — Each stage can fail/retry without affecting others
3. **Flexibility** — Reuse the same script + video with different audio (multiple languages, re-record)
4. **Clarity** — Clear responsibilities for each tool (LLM → Remotion → ElevenLabs → ffmpeg)

### Handoff is in a file, not console

* **Old**: Printed prompt to terminal (hard to copy, lost on scroll)
* **New**: Saved to `data/output/claude_prompt.txt` (persistent, easy to reference)

The prompt contains:

* What script was generated
* Where design tokens came from
* Scene templates available from the guide
* How to build the composition

### Design tokens drive styling

Rather than hardcoding colors/fonts/spacing in the composition:

* Load tokens from `designs/claude/claude.tokens.json`
* Use TOKEN.\* constants (TOKEN.gold, TOKEN.sans, TOKEN.spacing.xl)
* Switch designs by changing the tokens file


---

## Environment Variables

Create a `.env` file (or set these in your shell):

```env
ELEVEN_LABS_API_KEY=sk-...
LM_STUDIO_BASE_URL=http://localhost:1234/v1
```


---

## Files Reference

| File | Purpose |
|----|----|
| `pipeline.ts` | Script generation only |
| `audio-workflow.ts` | Audio generation + stitching |
| `src/Root.tsx` | Loads script.json, registers composition |
| `guides/history/documentary.md` | Design system & scene templates |
| `designs/claude/claude.tokens.json` | Design tokens (colors, typography, spacing) |
| `data/output/script.json` | Generated script (19 sentences with metadata) |
| `data/output/claude_prompt.txt` | Handoff guide for composition builder |
| `public/voice.mp3` | Generated narration (optional) |
| `public/timing.json` | Word-level timestamps (optional) |
| `out/video.mp4` | Rendered silent video |
| `out/video_with_audio.mp4` | Final video with audio (optional) |


---

## Troubleshooting

**Q: Script generation fails**

* Check `data/input/input.txt` exists and is not empty
* Verify LM Studio is running (http://localhost:1234)
* Check `.env` has required API keys

**Q: Video renders but looks wrong**

* Review `guides/history/documentary.md` scene templates
* Verify `designs/claude/claude.tokens.json` colors/fonts are correct
* Check console for Remotion errors

**Q: Audio generation fails**

* Verify `ELEVEN_LABS_API_KEY` is set
* Check internet connection
* Ensure script.json exists

**Q: Audio stitching fails**

* Verify `out/video.mp4` exists (run `npm run build`)
* Verify `public/voice.mp3` exists (run `npm run audio:generate`)
* Ensure ffmpeg is installed: `ffmpeg -version`


