// Pipeline: input.txt → data/output/script.json + public/voice.mp3 + public/timing.json
// After completion, a Claude Code prompt is printed — paste it to build the Remotion composition.
//
// Usage: npm run pipeline [--skip-audio] [--voice-id <id>]
//        [--tokens ./designs/<file>.tokens.json] [--guide guides/history/documentary.md]
import * as fs from "fs";
import * as path from "path";
import { generateVideoSpec } from "./lmstudio/orchestrate";
import { TokenMapSchema } from "./lmstudio/index";
import type { TokenMap } from "./lmstudio/index";
import { parseFlags } from "./pipelineHelpers";
import { generateAudioStep } from "./pipelineAudio";
import { stepStart, stepDone, stepFail } from "./trace";

try { require("dotenv").config(); } catch {}

const INPUT_FILE  = path.join(__dirname, "data", "input", "input.txt");
const OUTPUT_DIR  = path.join(__dirname, "data", "output");
const PUBLIC_DIR  = path.join(__dirname, "public");
const AUDIO_NAME  = "voice.mp3";
const TIMING_NAME = "timing.json";

async function runPipeline(): Promise<void> {
  const { skipAudio, voiceId, tokensPath, guide } = parseFlags();
  const pipelineStart = Date.now();

  console.log("\n╔═════════════════════════════════════════════════════╗");
  console.log("║       YT Shorts — Script & Audio Pipeline           ║");
  console.log("╚═════════════════════════════════════════════════════╝");

  // ── STEP 0: Load design tokens (optional) ──────────────────────────────────
  let tokens: TokenMap | undefined;
  if (tokensPath) {
    stepStart("STEP 0  Load design tokens");
    if (!fs.existsSync(tokensPath)) {
      stepFail(`Tokens file not found: ${tokensPath}`); process.exit(1);
    }
    let rawTokens: unknown;
    try { rawTokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8")); }
    catch { stepFail(`Failed to parse tokens file: ${tokensPath}`); process.exit(1); }
    const result = TokenMapSchema.safeParse(rawTokens);
    if (!result.success) {
      stepFail(`Tokens validation failed: ${result.error.message}`); process.exit(1);
    }
    tokens = result.data;
    stepDone("STEP 0  Load design tokens", tokensPath);
  }

  // ── STEP 1: Read input ──────────────────────────────────────────────────────
  stepStart("STEP 1  Read input.txt");
  if (!fs.existsSync(INPUT_FILE)) {
    stepFail(`input.txt not found: ${INPUT_FILE}`); process.exit(1);
  }
  const rawInput = fs.readFileSync(INPUT_FILE, "utf-8").trim();
  if (!rawInput) { stepFail("input.txt is empty."); process.exit(1); }
  stepDone("STEP 1  Read input.txt", `${rawInput.split(/\s+/).length} words`);

  // ── STEP 2: Script generation ───────────────────────────────────────────────
  stepStart("STEP 2  LM Studio — script generation");
  const { videoSpec, savedTo: ttsScriptPath } = await generateVideoSpec(rawInput, {
    outputDir: OUTPUT_DIR,
    guide,
    tokens,
  });
  const scriptJsonPath = path.join(OUTPUT_DIR, "script.json");
  stepDone("STEP 2  LM Studio", `${videoSpec.sentences.length} sentences → data/output/script.json`);

  // ── STEP 3: ElevenLabs TTS ──────────────────────────────────────────────────
  stepStart("STEP 3  ElevenLabs — voice over + word timestamps");
  const { audioFile, wordTimings, durationSec } = await generateAudioStep(
    ttsScriptPath, PUBLIC_DIR, AUDIO_NAME, TIMING_NAME,
    { skipAudio, voiceId, sentenceTexts: videoSpec.sentences.map(s => s.text) },
  );
  if (audioFile) {
    stepDone("STEP 3  ElevenLabs",
      `${durationSec.toFixed(1)}s · ${wordTimings.length} words · public/${AUDIO_NAME}`);
  } else {
    stepDone("STEP 3  ElevenLabs", "skipped");
  }

  // ── HANDOFF ─────────────────────────────────────────────────────────────────
  printHandoff({
    scriptJsonPath,
    audioPath:     audioFile ? path.join(PUBLIC_DIR, AUDIO_NAME)  : null,
    timingPath:    audioFile ? path.join(PUBLIC_DIR, TIMING_NAME) : null,
    tokensPath:    tokensPath ?? null,
    topic:         videoSpec.topic,
    accentColor:   videoSpec.accentColor,
    sentenceCount: videoSpec.sentences.length,
    durationSec,
    elapsed:       ((Date.now() - pipelineStart) / 1000).toFixed(1),
  });
}

function printHandoff(opts: {
  scriptJsonPath: string;
  audioPath:      string | null;
  timingPath:     string | null;
  tokensPath:     string | null;
  topic:          string;
  accentColor:    string;
  sentenceCount:  number;
  durationSec:    number;
  elapsed:        string;
}): void {
  const {
    scriptJsonPath, audioPath, timingPath, tokensPath,
    topic, accentColor, sentenceCount, durationSec, elapsed,
  } = opts;

  const line = "═".repeat(64);
  const dash = "─".repeat(64);

  console.log(`\n  Done in ${elapsed}s`);
  console.log(line);
  console.log("\n  ASSETS READY");
  console.log(`    Script  : ${scriptJsonPath}`);
  if (audioPath)  console.log(`    Audio   : ${audioPath}`);
  if (timingPath) console.log(`    Timing  : ${timingPath}`);
  if (tokensPath) console.log(`    Tokens  : ${tokensPath}`);

  // ── Font loading guidance ──────────────────────────────────────────────────
  const fontSection = tokensPath
    ? `FONT LOADING — CRITICAL
The tokens file (${tokensPath}) has a \`fontFamily\` CSS string.
Remotion renders in headless Chromium — custom system fonts do not exist there.
You MUST pick one approach before writing any text component:

  A) Google Fonts (recommended — zero file management):
       npm install @remotion/google-fonts
       import { loadFont } from "@remotion/google-fonts/Inter";   // closest match
       const { waitUntilDone } = loadFont();
       // call this once at the top of Root.tsx, before any component renders

  B) Local font file (.woff2 or .ttf already on disk):
       Copy the file to public/fonts/MyFont.woff2
       import { loadFont } from "@remotion/core";
       import { staticFile } from "remotion";
       loadFont({ family: "MyFont", url: staticFile("fonts/MyFont.woff2"), weight: "400" });

  C) Accepted substitution: document which Google Font you chose and why.

Do NOT leave fontFamily as a bare CSS string — Remotion silently falls back to
system-ui and the design tokens become meaningless in the rendered video.`
    : `FONTS
Use @remotion/google-fonts or load .woff2 files via staticFile("fonts/...").
Do not use bare CSS fontFamily strings — headless Chromium has no custom fonts
and Remotion will silently fall back to system-ui.`;

  // ── Audio / timing section ─────────────────────────────────────────────────
  const audioSection = audioPath && timingPath
    ? `Audio file  : ${audioPath}
Timing JSON : ${timingPath}

timing.json is an array of WordTiming objects:
  { word: string; start: number; end: number; sentenceIndex: number }
sentenceIndex is 0-based and maps each word to its sentence.
Compute each scene's start time and duration from the first/last word
in each sentenceIndex group — do not use suggested_duration_ms from the script.`
    : `Audio and timing were not generated (--skip-audio was set).
Run the pipeline without --skip-audio to produce public/voice.mp3 and public/timing.json.
Until then, fall back to sentence.suggested_duration_ms for scene durations.`;

  const prompt = `
${line}
  CLAUDE CODE PROMPT — Build Remotion Composition
  Copy everything between the lines into Claude Code.
${line}

You are building a Remotion video composition for a YouTube Short.
Spec: 1080 × 1920 px  ·  30 fps  ·  vertical  ·  no intro logo animation.

TOPIC        : ${topic}
ACCENT COLOR : ${accentColor}
SENTENCES    : ${sentenceCount}
DURATION     : ${durationSec > 0 ? `${durationSec.toFixed(1)}s` : "(generate audio first)"}

${dash}
INPUT FILES
${dash}
Script JSON  : ${scriptJsonPath}
${audioPath  ? `Audio        : ${audioPath}` : "Audio        : (run pipeline without --skip-audio)"}
${timingPath ? `Timing JSON  : ${timingPath}` : "Timing JSON  : (run pipeline without --skip-audio)"}${tokensPath ? `\nDesign Tokens: ${tokensPath}` : ""}

${dash}
AUDIO & TIMING
${dash}
${audioSection}

${dash}
SCRIPT STRUCTURE
${dash}
Read ${scriptJsonPath}. Each sentence object has:
  index               — 1-based scene number
  text                — narration text for this scene
  beat                — "hook" | "build" | "turn" | "reveal" | "breathe" | "close"
  highlightWords      — 1–3 words to render in ${accentColor}, one font-weight heavier
  dataValue           — number or null; non-null → consider a large animated counter
  visualQuery         — string or null; use as image search query for photo backgrounds
  needsImage          — boolean hint; true → this scene benefits from a photo bg
  suggested_duration_ms — fallback duration when timing.json is unavailable

Beat → visual treatment guide:
  hook     → bold editorial headline, dark background, large display text
  build    → standard narration overlay, optional subtle background
  turn     → high-contrast layout, strong accent emphasis, mild layout shift
  reveal   → large stat callout if dataValue is set; else bold centered text
  breathe  → minimal text, maximum negative space, slow pacing
  close    → center-aligned, smaller text, fade-to-black

${dash}
${fontSection}

${dash}
QUALITY REQUIREMENTS
${dash}
• Background: #0d0d0d (near-black — never pure #000000)
• Text: #f0f0f0 (near-white)
• All animation via Remotion interpolate() / spring() — no CSS transitions, no @keyframes
• No border-radius > 4px on any element
• Karaoke: each word highlights as its \`start\` timestamp passes in the audio
• Include <Audio src={staticFile("${AUDIO_NAME}")} /> in the composition root
• Scene durations must come from timing.json boundaries, not hardcoded values
• Register as "ShortsComposition" in src/Root.tsx (width: 1080, height: 1920, fps: 30)

${dash}
DO NOT
${dash}
• No intro logo animation or countdown screen
• No Inter, Roboto, or Arial as the primary font
• No hardcoded hex values inside components — use a palette constant or context
• No CSS animation / transition / @keyframes anywhere
• No third-party animation libraries (framer-motion, gsap, anime.js, etc.)

${dash}
OUTPUT
${dash}
Produce : src/compositions/GeneratedComposition.tsx
Update  : src/Root.tsx   (register the composition)
Test    : npx remotion render ShortsComposition out/video.mp4 --props=props.json

${line}`;

  console.log(prompt);
  console.log(`  Copy the block above into Claude Code to build the composition.`);
  console.log(line + "\n");
}

runPipeline().catch((err) => {
  stepFail(`Pipeline failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
