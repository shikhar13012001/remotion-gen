// Pipeline: input.txt -> data/output/script.json -> optional audio -> out/prompt/claude.md
// Usage:
//   npm run pipeline -- --design designs/claude/DESIGN.md --guide guides/history/documentary.md
//   npm run pipeline -- --skip-audio
//   npm run pipeline -- --voice-id <id>
import * as fs from "fs";
import * as path from "path";
import { generateVideoSpec } from "./lmstudio/orchestrate";
import { parseFlags } from "./pipelineHelpers";
import { generateAudioStep } from "./pipelineAudio";
import { stepStart, stepDone, stepFail } from "./trace";
import {
  buildDesignConstantsBlock,
  defaultDesignSystem,
  extractDesignSystem,
  toTokensSnapshot,
} from "./lmstudio/designExtractor";
import { generateFallbackBrief, runArtDirector } from "./lmstudio/artDirector";
import { buildHandoffPrompt } from "./lmstudio/handoffPrompt";
import { resolveImageAssets } from "./pipelineImages";

try {
  require("dotenv").config();
} catch {}

const INPUT_FILE = path.join(__dirname, "data", "input", "input.txt");
const OUTPUT_DIR = path.join(__dirname, "data", "output");
const PUBLIC_DIR = path.join(__dirname, "public");
const PROMPT_FILE = path.join(__dirname, "out", "prompt", "claude.md");

async function runPipeline(): Promise<void> {
  const { designPath, guide, skipAudio, skipImages, voiceId } = parseFlags();
  const pipelineStart = Date.now();

  console.log("\nYT Shorts - Script Generation Pipeline");
// get the design path and guide path from the command line flags, and read their content if they exist. This allows the LLM to receive the actual design tokens and guide content, rather than just file paths.
  let designContent: string | undefined;
  if (designPath) {
    stepStart("STEP 1  Load design system");
    if (!fs.existsSync(designPath)) {
      stepFail(`Design file not found: ${designPath}`);
      process.exit(1);
    }
    designContent = fs.readFileSync(designPath, "utf-8");
    stepDone("STEP 1  Load design system", designPath);
  }
// The guide is optional, so we attempt to read it if provided, but don't fail if it's missing. The design file is more critical since it provides the color tokens needed for the video spec.
  let guideContent: string | undefined;
  if (guide) {
    const guideAbs = path.isAbsolute(guide) ? guide : path.resolve(__dirname, guide);
    if (fs.existsSync(guideAbs)) {
      guideContent = fs.readFileSync(guideAbs, "utf-8");
    } else {
      console.warn(`  Guide not found; continuing without guide content: ${guide}`);
    }
  }

  stepStart("STEP 2  Read input.txt");
  if (!fs.existsSync(INPUT_FILE)) {
    stepFail(`input.txt not found: ${INPUT_FILE}`);
    process.exit(1);
  }
  const rawInput = fs.readFileSync(INPUT_FILE, "utf-8").trim();
  if (!rawInput) {
    stepFail("input.txt is empty.");
    process.exit(1);
  }
  stepDone("STEP 2  Read input.txt", `${rawInput.split(/\s+/).length} words`);

  stepStart("STEP 3  Generate script");
  const { videoSpec, savedTo: scriptTxtPath } = await generateVideoSpec(rawInput, {
    outputDir: OUTPUT_DIR,
    guide,
    design: designPath,
  });
  const scriptJsonPath = path.join(OUTPUT_DIR, "script.json");
  stepDone("STEP 3  Script generation", `${videoSpec.sentences.length} sentences -> data/output/script.json`);

  stepStart("STEP 4  Generate audio");
  const audioResult = await generateAudioStep(scriptTxtPath, PUBLIC_DIR, "voice.mp3", "timing.json", {
    skipAudio,
    voiceId,
    sentenceTexts: videoSpec.sentences.map((sentence) => sentence.text),
  });
  if (audioResult.audioFile) {
    stepDone("STEP 4  Generate audio", `${audioResult.durationSec.toFixed(1)}s -> public/voice.mp3 + timing.json`);
  } else {
    stepDone("STEP 4  Generate audio", "skipped");
  }

  stepStart("STEP 5  Extract design tokens");
  const designSystem = designContent
    ? extractDesignSystem(designContent, videoSpec.accentColor)
    : defaultDesignSystem(videoSpec.accentColor);
  const designBlock = buildDesignConstantsBlock(designSystem);
  const tokensOutPath = path.join(OUTPUT_DIR, "design_tokens.json");
  fs.writeFileSync(tokensOutPath, JSON.stringify(toTokensSnapshot(designSystem), null, 2), "utf-8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "design_block.txt"), designBlock, "utf-8");
  stepDone("STEP 5  Extract design tokens", `data/output/design_tokens.json (${designSystem.tokens.name})`);

  stepStart("STEP 6  Resolve image assets");
  const imageManifest = await resolveImageAssets({
    spec: videoSpec,
    outputDir: OUTPUT_DIR,
    publicDir: PUBLIC_DIR,
    skipImages,
  });
  if (imageManifest.entries.length > 0) {
    stepDone("STEP 6  Resolve image assets", `${imageManifest.entries.length} assets -> data/output/image_manifest.json`);
  } else {
    stepDone("STEP 6  Resolve image assets", skipImages ? "skipped" : "no assets resolved");
  }

  stepStart("STEP 7  Art direction");
  let artDirection = await runArtDirector(videoSpec, {
    guide: guideContent,
    designBlock,
  });
  if (!artDirection) {
    artDirection = generateFallbackBrief(videoSpec, videoSpec.accentColor);
    stepDone("STEP 7  Art direction", "LLM unavailable; using rule-based fallback brief");
  } else {
    stepDone("STEP 7  Art direction", `${videoSpec.sentences.length} scenes directed`);
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, "art_direction.md"), artDirection, "utf-8");

  stepStart("STEP 8  Save handoff prompt");
  saveHandoffPrompt({
    promptFile: PROMPT_FILE,
    scriptJsonPath,
    guidePath: guide ?? null,
    topic: videoSpec.topic,
    accentColor: designSystem.tokens.accent,
    sentenceCount: videoSpec.sentences.length,
    hasAudio: Boolean(audioResult.audioFile),
  });
  stepDone("STEP 8  Save handoff prompt", PROMPT_FILE);

  console.log(`\nPipeline complete in ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s`);
  console.log("\nOutputs:");
  console.log("   Script  : data/output/script.json");
  console.log("   Context : data/output/script_context.json");
  console.log("   Plan    : data/output/script_plan.json");
  console.log("   Trace   : data/output/script_trace.json");
  if (audioResult.audioFile) {
    console.log("   Audio   : public/voice.mp3");
    console.log("   Timing  : public/timing.json");
  }
  console.log("   Design  : data/output/design_tokens.json");
  console.log("   Images  : data/output/image_manifest.json");
  console.log("   Art Dir : data/output/art_direction.md");
  console.log("   Prompt  : out/prompt/claude.md");
}

function saveHandoffPrompt(opts: {
  promptFile: string;
  scriptJsonPath: string;
  guidePath: string | null;
  topic: string;
  accentColor: string;
  sentenceCount: number;
  hasAudio: boolean;
}): void {
  const prompt = buildHandoffPrompt({
    topic: opts.topic,
    accentColor: opts.accentColor,
    sentenceCount: opts.sentenceCount,
    hasAudio: opts.hasAudio,
    guidePath: opts.guidePath,
    scriptJsonPath: opts.scriptJsonPath,
  });

  fs.mkdirSync(path.dirname(opts.promptFile), { recursive: true });
  fs.writeFileSync(opts.promptFile, prompt, "utf-8");
  console.log(`\nHandoff prompt saved: ${opts.promptFile}`);
}

runPipeline().catch((err) => {
  stepFail(`Pipeline failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
