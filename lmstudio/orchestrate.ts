import * as fs from "fs";
import * as path from "path";
import { runCall1 } from "./call1.js";
import { runCall2 } from "./call2.js";
import { logVideoSpecSummary } from "../trace.js";
import type {
  VideoSpec,
  ContentMetadata,
  ScriptPackage,
  ScriptSentence,
  SentenceVisualDirective,
  TokenMap,
} from "./types.js";

function timer(): () => string {
  const t = Date.now();
  return () => `${((Date.now() - t) / 1000).toFixed(1)}s`;
}

// ─── Image fetcher ─────────────────────────────────────────────────────────────

/**
 * Fetches one image per scene that needs one.
 * Skips scenes where needsImage is false or visualQuery is null — returns null at those indices.
 * Currently a stub: replace the inner fetch with a real image API call.
 */
export async function fetchImages(scenes: ScriptSentence[]): Promise<(string | null)[]> {
  return Promise.all(
    scenes.map(async (scene) => {
      if (!scene.needsImage || !scene.visualQuery) return null;
      // TODO: replace with real image API call (e.g. Unsplash, Pexels, Google Images)
      // const imageUrl = await imageApi.search(scene.visualQuery);
      // return imageUrl;
      console.log(`  [images] Would fetch: "${scene.visualQuery}"`);
      return null;
    })
  );
}

// ─── Parallel step result types ────────────────────────────────────────────────

export interface ParallelStepResult {
  resolvedImages:  (string | null)[];
  directives:      SentenceVisualDirective[];
  /** Raw audio result — caller converts to sentenceDurations */
  audioScriptPath: string;
}

export interface ParallelStepError {
  step:    "fetchImages" | "generateComposition" | "runTTS";
  message: string;
}

/** Convert new VideoSpec to legacy ContentMetadata for backward-compat consumers. */
export function videoSpecToMetadata(spec: VideoSpec): ContentMetadata {
  const sentences = spec.sentences;
  const hookSentence  = sentences.find(s => s.beat === "hook")  ?? sentences[0];
  const closeSentence = sentences.find(s => s.beat === "close") ?? sentences[sentences.length - 1];
  const body = sentences
    .filter(s => s !== hookSentence && s !== closeSentence)
    .map(s => s.text);

  // Map new SentenceVisualDirective → old SentenceSceneDirective for body sentences
  const bodyIndices = sentences
    .filter(s => s !== hookSentence && s !== closeSentence)
    .map(s => s.index - 1);

  const sceneDirectives = bodyIndices.map(i => {
    const d = spec.directives[i];
    if (!d) return {
      scene_template: "text_dominant" as const,
      image_motion: null, highlight_words: [], visual_query: null, animation_spec: null,
    };
    return {
      scene_template: (["fullbleed","text_dominant","stat_callout","animated_graphic"].includes(d.scene_template)
        ? d.scene_template : "text_dominant") as "fullbleed" | "text_dominant" | "stat_callout" | "animated_graphic",
      image_motion:    null,
      highlight_words: d.text_treatment.accent_words,
      visual_query:    null,
      animation_spec:  null,
    };
  });

  return {
    hook:            hookSentence?.text ?? "",
    body,
    cta:             closeSentence?.text ?? "",
    mood:            "dark",
    pacing:          "medium",
    visualStyle:     "cinematic",
    title:           spec.topic,
    contentType:     "factual",
    accentColor:     spec.accentColor,
    sceneDirectives,
  };
}

// ─── Main pipeline ─────────────────────────────────────────────────────────────

export async function generateVideoSpec(
  rawContent: string,
  options: {
    temperature?: number;
    outputDir?:   string;
    guide?:       string;
    tokens?:      TokenMap;
  } = {}
): Promise<{ videoSpec: VideoSpec; metadata: ContentMetadata; script: string; savedTo: string }> {
  const outputDir = options.outputDir ?? path.join(__dirname, "..", "data", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("  ║        LM Studio · Script Generation      ║");
  console.log("  ╚═══════════════════════════════════════════╝");

  // ── CALL 1: Script writer ──────────────────────────────────────────────────
  const t1 = timer();
  let script: ScriptPackage;

  try {
    script = await runCall1(rawContent, { temperature: options.temperature, guide: options.guide });
  } catch (err) {
    console.warn(`  ✗  Call 1 failed (${t1()}) — aborting`);
    throw err;
  }
  console.log(`  ✓  Call 1 done (${t1()})`);

  // ── Save outputs ───────────────────────────────────────────────────────────
  const scriptJsonPath = path.join(outputDir, "script.json");
  fs.writeFileSync(scriptJsonPath, JSON.stringify(script, null, 2), "utf-8");

  // output.txt — plain narration text, consumed by ElevenLabs TTS step
  const savedTo    = path.join(outputDir, "output.txt");
  const scriptText = script.sentences.map(s => s.text).join(" ");
  fs.writeFileSync(savedTo, scriptText, "utf-8");

  console.log(`  Saved → ${scriptJsonPath}`);
  console.log(`  Saved → ${savedTo}\n`);

  const videoSpec: VideoSpec = {
    topic:       script.topic,
    accentColor: script.accentColor,
    sentences:   script.sentences,
    directives:  [],
  };

  const metadata = videoSpecToMetadata(videoSpec);
  logVideoSpecSummary(videoSpec);

  return { videoSpec, metadata, script: scriptText, savedTo };
}

/**
 * Runs image fetch, TTS, and Call 2 in parallel after Call 1 completes.
 * Returns a typed result so callers can identify which step failed.
 *
 * @param scenes        ScriptSentence[] from Call 1
 * @param guide         Content-type guide markdown (injected into Call 2)
 * @param tokens        Design tokens (passed to Call 2 for color guidance)
 * @param scriptPath    Path to saved script.json (used by TTS step)
 * @param publicDir     Output dir for audio files
 * @param audioName     Filename for generated mp3
 * @param timingName    Filename for generated timing JSON
 * @param audioOpts     Options passed to generateAudioStep
 */
export async function runParallelStep(
  scenes:     ScriptPackage,
  guide:      string | undefined,
  _tokens:    TokenMap | undefined,
  scriptPath: string,
  publicDir:  string,
  audioName:  string,
  timingName: string,
  audioOpts:  { skipAudio: boolean; voiceId?: string },
): Promise<{
  resolvedImages: (string | null)[];
  directives:     SentenceVisualDirective[];
  audioFile:      string;
  wordTimings:    import("../elevenlabs/index.js").WordTiming[];
  durationSec:    number;
}> {
  const { generateAudioStep } = await import("../pipelineAudio.js");

  const [resolvedImages, directives, audioResult] = await Promise.all([
    fetchImages(scenes.sentences).catch((err: unknown) => {
      throw Object.assign(
        new Error(`fetchImages failed: ${err instanceof Error ? err.message : String(err)}`),
        { step: "fetchImages" }
      );
    }),

    runCall2(scenes, { brief: undefined, guide }).catch((err: unknown) => {
      throw Object.assign(
        new Error(`generateComposition (Call 2) failed: ${err instanceof Error ? err.message : String(err)}`),
        { step: "generateComposition" }
      );
    }),

    generateAudioStep(scriptPath, publicDir, audioName, timingName, {
      skipAudio:     audioOpts.skipAudio,
      voiceId:       audioOpts.voiceId,
      sentenceTexts: scenes.sentences.map(s => s.text),
    }).catch((err: unknown) => {
      throw Object.assign(
        new Error(`runTTS failed: ${err instanceof Error ? err.message : String(err)}`),
        { step: "runTTS" }
      );
    }),
  ]);

  return {
    resolvedImages,
    directives,
    audioFile:   audioResult.audioFile,
    wordTimings: audioResult.wordTimings,
    durationSec: audioResult.durationSec,
  };
}

/** @deprecated Use generateVideoSpec instead */
export async function analyzeAndStructure(
  rawContent: string,
  options: { temperature?: number; outputDir?: string } = {}
): Promise<{ metadata: ContentMetadata; script: string; savedTo: string }> {
  const { metadata, script, savedTo } = await generateVideoSpec(rawContent, options);
  return { metadata, script, savedTo };
}
