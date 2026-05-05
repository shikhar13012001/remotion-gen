import * as fs from "fs";
import * as path from "path";
import type { Props } from "../compositions/ShortsComposition";
import type { ImageManifest } from "./imageManifest";
import { resolveImagesForSentenceCount } from "./imageManifest";

interface ScriptSentence {
  index: number;
  text: string;
  beat: string;
  word_count: number;
  suggested_duration_ms: number;
  visualQuery: string | null;
  needsImage: boolean;
  highlightWords: string[];
  dataValue: number | null;
}

interface LoadedScript {
  topic: string;
  total_words: number;
  accentColor: string;
  sentences: ScriptSentence[];
}

function loadImageManifest(scriptPath: string): ImageManifest | null {
  const manifestPath = path.join(path.dirname(scriptPath), "image_manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as ImageManifest;
}

/**
 * Load script.json and transform it into Props for ShortsComposition
 */
export function loadScriptAsProps(scriptPath: string): Props {
  const rawContent = fs.readFileSync(scriptPath, "utf-8");
  const script = JSON.parse(rawContent) as LoadedScript;

  const scenes = script.sentences.map((s) => ({
    text: s.text,
    highlightWords: s.highlightWords,
    dataValue: s.dataValue,
  }));

  const suggestedDurations = script.sentences.map((s) => s.suggested_duration_ms);

  const manifest = loadImageManifest(scriptPath);
  const resolvedImages = resolveImagesForSentenceCount(script.sentences.length, manifest);

  // Default tokens with the script's accent color
  const tokens = {
    fontFamily: "system-ui, sans-serif",
    colors: { accent: script.accentColor },
    typography: {},
    spacing: {},
    radii: {},
  };

  return {
    scenes,
    sentenceDurations: [],  // Empty — no audio timing yet
    suggestedDurations,
    resolvedImages,
    tokens,
  };
}
