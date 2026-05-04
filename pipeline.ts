// Pipeline: input.txt → data/output/script.json → public/voice.mp3 + timing.json → out/prompt/claude.md
// Uses guides (./guides/*.md) and design tokens (./designs/**/*.tokens.json)
//
// Usage: npm run pipeline [--tokens ./designs/<file>.tokens.json] [--guide guides/history/documentary.md]
//        npm run pipeline --skip-audio          (skip ElevenLabs TTS step)
//        npm run pipeline --voice-id <id>       (override ElevenLabs voice)
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
const PROMPT_FILE = path.join(__dirname, "out", "prompt", "claude.md");

async function runPipeline(): Promise<void> {
  const { tokensPath, guide, skipAudio, voiceId } = parseFlags();
  const pipelineStart = Date.now();

  console.log("\n╔═════════════════════════════════════════════════════╗");
  console.log("║    YT Shorts — Script Generation Pipeline           ║");
  console.log("╚═════════════════════════════════════════════════════╝");

  // ── STEP 1: Load design tokens ─────────────────────────────────────────────
  let tokens: TokenMap | undefined;
  if (tokensPath) {
    stepStart("STEP 1  Load design tokens");
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
    stepDone("STEP 1  Load design tokens", tokensPath);
  }

  // ── STEP 2: Read input brief ───────────────────────────────────────────────
  stepStart("STEP 2  Read input.txt");
  if (!fs.existsSync(INPUT_FILE)) {
    stepFail(`input.txt not found: ${INPUT_FILE}`); process.exit(1);
  }
  const rawInput = fs.readFileSync(INPUT_FILE, "utf-8").trim();
  if (!rawInput) { stepFail("input.txt is empty."); process.exit(1); }
  stepDone("STEP 2  Read input.txt", `${rawInput.split(/\s+/).length} words`);

  // ── STEP 3: Script generation ──────────────────────────────────────────────
  stepStart("STEP 3  Generate script");
  const { videoSpec, savedTo: scriptTxtPath } = await generateVideoSpec(rawInput, {
    outputDir: OUTPUT_DIR,
    guide,
    tokens,
  });
  const scriptJsonPath = path.join(OUTPUT_DIR, "script.json");
  stepDone("STEP 3  Script generation", `${videoSpec.sentences.length} sentences → data/output/script.json`);

  // ── STEP 4: Audio generation (ElevenLabs TTS) ─────────────────────────────
  stepStart("STEP 4  Generate audio");
  const audioResult = await generateAudioStep(
    scriptTxtPath,
    PUBLIC_DIR,
    "voice.mp3",
    "timing.json",
    { skipAudio, voiceId, sentenceTexts: videoSpec.sentences.map(s => s.text) },
  );
  if (audioResult.audioFile) {
    stepDone("STEP 4  Generate audio", `${audioResult.durationSec.toFixed(1)}s → public/voice.mp3 + timing.json`);
  } else {
    stepDone("STEP 4  Generate audio", "skipped (no API key or --skip-audio flag)");
  }

  // ── STEP 5: Save handoff prompt ────────────────────────────────────────────
  stepStart("STEP 5  Save handoff prompt");
  saveHandoffPrompt({
    promptFile:    PROMPT_FILE,
    scriptJsonPath,
    tokensPath:    tokensPath ?? null,
    topic:         videoSpec.topic,
    accentColor:   videoSpec.accentColor,
    sentenceCount: videoSpec.sentences.length,
    hasAudio:      !!audioResult.audioFile,
  });
  stepDone("STEP 5  Save handoff prompt", PROMPT_FILE);

  // ── COMPLETION ─────────────────────────────────────────────────────────────
  console.log(`\n✅ Pipeline complete in ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s`);
  console.log(`\n📄 Outputs:`);
  console.log(`   Script  : data/output/script.json`);
  if (audioResult.audioFile) {
    console.log(`   Audio   : public/voice.mp3`);
    console.log(`   Timing  : public/timing.json`);
  }
  console.log(`   Prompt  : out/prompt/claude.md`);
  console.log(`\n▶  Open out/prompt/claude.md and follow the instructions to build the composition.`);
}

function saveHandoffPrompt(opts: {
  promptFile:     string;
  scriptJsonPath: string;
  tokensPath:     string | null;
  topic:          string;
  accentColor:    string;
  sentenceCount:  number;
  hasAudio:       boolean;
}): void {
  const { promptFile, scriptJsonPath, tokensPath, topic, accentColor, sentenceCount, hasAudio } = opts;

  const audioSection = hasAudio
    ? `Audio         : public/voice.mp3\nTiming        : public/timing.json`
    : `(No audio — run \`npm run gen:audio\` to generate separately)`;

  const prompt = `# Build Remotion Composition from Generated Script

Topic         : ${topic}
Script        : ${scriptJsonPath}
Sentences     : ${sentenceCount}
Accent Color  : ${accentColor}
${tokensPath ? `Design Tokens : ${tokensPath}\n` : ""}${audioSection}

## Read the script and use the guides

1. Open: guides/history/documentary.md (or the relevant guide for your topic)
2. Design tokens: ${tokensPath || "designs/**/*.tokens.json"}
3. Map each sentence to a scene template based on:
   - beat field (hook, build, turn, reveal, breathe, close)
   - Content type (narrative, data, rhetorical)
   - Accent words (render in accent color)

## Scene templates available (from guide)

- TplEditorialHeadline  (hook, close, section breaks)
- TplStatCallout        (numbers, dates, data)
- TplTimeline           (chronological sequences)
- TplFlowDiagram        (cause-effect, processes)
- TplTextDominant       (narration only, no imagery)
- TplSplitPhotoData     (photo + facts)
- TplSubjectCutout      (person/subject feature)
- TplTransitionWipe     (major section breaks)

## Build composition

Use the script metadata (beat, highlightWords, dataValue) to select templates.
Render with design tokens for colors, typography, spacing.
No hardcoded values — use TOKEN.* constants from guide.

## Output

Create: src/compositions/GeneratedComposition.tsx
Update: src/Root.tsx (register composition)
Render: npm run build
`;

  fs.mkdirSync(path.dirname(promptFile), { recursive: true });
  fs.writeFileSync(promptFile, prompt, "utf-8");

  console.log(`\n✅ Handoff prompt saved: ${promptFile}`);
}

runPipeline().catch((err) => {
  stepFail(`Pipeline failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
