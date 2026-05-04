// Audio Workflow: Generate voice-over and stitch with video
// Entry point for: npm run audio:generate, npm run audio:stitch
//
// This module enhances elevenlabs/ with CLI commands for:
// 1. Audio generation from script.json
// 2. Audio stitching with video using ffmpeg

import * as fs from "fs";
import * as path from "path";
import { generateWithTimestamps } from "./generate.js";
import type { WordTiming } from "./client.js";
import { stepStart, stepDone, stepFail } from "../trace.js";

interface ScriptOutput {
  sentences: Array<{ text: string }>;
}

const SCRIPT_OUTPUT = path.join(process.cwd(), "data", "output", "script.json");
const SCRIPT_TTS = path.join(process.cwd(), "data", "output", "tts_script.txt");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const AUDIO_FILE = "voice.mp3";
const TIMING_FILE = "timing.json";

/**
 * Generate voice-over from script.json using ElevenLabs API.
 * Saves audio to public/voice.mp3 and timing to public/timing.json
 */
export async function generateAudio(voiceId?: string): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║       Audio Generation — ElevenLabs TTS             ║");
  console.log("╚════════════════════════════════════════════════════╝");

  // Load script
  stepStart("Load script");
  if (!fs.existsSync(SCRIPT_OUTPUT)) {
    stepFail(`Script not found: ${SCRIPT_OUTPUT}\nRun: npm run pipeline`);
    process.exit(1);
  }
  const script = JSON.parse(fs.readFileSync(SCRIPT_OUTPUT, "utf-8")) as ScriptOutput;
  const sentenceTexts = script.sentences.map((s) => s.text);
  stepDone("Load script", `${script.sentences.length} sentences`);

  // Build TTS script (all sentences as one block)
  stepStart("Build TTS script");
  const ttsText = sentenceTexts.join(" ");
  fs.mkdirSync(path.dirname(SCRIPT_TTS), { recursive: true });
  fs.writeFileSync(SCRIPT_TTS, ttsText, "utf-8");
  stepDone("Build TTS script", `${ttsText.length} chars`);

  // Generate audio via ElevenLabs
  stepStart("Generate audio via ElevenLabs");
  const result = await generateWithTimestamps(SCRIPT_TTS, AUDIO_FILE, {
    voiceId,
    sentenceTexts,
  });
  stepDone("Generate audio", `${result.durationSec.toFixed(1)}s · ${result.wordTimings.length} words`);

  // Save to public/
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.copyFileSync(result.audioPath, path.join(PUBLIC_DIR, AUDIO_FILE));
  fs.writeFileSync(path.join(PUBLIC_DIR, TIMING_FILE), JSON.stringify(result.wordTimings, null, 2));

  console.log(`\n✅ Audio ready: ${path.join(PUBLIC_DIR, AUDIO_FILE)}`);
  console.log(`✅ Timing data: ${path.join(PUBLIC_DIR, TIMING_FILE)}`);
}

/**
 * Stitch audio (public/voice.mp3) with video (out/video.mp4) using ffmpeg.
 * Outputs to out/video_with_audio.mp4
 */
export async function stitchAudio(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║       Audio Stitching — ffmpeg                     ║");
  console.log("╚════════════════════════════════════════════════════╝");

  const videoFile = path.join(process.cwd(), "out", "video.mp4");
  const audioPath = path.join(PUBLIC_DIR, AUDIO_FILE);
  const outputFile = path.join(process.cwd(), "out", "video_with_audio.mp4");

  // Check prerequisites
  if (!fs.existsSync(videoFile)) {
    stepFail(`Video not found: ${videoFile}\nRun: npm run build`);
    process.exit(1);
  }
  if (!fs.existsSync(audioPath)) {
    stepFail(`Audio not found: ${audioPath}\nRun: npm run audio:generate`);
    process.exit(1);
  }

  stepStart("Stitch audio to video");
  const { execSync } = require("child_process");
  try {
    execSync(
      `ffmpeg -y -i "${videoFile}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${outputFile}"`,
      { stdio: "inherit" }
    );
    stepDone("Stitch audio", outputFile);
    console.log(`\n✅ Final video: ${outputFile}`);
  } catch (err) {
    stepFail(`ffmpeg failed: ${err}`);
    process.exit(1);
  }
}

// CLI entry point
async function main() {
  try { require("dotenv").config(); } catch {}

  const command = process.argv[2];
  const voiceId = process.argv.includes("--voice-id")
    ? process.argv[process.argv.indexOf("--voice-id") + 1]
    : undefined;

  if (command === "generate") {
    await generateAudio(voiceId);
  } else if (command === "stitch") {
    await stitchAudio();
  } else {
    console.log("\nUsage:");
    console.log("  npx tsx elevenlabs/workflow.ts generate [--voice-id <id>]");
    console.log("  npx tsx elevenlabs/workflow.ts stitch\n");
    console.log("Or via npm scripts:");
    console.log("  npm run audio:generate [--voice-id <id>]");
    console.log("  npm run audio:stitch\n");
  }
}

main().catch((err) => {
  stepFail(`Audio workflow failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
