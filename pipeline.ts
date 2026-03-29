// Pipeline: input.txt → LM Studio → ElevenLabs → Remotion → ffmpeg
// Usage: npm run pipeline [--skip-audio] [--skip-stitch] [--voice-id <id>]
import * as fs from "fs";
import * as path from "path";
import { generateVideoSpec } from "./lmstudio/index";
import { resolveClips, parseFlags, estimateFrames, stitchAudio, remotionRender, logPipelineSummary } from "./pipelineHelpers";
import { generateAudioStep } from "./pipelineAudio";
import { stepStart, stepDone, stepFail, logNewDirectiveTable, logRenderSummary } from "./trace";

try { require("dotenv").config(); } catch {}

const INPUT_FILE  = path.join(__dirname, "data", "input", "input.txt");
const PUBLIC_DIR  = path.join(__dirname, "public");
const AUDIO_NAME  = "voice.mp3";
const TIMING_NAME = "timing.json";
const OUT_FILE    = path.join(__dirname, "out",  "video.mp4");
const DIST_FILE   = path.join(__dirname, "dist", "final.mp4");

async function runPipeline(): Promise<void> {
  const { skipAudio, skipStitch, voiceId, clips: explicitClips, bgMusic } = parseFlags();
  const pipelineStart = Date.now();

  console.log("\n╔═════════════════════════════════════════════════════╗");
  console.log("║           YT Shorts — Director Pipeline             ║");
  console.log("╚═════════════════════════════════════════════════════╝");

  // ── STEP 1: Read input ──────────────────────────────────────────────────────
  stepStart("STEP 1/5  Read input.txt");
  if (!fs.existsSync(INPUT_FILE)) {
    stepFail(`input.txt not found at ${INPUT_FILE}`); process.exit(1);
  }
  const rawInput = fs.readFileSync(INPUT_FILE, "utf-8").trim();
  if (!rawInput) { stepFail("input.txt is empty."); process.exit(1); }
  const wordCount = rawInput.split(/\s+/).length;
  stepDone("STEP 1/5  Read input.txt", `${wordCount} words`);

  // ── STEP 2: LLM — script + visual directives ────────────────────────────────
  stepStart("STEP 2/5  LM Studio — script + visual directives");
  const { videoSpec, metadata, savedTo: scriptPath } = await generateVideoSpec(rawInput, {
    outputDir: path.join(__dirname, "data", "output"),
  });
  logNewDirectiveTable(videoSpec.directives);
  stepDone("STEP 2/5  LM Studio", `${videoSpec.directives.length} directives → data/output/videospec.json`);

  // ── STEP 3: ElevenLabs TTS ──────────────────────────────────────────────────
  stepStart("STEP 3/5  ElevenLabs — voice over + word timestamps");
  const { audioFile, wordTimings, durationSec } = await generateAudioStep(
    scriptPath, PUBLIC_DIR, AUDIO_NAME, TIMING_NAME,
    { skipAudio, voiceId, sentenceTexts: videoSpec.sentences.map(s => s.text) }
  );
  stepDone("STEP 3/5  ElevenLabs", audioFile
    ? `${durationSec.toFixed(1)}s audio · ${wordTimings.length} words`
    : "skipped");

  // ── STEP 4: Remotion render ─────────────────────────────────────────────────
  stepStart("STEP 4/5  Remotion — render video");
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const allText = videoSpec.sentences.map(s => s.text).join(" ");
  const durationInFrames = durationSec > 0
    ? Math.round((durationSec + 1.5) * 30) : estimateFrames(allText);

  const totalScenes     = wordTimings.length > 0
    ? (wordTimings[wordTimings.length - 1]?.sentenceIndex ?? 0) + 2 : videoSpec.sentences.length;
  const backgroundClips = resolveClips(PUBLIC_DIR, totalScenes, explicitClips);

  logRenderSummary({
    durationInFrames,
    scenes:      videoSpec.directives.length,
    clips:       backgroundClips.length,
    wordTimings: wordTimings.length,
    bgMusic,
  });

  const props = { videoSpec, metadata, wordTimings, audioFile, durationInFrames, backgroundClips, bgMusicFile: bgMusic ?? "" };
  const propsFile = path.join(__dirname, "props.json");
  fs.writeFileSync(propsFile, JSON.stringify(props, null, 2), "utf-8");

  if (!remotionRender(OUT_FILE, propsFile)) {
    fs.rmSync(propsFile, { force: true });
    stepFail("Remotion render failed."); process.exit(1);
  }
  fs.rmSync(propsFile, { force: true });
  stepDone("STEP 4/5  Remotion", OUT_FILE);

  // ── STEP 5: ffmpeg stitch ───────────────────────────────────────────────────
  stepStart("STEP 5/5  ffmpeg — stitch audio + video");
  let finalFile = OUT_FILE;
  fs.mkdirSync(path.dirname(DIST_FILE), { recursive: true });

  if (skipStitch) {
    stepDone("STEP 5/5  ffmpeg", "skipped (--skip-stitch)");
  } else if (audioFile) {
    const ok = stitchAudio(OUT_FILE, path.join(PUBLIC_DIR, AUDIO_NAME), DIST_FILE);
    if (!ok) {
      console.warn("  ffmpeg stitch failed — copying raw render.");
      fs.copyFileSync(OUT_FILE, DIST_FILE);
    } else {
      finalFile = DIST_FILE;
    }
    stepDone("STEP 5/5  ffmpeg", finalFile);
  } else {
    fs.copyFileSync(OUT_FILE, DIST_FILE);
    finalFile = DIST_FILE;
    stepDone("STEP 5/5  ffmpeg", `copied (no audio) → ${DIST_FILE}`);
  }

  logPipelineSummary({
    elapsed: ((Date.now() - pipelineStart) / 1000).toFixed(1),
    scriptPath, audioFile, outFile: OUT_FILE, distFile: DIST_FILE, finalFile,
    audioName: AUDIO_NAME, timingName: TIMING_NAME,
    mood: metadata.mood, pacing: metadata.pacing, visualStyle: metadata.visualStyle,
  });
}

runPipeline().catch((err) => {
  stepFail(`Pipeline failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
