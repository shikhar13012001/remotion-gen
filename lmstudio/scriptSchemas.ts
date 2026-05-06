import type { Beat, ScriptSpec } from "./types";

const BEATS: Beat[] = ["hook", "build", "turn", "reveal", "breathe", "close"];

export function buildScriptPackageSchema(spec: ScriptSpec): Record<string, unknown> {
  return {
    type: "object",
    required: ["topic", "total_words", "accentColor", "sentences"],
    additionalProperties: false,
    properties: {
      topic: { type: "string", minLength: 3 },
      total_words: { type: "integer", minimum: spec.wordRange[0], maximum: spec.wordRange[1] },
      accentColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
      sentences: {
        type: "array",
        minItems: spec.sentenceRange[0],
        maxItems: spec.sentenceRange[1],
        items: {
          type: "object",
          required: ["index", "text", "beat", "word_count", "suggested_duration_ms", "visualQuery", "needsImage", "highlightWords", "dataValue"],
          additionalProperties: false,
          properties: {
            index: { type: "integer", minimum: 1 },
            text: { type: "string", minLength: 5 },
            beat: { type: "string", enum: BEATS },
            word_count: { type: "integer", minimum: 1, maximum: 40 },
            suggested_duration_ms: { type: "integer", minimum: spec.durationRangeMs[0], maximum: spec.durationRangeMs[1] },
            visualQuery: { type: ["string", "null"] },
            needsImage: { type: "boolean" },
            highlightWords: {
              type: "array",
              items: { type: "string" },
              minItems: 0,
              maxItems: 3,
            },
            dataValue: { type: ["number", "null"] },
          },
        },
      },
    },
  };
}

export function buildScriptPlanSchema(spec: ScriptSpec): Record<string, unknown> {
  return {
    type: "object",
    required: [
      "centralQuestion",
      "closingTruth",
      "sentenceCountTarget",
      "wordCountTarget",
      "actRanges",
      "beatSequence",
      "revealSentenceIndex",
      "breatheSentenceIndices",
      "imageEligibleSentenceIndices",
      "requiredDataSentenceIndices",
      "visualMotifHints",
    ],
    additionalProperties: false,
    properties: {
      centralQuestion: { type: "string", minLength: 12, maxLength: 180 },
      closingTruth: { type: "string", minLength: 12, maxLength: 180 },
      sentenceCountTarget: { type: "integer", minimum: spec.sentenceRange[0], maximum: spec.sentenceRange[1] },
      wordCountTarget: {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: { type: "integer", minimum: spec.wordRange[0], maximum: spec.wordRange[1] },
      },
      actRanges: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          required: ["label", "start", "end"],
          additionalProperties: false,
          properties: {
            label: { type: "string", minLength: 3, maxLength: 40 },
            start: { type: "integer", minimum: 1, maximum: spec.sentenceRange[1] },
            end: { type: "integer", minimum: 1, maximum: spec.sentenceRange[1] },
          },
        },
      },
      beatSequence: {
        type: "array",
        minItems: spec.sentenceRange[0],
        maxItems: spec.sentenceRange[1],
        items: { type: "string", enum: BEATS },
      },
      revealSentenceIndex: { type: "integer", minimum: 1, maximum: spec.sentenceRange[1] },
      breatheSentenceIndices: {
        type: "array",
        items: { type: "integer", minimum: 1, maximum: spec.sentenceRange[1] },
        minItems: 1,
        maxItems: 4,
      },
      imageEligibleSentenceIndices: {
        type: "array",
        items: { type: "integer", minimum: 1, maximum: spec.sentenceRange[1] },
        minItems: 0,
        maxItems: spec.sentenceRange[1],
      },
      requiredDataSentenceIndices: {
        type: "array",
        items: { type: "integer", minimum: 1, maximum: spec.sentenceRange[1] },
        minItems: 0,
        maxItems: spec.sentenceRange[1],
      },
      visualMotifHints: {
        type: "array",
        items: { type: "string", minLength: 3, maxLength: 40 },
        minItems: 2,
        maxItems: 6,
      },
    },
  };
}
