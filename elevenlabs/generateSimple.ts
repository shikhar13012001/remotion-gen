import * as fs from "fs";
import * as path from "path";
import {
  ELEVENLABS_API_URL,
  DEFAULT_VOICE_ID,
  type GenerateOptions,
} from "./client.js";

/**
 * Simple voice-over without timestamps (kept for standalone CLI use).
 */
export async function generateVoiceOver(
  scriptPath: string,
  outputFileName: string,
  options: GenerateOptions = {}
): Promise<string> {
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
  } = options;

  const scriptText = fs.readFileSync(scriptPath, "utf-8").trim();
  if (!scriptText) throw new Error(`Script file is empty: ${scriptPath}`);

  console.log(`Generating voice over for: ${path.basename(scriptPath)}`);
  console.log(`Script preview: "${scriptText.slice(0, 80)}..."`);

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
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

  const audioBuffer = await response.arrayBuffer();
  const outputDir = path.join(__dirname, "audio");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, outputFileName);
  fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
  console.log(`Audio saved to: ${outputPath}`);
  return outputPath;
}

// CLI usage: ts-node elevenlabs/generateSimple.ts scripts/example.txt output.mp3
async function main() {
  const [, , scriptArg, outputArg] = process.argv;
  if (!scriptArg) {
    console.error("Usage: ts-node elevenlabs/generateSimple.ts <script-file> [output-name.mp3]");
    process.exit(1);
  }
  const scriptPath = path.resolve(scriptArg);
  const outputFileName = outputArg ?? path.basename(scriptArg, ".txt") + ".mp3";
  try {
    const outputPath = await generateVoiceOver(scriptPath, outputFileName);
    console.log(`Done! Voice over saved to: ${outputPath}`);
  } catch (err) {
    console.error("Failed to generate voice over:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
