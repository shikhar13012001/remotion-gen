import { compactVisualQuery, countVisualQueryWords } from "./visualQuery";
import type {
  Beat,
  ScriptContextBundle,
  ScriptPackage,
  ScriptPlan,
  ScriptSpec,
  ValidatedScriptResult,
  ValidationIssue,
  ValidationReport,
} from "./types";

const VALID_BEATS: Beat[] = ["hook", "build", "turn", "reveal", "breathe", "close"];
const STOPWORDS = new Set([
  "the", "a", "an", "is", "was", "were", "in", "on", "at", "to", "of", "and",
  "but", "or", "for", "nor", "so", "yet", "it", "its", "this", "that", "these",
  "those", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "must", "shall", "can",
]);

interface NormalizeResult {
  script: ScriptPackage;
  corrected: boolean;
  issues: ValidationIssue[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function countWords(text: string): number {
  const tokens = text.match(/[A-Za-z0-9][A-Za-z0-9'.-]*/g) ?? [];
  return tokens.length;
}

function extractDataValue(text: string): number | null {
  const numeric = text.match(/\b\d[\d,]*(?:\.\d+)?\b/);
  if (!numeric) return null;
  const normalized = numeric[0].replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function collectHighlightWords(text: string, existing: string[]): string[] {
  const lowerText = text.toLowerCase();
  const validExisting = existing
    .filter((word) => typeof word === "string")
    .map((word) => word.trim())
    .filter((word) => word.length > 0 && lowerText.includes(word.toLowerCase()))
    .slice(0, 3);

  if (validExisting.length > 0) return validExisting;

  const tokens = (text.match(/\b[A-Za-z][A-Za-z'-]+\b/g) ?? [])
    .filter((token) => !STOPWORDS.has(token.toLowerCase()))
    .sort((a, b) => b.length - a.length);

  return Array.from(new Set(tokens)).slice(0, 2);
}

function normalizeBeat(rawBeat: unknown, fallbackBeat: Beat): Beat {
  return typeof rawBeat === "string" && VALID_BEATS.includes(rawBeat as Beat)
    ? rawBeat as Beat
    : fallbackBeat;
}

function summarizeRhythmIssues(sentences: ScriptPackage["sentences"]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  let repeatedOpenerCount = 0;
  for (let i = 1; i < sentences.length; i++) {
    const previousFirst = sentences[i - 1].text.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    const currentFirst = sentences[i].text.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    if (previousFirst && currentFirst && previousFirst === currentFirst) {
      repeatedOpenerCount++;
    }
  }

  if (repeatedOpenerCount >= 2) {
    issues.push({
      code: "repetitive_openings",
      message: "Too many consecutive sentences start with the same word.",
      repairable: true,
    });
  }

  const interior = sentences.slice(1, -1);
  if (interior.length > 1) {
    const counts = new Map<Beat, number>();
    for (const sentence of interior) {
      counts.set(sentence.beat, (counts.get(sentence.beat) ?? 0) + 1);
    }
    const dominant = Math.max(...counts.values());
    if (dominant / interior.length >= 0.7) {
      issues.push({
        code: "repetitive_beat_rhythm",
        message: "Interior beat rhythm is too repetitive.",
        repairable: true,
      });
    }
  }

  return issues;
}

function normalizeScriptPackage(
  raw: Record<string, unknown>,
  context: ScriptContextBundle,
  plan: ScriptPlan,
  spec: ScriptSpec,
): NormalizeResult {
  const issues: ValidationIssue[] = [];
  let corrected = false;
  const rawSentences = Array.isArray(raw.sentences) ? raw.sentences as Record<string, unknown>[] : [];
  const sentences = rawSentences
    .slice(0, spec.sentenceRange[1])
    .map((sentence, index) => {
      const expectedBeat = plan.beatSequence[index] ?? "build";
      const text = typeof sentence.text === "string" ? sentence.text.trim() : "";
      const beat = normalizeBeat(sentence.beat, expectedBeat);
      const sentenceIndex = typeof sentence.index === "number" ? sentence.index : index + 1;
      const isImagelessBeat = beat === "breathe" || beat === "close";
      const isRequiredData = plan.requiredDataSentenceIndices.includes(index + 1);
      const existingQuery = typeof sentence.visualQuery === "string" ? sentence.visualQuery.trim() : null;
      const normalizedQuery = !isImagelessBeat && !isRequiredData ? compactVisualQuery(existingQuery, { minWords: spec.visualQueryWords[0], maxWords: spec.visualQueryWords[1] }) : null;
      const needsImage = normalizedQuery !== null && plan.imageEligibleSentenceIndices.includes(index + 1);
      const rawHighlightWords = Array.isArray(sentence.highlightWords)
        ? sentence.highlightWords.filter((value): value is string => typeof value === "string")
        : [];
      const highlightWords = collectHighlightWords(text, rawHighlightWords);
      const extractedValue = extractDataValue(text);
      const dataValue = typeof sentence.dataValue === "number" && Number.isFinite(sentence.dataValue)
        ? sentence.dataValue
        : extractedValue;
      const suggestedDuration = clamp(
        typeof sentence.suggested_duration_ms === "number" ? sentence.suggested_duration_ms : 3000,
        spec.durationRangeMs[0],
        spec.durationRangeMs[1],
      );
      const wordCount = countWords(text);

      if (beat !== sentence.beat) corrected = true;
      if ((existingQuery ?? null) !== normalizedQuery) corrected = true;
      if (Array.isArray(sentence.highlightWords) && highlightWords.join("|") !== rawHighlightWords.slice(0, 3).join("|")) corrected = true;
      if (typeof sentence.suggested_duration_ms !== "number" || suggestedDuration !== sentence.suggested_duration_ms) corrected = true;
      if (typeof sentence.dataValue !== "number" && dataValue !== null) corrected = true;
      if (typeof sentence.word_count !== "number" || sentence.word_count !== wordCount) corrected = true;

      if (!text) {
        issues.push({
          code: "empty_sentence_text",
          sentenceIndex: index + 1,
          field: "text",
          message: "Sentence text is empty.",
          repairable: true,
        });
      }

      if (isRequiredData && dataValue === null) {
        issues.push({
          code: "missing_required_data_value",
          sentenceIndex: index + 1,
          field: "dataValue",
          message: "This sentence should carry a numeric data point or threshold.",
          repairable: true,
        });
      }

      if (normalizedQuery && countVisualQueryWords(normalizedQuery) > spec.visualQueryWords[1]) {
        issues.push({
          code: "visual_query_too_long",
          sentenceIndex: index + 1,
          field: "visualQuery",
          message: "visualQuery exceeds the allowed word count.",
          repairable: true,
        });
      }

      return {
        index: sentenceIndex,
        text,
        beat,
        word_count: wordCount,
        suggested_duration_ms: suggestedDuration,
        visualQuery: needsImage ? normalizedQuery : null,
        needsImage,
        highlightWords,
        dataValue,
      };
    });

  if (sentences.length > 0) {
    if (sentences[0].beat !== "hook") {
      corrected = true;
      sentences[0].beat = "hook";
    }
    if (sentences[sentences.length - 1].beat !== "close") {
      corrected = true;
      sentences[sentences.length - 1].beat = "close";
    }
  }

  const script: ScriptPackage = {
    topic: typeof raw.topic === "string" && raw.topic.trim().length > 0 ? raw.topic.trim() : context.topic,
    total_words: sentences.reduce((sum, sentence) => sum + sentence.word_count, 0),
    accentColor: context.design.accentColor,
    sentences,
  };

  return { script, corrected, issues };
}

export function validateScriptPackage(
  raw: Record<string, unknown>,
  context: ScriptContextBundle,
  plan: ScriptPlan,
  spec: ScriptSpec,
): ValidatedScriptResult {
  const normalized = normalizeScriptPackage(raw, context, plan, spec);
  const issues = [...normalized.issues];
  const script = normalized.script;

  if (script.sentences.length !== plan.sentenceCountTarget) {
    issues.push({
      code: "sentence_count_mismatch",
      field: "sentences",
      message: `Expected exactly ${plan.sentenceCountTarget} sentences, received ${script.sentences.length}.`,
      repairable: true,
    });
  }

  if (script.sentences.length < spec.sentenceRange[0] || script.sentences.length > spec.sentenceRange[1]) {
    issues.push({
      code: "sentence_count_out_of_range",
      field: "sentences",
      message: `Sentence count must stay within ${spec.sentenceRange[0]}-${spec.sentenceRange[1]}.`,
      repairable: true,
    });
  }

  if (script.total_words < spec.wordRange[0] || script.total_words > spec.wordRange[1]) {
    const delta = script.total_words < spec.wordRange[0]
      ? spec.wordRange[0] - script.total_words
      : script.total_words - spec.wordRange[1];
    issues.push({
      code: delta <= 10 ? "total_words_near_range" : "total_words_out_of_range",
      field: "total_words",
      message: `Total words must stay within ${spec.wordRange[0]}-${spec.wordRange[1]}.`,
      repairable: true,
    });
  }

  for (const requiredBeat of spec.requiredBeats) {
    if (!script.sentences.some((sentence) => sentence.beat === requiredBeat)) {
      issues.push({
        code: "missing_required_beat",
        field: "beat",
        message: `Required beat "${requiredBeat}" is missing.`,
        repairable: true,
      });
    }
  }

  const beatMismatches = script.sentences.reduce((count, sentence, index) => {
    const expectedBeat = plan.beatSequence[index];
    return count + (expectedBeat && sentence.beat !== expectedBeat ? 1 : 0);
  }, 0);

  if (beatMismatches > 0) {
    issues.push({
      code: beatMismatches > Math.max(3, Math.floor(plan.sentenceCountTarget / 3)) ? "beat_sequence_drift" : "beat_sequence_soft_drift",
      field: "beat",
      message: "Too many beats drift from the planned sequence.",
      repairable: true,
    });
  }

  const revealSentence = script.sentences[plan.revealSentenceIndex - 1];
  if (!revealSentence || revealSentence.beat !== "reveal") {
    issues.push({
      code: "reveal_position_mismatch",
      sentenceIndex: plan.revealSentenceIndex,
      field: "beat",
      message: "The planned reveal sentence does not land on a reveal beat.",
      repairable: true,
    });
  }

  for (const sentence of script.sentences) {
    if (!sentence.text) continue;
    const lowerText = sentence.text.toLowerCase();
    const invalidHighlight = sentence.highlightWords.find((word) => !lowerText.includes(word.toLowerCase()));
    if (invalidHighlight) {
      issues.push({
        code: "invalid_highlight_word",
        sentenceIndex: sentence.index,
        field: "highlightWords",
        message: "Highlight words must appear verbatim in the sentence text.",
        repairable: true,
      });
    }
    if (sentence.visualQuery && (countVisualQueryWords(sentence.visualQuery) < spec.visualQueryWords[0] || countVisualQueryWords(sentence.visualQuery) > spec.visualQueryWords[1])) {
      issues.push({
        code: "invalid_visual_query_word_count",
        sentenceIndex: sentence.index,
        field: "visualQuery",
        message: `visualQuery must be ${spec.visualQueryWords[0]}-${spec.visualQueryWords[1]} words.`,
        repairable: true,
      });
    }
    if ((sentence.beat === "breathe" || sentence.beat === "close") && (sentence.visualQuery !== null || sentence.needsImage)) {
      issues.push({
        code: "imageless_beat_has_image",
        sentenceIndex: sentence.index,
        field: "needsImage",
        message: "breathe and close beats must not request images.",
        repairable: true,
      });
    }
  }

  issues.push(...summarizeRhythmIssues(script.sentences));

  const severity = issues.some((issue) =>
    [
      "sentence_count_mismatch",
      "sentence_count_out_of_range",
      "total_words_out_of_range",
      "missing_required_beat",
      "beat_sequence_drift",
      "reveal_position_mismatch",
      "empty_sentence_text",
    ].includes(issue.code),
  )
    ? "fail"
    : issues.length > 0
      ? "warn"
      : "ok";

  const report: ValidationReport = { severity, issues };

  return {
    script,
    report,
    corrected: normalized.corrected,
    repaired: false,
  };
}

export function summarizeValidationReport(report: ValidationReport): string[] {
  return report.issues.map((issue) => {
    const location = issue.sentenceIndex ? `sentence ${issue.sentenceIndex}` : issue.field ?? "script";
    return `${issue.code} (${location}): ${issue.message}`;
  });
}
