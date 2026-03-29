import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

export { remotionRender, stitchAudio, logPipelineSummary } from "./pipelineOutput";

/**
 * Locates the Remotion-bundled ffmpeg binary for the current platform.
 * Falls back to system `ffmpeg` if not found.
 */
export function findFfmpeg(): string {
  const platform = process.platform;
  const arch     = process.arch;
  const pkg =
    platform === "win32"  ? "@remotion/compositor-win32-x64-msvc" :
    platform === "darwin" ? (arch === "arm64"
      ? "@remotion/compositor-darwin-arm64"
      : "@remotion/compositor-darwin-x64")
    : "@remotion/compositor-linux-x64-gnu";
  try {
    const pkgDir = path.dirname(require.resolve(`${pkg}/package.json`));
    const bin    = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const full   = path.join(pkgDir, bin);
    if (fs.existsSync(full)) return full;
  } catch { /* not installed */ }
  return "ffmpeg";
}

/**
 * Resolves B-roll clips. Explicit list overrides auto-discovery.
 * Returns empty array when neither source is available.
 */
export function resolveClips(publicDir: string, needed: number, explicitClips?: string[]): string[] {
  if (explicitClips && explicitClips.length > 0) return explicitClips;

  const clipsDir = path.join(publicDir, "clips");
  if (!fs.existsSync(clipsDir)) return [];

  const available = fs.readdirSync(clipsDir)
    .filter((f) => f.toLowerCase().endsWith(".mp4"))
    .sort()
    .map((f) => `clips/${f}`);

  if (available.length === 0) return [];
  return Array.from({ length: needed }, (_, i) => available[i % available.length]);
}

export function parseFlags(): {
  skipAudio: boolean; skipStitch: boolean;
  voiceId?: string; clips?: string[]; bgMusic?: string;
} {
  const args = process.argv.slice(2);
  const out: { skipAudio: boolean; skipStitch: boolean; voiceId?: string; clips?: string[]; bgMusic?: string } = {
    skipAudio: false, skipStitch: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--skip-audio")              out.skipAudio  = true;
    if (args[i] === "--skip-stitch")             out.skipStitch = true;
    if (args[i] === "--voice-id" && args[i + 1]) out.voiceId    = args[++i];
    if (args[i] === "--clips"    && args[i + 1]) out.clips      = args[++i].split(",");
    if (args[i] === "--bg-music" && args[i + 1]) out.bgMusic    = args[++i];
  }
  return out;
}

/** Fallback duration when audio is skipped: word-count estimate at 130 wpm */
export function estimateFrames(allText: string): number {
  const words = allText.split(/\s+/).length;
  const sec   = Math.ceil((words / 130) * 60);
  return Math.min(Math.max(sec * 30, 600), 2700);
}

