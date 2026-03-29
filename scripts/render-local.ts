/**
 * render-local.ts
 *
 * Renders ShortsComposition using the already-generated metadata.json and
 * timing.json — no LM Studio or ElevenLabs call needed.
 *
 * Usage:
 *   npm run render
 *   npx tsx scripts/render-local.ts
 */

import * as fs   from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

const ROOT         = path.resolve(__dirname, "..");
const VIDEOSPEC    = path.join(ROOT, "data", "output", "videospec.json");
const METADATA_LEGACY = path.join(ROOT, "elevenlabs", "scripts", "metadata.json");
// Use pipeline videospec if available, fall back to legacy elevenlabs metadata
const METADATA     = fs.existsSync(VIDEOSPEC) ? VIDEOSPEC : METADATA_LEGACY;
const TIMING       = path.join(ROOT, "public", "timing.json");
const AUDIO        = path.join(ROOT, "public", "voice.mp3");
const OUT_DIR      = path.join(ROOT, "out");
const OUT_FILE     = path.join(OUT_DIR, "video.mp4");
const PROPS_FILE   = path.join(ROOT, "props.json");

// ── Validate inputs ───────────────────────────────────────────────────────────

if (!fs.existsSync(METADATA)) {
  console.error(`ERROR: No pipeline output found.\n  Looked for: ${VIDEOSPEC}\n  Fallback:   ${METADATA_LEGACY}\n\nRun: npm run pipeline -- --skip-audio`);
  process.exit(1);
}
if (!fs.existsSync(TIMING)) {
  console.error(`ERROR: timing.json not found at:\n  ${TIMING}`);
  process.exit(1);
}

// ── Load data ─────────────────────────────────────────────────────────────────

const isPipelineOutput = METADATA === VIDEOSPEC;
const rawFile = JSON.parse(fs.readFileSync(METADATA, "utf-8"));

// VideoSpec (new pipeline): derive legacy ContentMetadata from it for backward-compat fields
// ContentMetadata (legacy elevenlabs path): use directly
let metadata: Record<string, unknown>;
let videoSpec: Record<string, unknown> | undefined;

if (isPipelineOutput && rawFile.directives) {
  // New pipeline output — VideoSpec shape: { topic, accentColor, sentences, directives }
  videoSpec = rawFile;
  const sentences: Array<{ beat: string; text: string }> = rawFile.sentences ?? [];
  const hookText  = (sentences.find(s => s.beat === "hook")  ?? sentences[0])?.text  ?? "";
  const closeText = (sentences.find(s => s.beat === "close") ?? sentences[sentences.length - 1])?.text ?? "";
  const body = sentences
    .filter(s => s.beat !== "hook" && s.beat !== "close")
    .map(s => s.text);
  metadata = {
    hook:           hookText,
    body,
    cta:            closeText,
    mood:           "dark",
    pacing:         "medium",
    visualStyle:    "cinematic",
    title:          rawFile.topic ?? "",
    contentType:    "factual",
    accentColor:    rawFile.accentColor ?? "#c8a96e",
    sceneDirectives: [],   // empty — composition will use videoSpec.directives instead
  };
  console.log(`[render-local] Loading pipeline output from data/output/videospec.json`);
} else {
  // Legacy elevenlabs metadata — use as-is
  metadata    = rawFile;
  videoSpec   = undefined;
  console.log(`[render-local] Loading legacy metadata from elevenlabs/scripts/metadata.json`);
}

const wordTimings = JSON.parse(fs.readFileSync(TIMING, "utf-8"));

const audioFile       = fs.existsSync(AUDIO) ? "voice.mp3" : "";
const lastWord        = wordTimings[wordTimings.length - 1] as { end: number } | undefined;
const audioDurationSec = lastWord?.end ?? 60;

// 5-second visual tail after audio ends (CTA scene duration)
const durationInFrames = Math.round((audioDurationSec + 5) * 30);

// ── Print summary ─────────────────────────────────────────────────────────────

// For display: use videoSpec.directives if available, else legacy sceneDirectives
type DirLike = { scene_template: string };
const displayDirs: DirLike[] = videoSpec
  ? (videoSpec.directives as DirLike[] ?? [])
  : ((metadata.sceneDirectives as DirLike[]) ?? []);
const animated     = displayDirs.filter(d => d.scene_template === "animated_graphic").length;
const textDominant = displayDirs.filter(d => d.scene_template === "text_dominant").length;
const fullbleed    = displayDirs.filter(d => d.scene_template === "fullbleed").length;
const statCallout  = displayDirs.filter(d => d.scene_template === "stat_callout").length;

console.log("═══════════════════════════════════════════");
console.log("  render-local — ShortsComposition");
console.log("═══════════════════════════════════════════");
console.log(`Title       : ${metadata.title}`);
console.log(`Mood        : ${metadata.mood}  |  Pacing: ${metadata.pacing}  |  Style: ${metadata.visualStyle}`);
console.log(`Accent      : ${metadata.accentColor}`);
console.log(`Audio       : ${audioFile || "(none)"}`);
console.log(`Duration    : ${audioDurationSec.toFixed(1)}s  →  ${durationInFrames} frames`);
console.log(`Sentences   : ${wordTimings.length} words / ${displayDirs.length} directives`);
console.log(`Scene mix   : animated_graphic=${animated}  text_dominant=${textDominant}  fullbleed=${fullbleed}  stat_callout=${statCallout}`);
console.log("───────────────────────────────────────────\n");

// ── Write props.json ──────────────────────────────────────────────────────────

const props = {
  metadata,
  ...(videoSpec ? { videoSpec } : {}),
  wordTimings,
  audioFile,
  durationInFrames,
  backgroundClips: [],
  bgMusicFile: "",
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(PROPS_FILE, JSON.stringify(props, null, 2), "utf-8");

// ── Run Remotion render ───────────────────────────────────────────────────────

console.log(`Rendering → ${OUT_FILE}\n`);

const result = spawnSync(
  "npx",
  ["remotion", "render", "ShortsComposition", OUT_FILE, `--props=${PROPS_FILE}`, "--muted"],
  { stdio: "inherit", shell: true, cwd: ROOT }
);

fs.rmSync(PROPS_FILE, { force: true });

if (result.status !== 0) {
  console.error("\nRemotion render failed.");
  process.exit(result.status ?? 1);
}

console.log(`\nDone → ${OUT_FILE}`);
