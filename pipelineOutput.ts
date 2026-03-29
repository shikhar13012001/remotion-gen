import { spawnSync } from "child_process";
import { findFfmpeg } from "./pipelineHelpers";

/** Invoke Remotion CLI render. Returns true on success. */
export function remotionRender(outFile: string, propsFile: string): boolean {
  const result = spawnSync(
    "npx",
    ["remotion", "render", "ShortsComposition", outFile, `--props=${propsFile}`, "--muted"],
    { stdio: "inherit", shell: true }
  );
  return result.status === 0;
}

/**
 * Stitch video and audio with ffmpeg. Copies video stream, re-encodes audio as AAC.
 * Returns `true` on success, `false` on ffmpeg failure.
 */
export function stitchAudio(videoFile: string, audioFile: string, outFile: string): boolean {
  const result = spawnSync(findFfmpeg(), [
    "-y", "-i", videoFile, "-i", audioFile,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ac", "2",
    "-map", "0:v:0", "-map", "1:a:0", "-metadata:s:a:0", "language=eng",
    "-movflags", "+faststart", "-shortest", outFile,
  ], { stdio: "inherit" });
  return result.status === 0;
}

/** Print pipeline completion summary to stdout. */
export function logPipelineSummary(opts: {
  elapsed: string; scriptPath: string; audioFile: string;
  outFile: string; distFile: string; finalFile: string;
  audioName: string; timingName: string;
  mood: string; pacing: string; visualStyle: string;
}): void {
  const { elapsed, scriptPath, audioFile, outFile, distFile, finalFile, audioName, timingName, mood, pacing, visualStyle } = opts;
  console.log("\n=================================================");
  console.log(`  Done in ${elapsed}s`);
  console.log("=================================================");
  console.log(`Metadata: data/output/metadata.json`);
  console.log(`Script  : ${scriptPath}`);
  if (audioFile) { console.log(`Audio   : public/${audioName}`); console.log(`Timing  : public/${timingName}`); }
  console.log(`Video   : ${outFile}`);
  if (finalFile === distFile) console.log(`Final   : ${distFile}`);
  console.log(`\nMood: ${mood} | Pacing: ${pacing} | Style: ${visualStyle}`);
}
