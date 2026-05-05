import * as fs from "fs";
import * as path from "path";
import type { WordTiming } from "./elevenlabs/index";
import { logWordTimingsReport } from "./trace";

export interface AudioResult {
  audioFile: string;
  wordTimings: WordTiming[];
  durationSec: number;
}

/**
 * Run ElevenLabs TTS if conditions allow, otherwise return empty result.
 * Copies audio and timing files into `publicDir`.
 */
export async function generateAudioStep(
  scriptPath: string,
  publicDir: string,
  audioName: string,
  timingName: string,
  opts: { skipAudio: boolean; voiceId?: string; sentenceTexts?: string[] },
): Promise<AudioResult> {
  if (opts.skipAudio) {
    return { audioFile: "", wordTimings: [], durationSec: 0 };
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    console.warn("  ELEVENLABS_API_KEY not set — skipping audio.");
    return { audioFile: "", wordTimings: [], durationSec: 0 };
  }
  // Lazy import to avoid circular dep at module level
  const { generateWithTimestamps } = await import("./elevenlabs/index.js");
  const result = await generateWithTimestamps(scriptPath, "output.mp3", { voiceId: opts.voiceId, sentenceTexts: opts.sentenceTexts });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(result.audioPath, path.join(publicDir, audioName));
  fs.writeFileSync(path.join(publicDir, timingName), JSON.stringify(result.wordTimings, null, 2));
  logWordTimingsReport(result.wordTimings);
  return { audioFile: audioName, wordTimings: result.wordTimings, durationSec: result.durationSec };
}
