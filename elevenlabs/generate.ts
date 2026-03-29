import * as fs from "fs";
import * as path from "path";
import {
  ELEVENLABS_API_URL,
  DEFAULT_VOICE_ID,
  type GenerateOptions,
  type TimestampResult,
} from "./client";
import { buildWordTimings } from "./timestamps";

/**
 * Generate voice over WITH word-level timestamps.
 * Uses ElevenLabs /with-timestamps endpoint.
 * Returns audio path, word timings, and actual audio duration.
 */
export async function generateWithTimestamps(
  scriptPath: string,
  outputFileName: string,
  options: GenerateOptions = {}
): Promise<TimestampResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY not set. Copy .env.example → .env and add your key."
    );
  }

  const {
    voiceId = DEFAULT_VOICE_ID,
    modelId = "eleven_monolingual_v1",
    stability = 0.5,
    similarityBoost = 0.75,
    sentenceTexts,
  } = options;

  const scriptText = fs.readFileSync(scriptPath, "utf-8").trim();
  if (!scriptText) throw new Error(`Script file is empty: ${scriptPath}`);

  console.log(`Generating voice over (with timestamps) for: ${path.basename(scriptPath)}`);
  console.log(`Preview: "${scriptText.slice(0, 80)}..."`);

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text: scriptText,
        model_id: modelId,
        voice_settings: { stability, similarity_boost: similarityBoost },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
  }

  const data = await response.json() as {
    audio_base64: string;
    alignment: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
  };

  const audioBuffer = Buffer.from(data.audio_base64, "base64");
  const outputDir = path.join(__dirname, "audio");
  fs.mkdirSync(outputDir, { recursive: true });
  const audioPath = path.join(outputDir, outputFileName);
  fs.writeFileSync(audioPath, audioBuffer);
  console.log(`Audio saved to: ${audioPath}`);

  const { characters, character_start_times_seconds, character_end_times_seconds } =
    data.alignment;
  const wordTimings = buildWordTimings(
    characters,
    character_start_times_seconds,
    character_end_times_seconds,
    sentenceTexts,
  );

  const durationSec =
    character_end_times_seconds[character_end_times_seconds.length - 1] ?? 0;

  console.log(`Timing: ${wordTimings.length} words across ${durationSec.toFixed(1)}s`);

  return { audioPath, wordTimings, durationSec };
}
