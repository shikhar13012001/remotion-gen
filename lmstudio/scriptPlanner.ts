import * as fs from "fs";
import * as path from "path";
import type { Beat, ScriptContextBundle, ScriptPlan, ScriptSpec } from "./types";

const PROMPT_PATH = path.join(__dirname, "prompts", "prompt_script_planner.txt");

const DEFAULT_ACT_LABELS = ["Setup", "Escalation", "Consequence"];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dedupeNumbers(values: number[], min: number, max: number): number[] {
  return Array.from(new Set(values.filter((value) => Number.isFinite(value)).map((value) => clamp(Math.round(value), min, max)))).sort((a, b) => a - b);
}

export function loadPlannerPrompt(): string {
  if (fs.existsSync(PROMPT_PATH)) {
    return fs.readFileSync(PROMPT_PATH, "utf-8").trim();
  }
  return "Return only ScriptPlan JSON. No prose outside the JSON object.";
}

export function buildPlannerUserMessage(context: ScriptContextBundle, spec: ScriptSpec): string {
  return [
    "SCRIPT CONTEXT BUNDLE:",
    JSON.stringify(context, null, 2),
    "",
    "SCRIPT SPEC:",
    JSON.stringify(spec, null, 2),
  ].join("\n");
}

export function buildDefaultBeatSequence(sentenceCount: number): Beat[] {
  const base: Beat[] = [
    "hook",
    "build",
    "build",
    "turn",
    "build",
    "breathe",
    "build",
    "reveal",
    "build",
    "breathe",
    "build",
    "close",
  ];

  if (sentenceCount <= base.length) {
    return base.slice(0, sentenceCount).map((beat, index, beats) => {
      if (index === 0) return "hook";
      if (index === beats.length - 1) return "close";
      return beat;
    });
  }

  const beats = [...base];
  while (beats.length < sentenceCount - 1) {
    beats.splice(beats.length - 1, 0, "build");
  }
  beats[0] = "hook";
  beats[beats.length - 1] = "close";
  return beats.slice(0, sentenceCount);
}

function buildDefaultActRanges(sentenceCount: number): Array<{ label: string; start: number; end: number }> {
  const chunk = Math.ceil(sentenceCount / DEFAULT_ACT_LABELS.length);
  const ranges: Array<{ label: string; start: number; end: number }> = [];

  for (let i = 0; i < DEFAULT_ACT_LABELS.length; i++) {
    const start = i * chunk + 1;
    const end = Math.min(sentenceCount, (i + 1) * chunk);
    if (start > sentenceCount) break;
    ranges.push({ label: DEFAULT_ACT_LABELS[i], start, end });
  }

  if (ranges.length > 0) {
    ranges[ranges.length - 1].end = sentenceCount;
  }

  return ranges;
}

function normalizeActRanges(
  raw: unknown,
  sentenceCount: number,
): Array<{ label: string; start: number; end: number }> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return buildDefaultActRanges(sentenceCount);
  }

  const ranges = raw
    .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object")
    .map((value, index) => {
      const start = clamp(typeof value.start === "number" ? value.start : index * Math.ceil(sentenceCount / 3) + 1, 1, sentenceCount);
      const end = clamp(typeof value.end === "number" ? value.end : start, start, sentenceCount);
      const label = typeof value.label === "string" && value.label.trim().length > 0
        ? value.label.trim()
        : DEFAULT_ACT_LABELS[index] ?? `Act ${index + 1}`;
      return { label, start, end };
    })
    .sort((a, b) => a.start - b.start)
    .slice(0, 4);

  if (ranges.length === 0) return buildDefaultActRanges(sentenceCount);

  ranges[0].start = 1;
  ranges[ranges.length - 1].end = sentenceCount;

  for (let i = 1; i < ranges.length; i++) {
    ranges[i].start = Math.max(ranges[i - 1].start + 1, ranges[i].start);
    ranges[i - 1].end = Math.max(ranges[i - 1].start, Math.min(ranges[i - 1].end, ranges[i].start - 1));
  }

  ranges[ranges.length - 1].end = sentenceCount;
  return ranges;
}

export function buildDefaultScriptPlan(context: ScriptContextBundle, spec: ScriptSpec): ScriptPlan {
  const sentenceCountTarget = clamp(
    Math.round((spec.sentenceRange[0] + spec.sentenceRange[1]) / 2),
    spec.sentenceRange[0],
    spec.sentenceRange[1],
  );
  const beatSequence = buildDefaultBeatSequence(sentenceCountTarget);
  const revealSentenceIndex = Math.max(2, beatSequence.findIndex((beat) => beat === "reveal") + 1);
  const breatheSentenceIndices = dedupeNumbers(
    beatSequence
      .map((beat, index) => ({ beat, index: index + 1 }))
      .filter((entry) => entry.beat === "breathe")
      .map((entry) => entry.index),
    1,
    sentenceCountTarget,
  );
  const requiredDataSentenceIndices = dedupeNumbers(
    beatSequence
      .map((beat, index) => ({ beat, index: index + 1 }))
      .filter((entry) => entry.beat === "reveal" || entry.beat === "turn")
      .map((entry) => entry.index),
    1,
    sentenceCountTarget,
  );
  const imageEligibleSentenceIndices = dedupeNumbers(
    beatSequence
      .map((beat, index) => ({ beat, index: index + 1 }))
      .filter((entry) => entry.beat === "hook" || entry.beat === "build" || entry.beat === "turn")
      .map((entry) => entry.index)
      .filter((index) => !requiredDataSentenceIndices.includes(index)),
    1,
    sentenceCountTarget,
  );

  return {
    centralQuestion: `What actually explains ${context.topic}?`,
    closingTruth: `The viewer should understand the mechanism behind ${context.topic}.`,
    sentenceCountTarget,
    wordCountTarget: [...spec.wordRange],
    actRanges: buildDefaultActRanges(sentenceCountTarget),
    beatSequence,
    revealSentenceIndex,
    breatheSentenceIndices,
    imageEligibleSentenceIndices,
    requiredDataSentenceIndices,
    visualMotifHints: context.guide.preferredVisualNouns.slice(0, 4),
  };
}

export function sanitizeScriptPlan(raw: Record<string, unknown>, context: ScriptContextBundle, spec: ScriptSpec): ScriptPlan {
  const fallback = buildDefaultScriptPlan(context, spec);
  const sentenceCountTarget = clamp(
    typeof raw.sentenceCountTarget === "number" ? raw.sentenceCountTarget : fallback.sentenceCountTarget,
    spec.sentenceRange[0],
    spec.sentenceRange[1],
  );

  const beatSequenceRaw = Array.isArray(raw.beatSequence)
    ? raw.beatSequence.filter((value): value is Beat => typeof value === "string" && ["hook", "build", "turn", "reveal", "breathe", "close"].includes(value))
    : [];
  const beatSequence = beatSequenceRaw.length > 0
    ? beatSequenceRaw.slice(0, sentenceCountTarget)
    : buildDefaultBeatSequence(sentenceCountTarget);

  while (beatSequence.length < sentenceCountTarget) {
    beatSequence.push("build");
  }
  beatSequence[0] = "hook";
  beatSequence[beatSequence.length - 1] = "close";
  for (let index = 1; index < beatSequence.length - 1; index++) {
    if (beatSequence[index] === "hook" || beatSequence[index] === "close") {
      beatSequence[index] = "build";
    }
  }

  if (!beatSequence.includes("turn")) beatSequence[Math.max(1, Math.floor(sentenceCountTarget / 3))] = "turn";
  if (!beatSequence.includes("reveal")) beatSequence[Math.max(2, sentenceCountTarget - 3)] = "reveal";
  if (!beatSequence.includes("breathe")) beatSequence[Math.max(2, Math.floor(sentenceCountTarget / 2))] = "breathe";

  const fallbackWordTarget = fallback.wordCountTarget;
  const wordCountTarget = Array.isArray(raw.wordCountTarget)
    && raw.wordCountTarget.length === 2
    && typeof raw.wordCountTarget[0] === "number"
    && typeof raw.wordCountTarget[1] === "number"
      ? [
          clamp(raw.wordCountTarget[0], spec.wordRange[0], spec.wordRange[1]),
          clamp(raw.wordCountTarget[1], spec.wordRange[0], spec.wordRange[1]),
        ] as [number, number]
      : fallbackWordTarget;
  if (wordCountTarget[0] > wordCountTarget[1]) wordCountTarget[1] = wordCountTarget[0];

  const revealSentenceIndex = clamp(
    typeof raw.revealSentenceIndex === "number"
      ? raw.revealSentenceIndex
      : beatSequence.findIndex((beat) => beat === "reveal") + 1,
    1,
    sentenceCountTarget,
  );
  beatSequence[revealSentenceIndex - 1] = "reveal";

  const breatheSentenceIndices = dedupeNumbers(
    Array.isArray(raw.breatheSentenceIndices) ? raw.breatheSentenceIndices as number[] : [],
    1,
    sentenceCountTarget,
  );
  if (breatheSentenceIndices.length === 0) {
    breatheSentenceIndices.push(Math.max(2, Math.floor(sentenceCountTarget / 2)));
  }
  for (const index of breatheSentenceIndices) {
    if (index > 1 && index < sentenceCountTarget && index !== revealSentenceIndex) {
      beatSequence[index - 1] = "breathe";
    }
  }

  const requiredDataSentenceIndices = dedupeNumbers(
    Array.isArray(raw.requiredDataSentenceIndices) ? raw.requiredDataSentenceIndices as number[] : [],
    1,
    sentenceCountTarget,
  ).filter((index) => {
    const beat = beatSequence[index - 1];
    return beat !== "hook" && beat !== "close" && beat !== "breathe";
  });
  if (requiredDataSentenceIndices.length === 0) {
    const turnIndex = beatSequence.findIndex((beat) => beat === "turn") + 1;
    if (turnIndex > 0) requiredDataSentenceIndices.push(turnIndex);
    requiredDataSentenceIndices.push(revealSentenceIndex);
  }

  const imageEligibleSentenceIndices = dedupeNumbers(
    Array.isArray(raw.imageEligibleSentenceIndices) ? raw.imageEligibleSentenceIndices as number[] : [],
    1,
    sentenceCountTarget,
  ).filter((index) => {
    const beat = beatSequence[index - 1];
    return !requiredDataSentenceIndices.includes(index) &&
      beat !== "breathe" &&
      beat !== "close";
  });

  const visualMotifHints = Array.isArray(raw.visualMotifHints)
    ? raw.visualMotifHints.filter((value): value is string => typeof value === "string" && value.trim().length >= 3).slice(0, 6)
    : [];

  return {
    centralQuestion: typeof raw.centralQuestion === "string" && raw.centralQuestion.trim().length >= 12
      ? raw.centralQuestion.trim()
      : fallback.centralQuestion,
    closingTruth: typeof raw.closingTruth === "string" && raw.closingTruth.trim().length >= 12
      ? raw.closingTruth.trim()
      : fallback.closingTruth,
    sentenceCountTarget,
    wordCountTarget,
    actRanges: normalizeActRanges(raw.actRanges, sentenceCountTarget),
    beatSequence,
    revealSentenceIndex,
    breatheSentenceIndices,
    imageEligibleSentenceIndices,
    requiredDataSentenceIndices,
    visualMotifHints: visualMotifHints.length > 0 ? visualMotifHints : fallback.visualMotifHints,
  };
}
