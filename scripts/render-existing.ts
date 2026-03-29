/**
 * render-existing.ts
 *
 * Renders the video using already-generated assets:
 *   - data/output/metadata.json  (scene directives)
 *   - public/timing.json          (word timings from ElevenLabs)
 *   - public/voice.mp3            (narration audio)
 *
 * Usage:
 *   npx tsx scripts/render-existing.ts
 *   npx tsx scripts/render-existing.ts --skip-stitch
 */

import { spawnSync } from "child_process";
import * as fs       from "fs";
import * as path     from "path";
import { stitchAudio } from "../pipelineHelpers";

const ROOT        = path.resolve(__dirname, "..");
const META_FILE   = path.join(ROOT, "data/output/metadata.json");
const TIMING_FILE = path.join(ROOT, "public/timing.json");
const AUDIO_FILE  = "voice.mp3";
const OUT_FILE    = path.join(ROOT, "out/video.mp4");
const DIST_FILE   = path.join(ROOT, "dist/final.mp4");
const PROPS_FILE  = path.join(ROOT, "props.json");

const skipStitch = process.argv.includes("--skip-stitch");

// ── Validate inputs ─────────────────────────────────────────────────────────

if (!fs.existsSync(META_FILE)) {
  console.error(`ERROR: metadata.json not found at ${META_FILE}`); process.exit(1);
}
if (!fs.existsSync(TIMING_FILE)) {
  console.error(`ERROR: timing.json not found at ${TIMING_FILE}`); process.exit(1);
}
if (!fs.existsSync(path.join(ROOT, "public", AUDIO_FILE))) {
  console.error(`ERROR: ${AUDIO_FILE} not found in public/`); process.exit(1);
}

// ── Load data ────────────────────────────────────────────────────────────────

const metadata    = JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
const wordTimings = JSON.parse(fs.readFileSync(TIMING_FILE, "utf-8")) as Array<{
  word: string; start: number; end: number; sentenceIndex: number;
}>;

const lastWord         = wordTimings[wordTimings.length - 1];
const audioDurationSec = lastWord ? lastWord.end + 1.5 : 0;
const durationInFrames = audioDurationSec > 0 ? Math.round(audioDurationSec * 30) : 9000;
const sentenceCount    = (lastWord?.sentenceIndex ?? 0) + 1;

console.log("=================================================");
console.log("  Render from existing assets");
console.log("=================================================");
console.log(`Metadata : ${metadata.title}`);
console.log(`Accent   : ${metadata.accentColor}  |  mood: ${metadata.mood}`);
console.log(`Directives: ${metadata.sceneDirectives?.length ?? 0} scene directives`);
console.log(`Audio    : ${audioDurationSec.toFixed(1)}s  |  ${sentenceCount} sentences  |  ${wordTimings.length} words`);
console.log(`Frames   : ${durationInFrames}  (~${(durationInFrames / 30).toFixed(0)}s at 30fps)\n`);

// ── Write props.json ─────────────────────────────────────────────────────────

fs.writeFileSync(PROPS_FILE, JSON.stringify(
  { metadata, wordTimings, audioFile: AUDIO_FILE, durationInFrames, backgroundClips: [], bgMusicFile: "" },
  null, 2
), "utf-8");
console.log(`Props written to props.json\n`);

// ── Remotion render ──────────────────────────────────────────────────────────

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
console.log(`Rendering → out/video.mp4 …`);

const render = spawnSync(
  "npx",
  ["remotion", "render", "ShortsComposition", OUT_FILE, `--props=${PROPS_FILE}`, "--muted"],
  { stdio: "inherit", shell: true, cwd: ROOT },
);
fs.rmSync(PROPS_FILE, { force: true });

if (render.status !== 0) { console.error("\nRemotion render failed."); process.exit(render.status ?? 1); }

// ── ffmpeg stitch ────────────────────────────────────────────────────────────

if (skipStitch) {
  console.log("\nSkipping stitch (--skip-stitch)");
  console.log(`Done → ${OUT_FILE}`);
  process.exit(0);
}

console.log("\nStitching audio + video with ffmpeg …");
fs.mkdirSync(path.dirname(DIST_FILE), { recursive: true });

const ok = stitchAudio(OUT_FILE, path.join(ROOT, "public", AUDIO_FILE), DIST_FILE);
if (!ok) { console.warn("ffmpeg stitch failed — raw render is at out/video.mp4"); }
else     { console.log(`\nDone → ${DIST_FILE}`); }
