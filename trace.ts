/**
 * Minimal step tracer — structured pipeline logging with per-step timing.
 * Imported by pipeline.ts and lmstudio/orchestrate.ts.
 */

const stepTimers = new Map<string, number>();

export function stepStart(label: string): void {
  stepTimers.set(label, Date.now());
  console.log(`\n${"─".repeat(55)}`);
  console.log(`  ▶  ${label}`);
  console.log(`${"─".repeat(55)}`);
}

export function stepDone(label: string, detail?: string): void {
  const elapsed = stepTimers.has(label)
    ? ` (${((Date.now() - stepTimers.get(label)!) / 1000).toFixed(1)}s)`
    : "";
  const suffix = detail ? `  →  ${detail}` : "";
  console.log(`  ✓  ${label}${elapsed}${suffix}`);
  stepTimers.delete(label);
}

export function stepSkip(label: string, reason: string): void {
  console.log(`\n  ⏭   ${label}  [${reason}]`);
}

export function stepWarn(msg: string): void {
  console.warn(`  ⚠   ${msg}`);
}

export function stepFail(msg: string): void {
  console.error(`  ✗   ${msg}`);
}

// ─── Accent color block ───────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";
const CYAN  = "\x1b[36m";
const GRN   = "\x1b[32m";
const YLW   = "\x1b[33m";
const RED   = "\x1b[31m";

function dim(s: string)  { return `${DIM}${s}${RESET}`; }
function bold(s: string) { return `${BOLD}${s}${RESET}`; }
function cyan(s: string) { return `${CYAN}${s}${RESET}`; }
function grn(s: string)  { return `${GRN}${s}${RESET}`; }
function ylw(s: string)  { return `${YLW}${s}${RESET}`; }

const BEAT_COLOR: Record<string, (s: string) => string> = {
  hook:    bold,
  close:   bold,
  reveal:  ylw,
  turn:    cyan,
  breathe: dim,
  build:   (s) => s,
};

/** Logs the Call 1 script sentences in a compact table. */
export function logScriptTable(script: {
  topic:       string;
  accentColor: string;
  sentences:   Array<{ index: number; text: string; beat: string; suggested_duration_ms: number }>;
}): void {
  const totalMs = script.sentences.reduce((a, s) => a + s.suggested_duration_ms, 0);
  const totalSec = (totalMs / 1000).toFixed(0);

  console.log(`\n  ${bold("Script")}  ${dim(`(${script.sentences.length} sentences · ~${totalSec}s · ${script.accentColor})`)}`);
  console.log("  ┌────┬───────────┬──────┬────────────────────────────────────────────┐");
  console.log(`  │ ${dim(" # ")} │ ${"beat".padEnd(9)} │ ${"ms".padStart(4)} │ ${"text".padEnd(42)} │`);
  console.log("  ├────┼───────────┼──────┼────────────────────────────────────────────┤");

  for (const s of script.sentences) {
    const idx     = String(s.index).padStart(2);
    const beat    = (BEAT_COLOR[s.beat] ?? ((x: string) => x))(s.beat.padEnd(9));
    const ms      = String(s.suggested_duration_ms).padStart(4);
    const preview = s.text.slice(0, 42).padEnd(42);
    console.log(`  │ ${idx} │ ${beat} │ ${ms} │ ${preview} │`);
  }

  console.log("  └────┴───────────┴──────┴────────────────────────────────────────────┘");

  const beatCounts: Record<string, number> = {};
  for (const s of script.sentences) beatCounts[s.beat] = (beatCounts[s.beat] ?? 0) + 1;
  const beatStr = Object.entries(beatCounts).map(([k, v]) => `${k}:${v}`).join("  ");
  console.log(`  ${dim("Beats:")} ${beatStr}\n`);
}

/** Logs the word-timing boundary report after ElevenLabs TTS. */
export function logWordTimingsReport(wordTimings: Array<{
  word: string; sentenceIndex: number; start: number; end: number;
}>): void {
  if (wordTimings.length === 0) {
    console.log(`  ${dim("Word timings: none")}\n`);
    return;
  }

  // Group by sentence
  const byIdx: Map<number, typeof wordTimings> = new Map();
  for (const wt of wordTimings) {
    if (!byIdx.has(wt.sentenceIndex)) byIdx.set(wt.sentenceIndex, []);
    byIdx.get(wt.sentenceIndex)!.push(wt);
  }

  const sentCount   = byIdx.size;
  const maxSentIdx  = Math.max(...byIdx.keys());
  const totalDurSec = (wordTimings[wordTimings.length - 1]?.end ?? 0).toFixed(1);

  console.log(`\n  ${bold("Word timings")}  ${dim(`(${wordTimings.length} words · ${sentCount} sentences · ${totalDurSec}s)`)}`);
  console.log("  ┌────┬──────┬───────────────────────┬────────────────────────────────┐");
  console.log(`  │ ${dim("s# ")} │ ${dim("wds ")} │ ${"timing".padEnd(21)} │ ${"words preview".padEnd(30)} │`);
  console.log("  ├────┼──────┼───────────────────────┼────────────────────────────────┤");

  for (let i = 0; i <= maxSentIdx; i++) {
    const words = byIdx.get(i) ?? [];
    const count = String(words.length).padStart(4);
    const first = words[0];
    const last  = words[words.length - 1];
    const timing = first && last
      ? `${first.start.toFixed(2)}s → ${last.end.toFixed(2)}s`.padEnd(21)
      : dim("—".padEnd(21));
    const preview = words.slice(0, 5).map(w => w.word).join(" ").slice(0, 30).padEnd(30);
    const idxStr  = String(i).padStart(2);
    const countColor = words.length === 0 ? RED : (s: string) => s;
    console.log(`  │ ${idxStr} │ ${(typeof countColor === "function" ? countColor(count) : count)} │ ${timing} │ ${preview} │`);
  }

  console.log("  └────┴──────┴───────────────────────┴────────────────────────────────┘\n");
}

/** Logs a VideoSpec summary box (topic, accent, sentence/directive counts). */
export function logVideoSpecSummary(spec: {
  topic:       string;
  accentColor: string;
  sentences:   unknown[];
  directives:  unknown[];
}): void {
  const totalMs = (spec.sentences as Array<{ suggested_duration_ms?: number }>)
    .reduce((a, s) => a + (s.suggested_duration_ms ?? 0), 0);

  console.log(`\n  ${bold("VideoSpec")}`);
  console.log(`  ${dim("Topic     ")} ${spec.topic}`);
  console.log(`  ${dim("Accent    ")} ${spec.accentColor}  ${grn("■")}`);
  console.log(`  ${dim("Sentences ")} ${spec.sentences.length}`);
  console.log(`  ${dim("Directives")} ${spec.directives.length}`);
  if (totalMs > 0) console.log(`  ${dim("Est. dur  ")} ~${(totalMs / 1000).toFixed(0)}s`);
  console.log();
}

/** Logs a compact render props summary before Remotion is invoked. */
export function logRenderSummary(args: {
  durationInFrames: number;
  scenes:           number;
  clips:            number;
  wordTimings:      number;
  bgMusic?:         string;
  fps?:             number;
}): void {
  const fps = args.fps ?? 30;
  const durSec = (args.durationInFrames / fps).toFixed(1);

  console.log(`\n  ${bold("Render")}`);
  console.log(`  ${dim("Frames    ")} ${args.durationInFrames}  ${dim(`(${durSec}s @ ${fps}fps)`)}`);
  console.log(`  ${dim("Scenes    ")} ${args.scenes}`);
  console.log(`  ${dim("Clips     ")} ${args.clips === 0 ? dim("none — using bg-image.png") : args.clips}`);
  console.log(`  ${dim("Word tmgs ")} ${args.wordTimings === 0 ? ylw("none — frame-based fallback active") : args.wordTimings + " words"}`);
  if (args.bgMusic) console.log(`  ${dim("BG music  ")} ${args.bgMusic}`);
  console.log();
}

/** Logs a breakdown table for new-style SentenceVisualDirective[]. */
export function logNewDirectiveTable(
  directives: Array<{
    scene_template: string;
    sentence:       string;
    template_data:  { type: string; animation_type?: string };
  }>,
): void {
  const counts: Record<string, number> = {};
  console.log(`\n  Directive breakdown  (${directives.length} scenes):`);
  console.log("  ┌────┬────────────────────┬──────────────────┬────────────────────────────────┐");
  console.log("  │  # │ template           │ data type        │ sentence preview               │");
  console.log("  ├────┼────────────────────┼──────────────────┼────────────────────────────────┤");
  directives.forEach((d, i) => {
    const tmpl    = d.scene_template.padEnd(18);
    const dataTyp = (d.template_data.animation_type ?? d.template_data.type ?? "—").padEnd(16);
    const preview = d.sentence.slice(0, 30).padEnd(30);
    const idx     = String(i).padStart(2);
    console.log(`  │ ${idx} │ ${tmpl} │ ${dataTyp} │ ${preview} │`);
    counts[d.scene_template] = (counts[d.scene_template] ?? 0) + 1;
  });
  console.log("  └────┴────────────────────┴──────────────────┴────────────────────────────────┘");

  const total = directives.length;
  const parts = Object.entries(counts)
    .map(([k, v]) => `${k}: ${v} (${Math.round(v / total * 100)}%)`).join("  ·  ");
  console.log(`  Mix: ${parts}\n`);
}

/** @deprecated Use logNewDirectiveTable with VideoSpec directives instead. */
export function logDirectiveTable(
  directives: Array<{
    scene_template: string;
    animation_spec?: { type?: string } | null;
    highlight_words?: string[];
    visual_query?: string | null;
  }>,
  body: string[],
): void {
  const counts: Record<string, number> = {};
  console.log(`\n  Directive breakdown  (${directives.length} scenes):`);
  console.log("  ┌────┬────────────────────┬──────────────────┬────────────────────────────────┐");
  console.log("  │  # │ template           │ animation        │ sentence preview               │");
  console.log("  ├────┼────────────────────┼──────────────────┼────────────────────────────────┤");
  directives.forEach((d, i) => {
    const tmpl   = d.scene_template.padEnd(18);
    const anim   = (d.animation_spec?.type ?? (d.visual_query ? "image" : "—")).padEnd(16);
    const preview= (body[i] ?? "").slice(0, 30).padEnd(30);
    const idx    = String(i).padStart(2);
    console.log(`  │ ${idx} │ ${tmpl} │ ${anim} │ ${preview} │`);
    counts[d.scene_template] = (counts[d.scene_template] ?? 0) + 1;
  });
  console.log("  └────┴────────────────────┴──────────────────┴────────────────────────────────┘");

  const total = directives.length;
  const parts = Object.entries(counts)
    .map(([k, v]) => `${k}: ${v} (${Math.round(v / total * 100)}%)`).join("  ·  ");
  console.log(`  Mix: ${parts}\n`);
}
