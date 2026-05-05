// ─── All exported types for the lmstudio pipeline ─────────────────────────────

import { z } from "zod";

// ─── Design token types ────────────────────────────────────────────────────────

export const TokenMapSchema = z.object({
  fontFamily:  z.string(),
  colors:      z.record(z.string(), z.string()),
  typography:  z.record(z.string(), z.object({
    size:       z.string(),
    weight:     z.number(),
    lineHeight: z.number(),
  })),
  spacing:     z.record(z.string(), z.string()),
  radii:       z.record(z.string(), z.string()),
});

export type TokenMap = z.infer<typeof TokenMapSchema>;

// ─── Call 1 output: ScriptPackage ─────────────────────────────────────────────

export type Beat = "hook" | "build" | "turn" | "reveal" | "breathe" | "close";

export interface ScriptSentence {
  index:                 number;
  text:                  string;
  beat:                  Beat;
  word_count:            number;
  suggested_duration_ms: number;
  /** Compact 3-4 word Pinterest-friendly image query for fullbleed/subject scenes; null for breathe, close, or data-only sentences. */
  visualQuery:           string | null;
  /** True when this sentence would benefit from a photographic background. */
  needsImage:            boolean;
  /** 1–3 key words that carry emotional or factual weight; verbatim from sentence text. */
  highlightWords:        string[];
  /** Primary numeric value mentioned in the sentence; null when no number is present. */
  dataValue:             number | null;
}

export interface ScriptPackage {
  topic:       string;
  total_words: number;
  accentColor: string;
  sentences:   ScriptSentence[];
}

// ─── Call 1b output: VisualBrief ──────────────────────────────────────────────

/** A narrative act — 2–4 sections that divide the script by momentum. */
export interface VisualAct {
  /** e.g. "Setup", "Escalation", "Revelation", "Consequence" */
  label:             string;
  /** 1-based sentence indices, inclusive: [first, last] */
  sentence_range:    [number, number];
  /** Template this act should lean toward */
  dominant_template: "animated_graphic" | "fullbleed" | "text_dominant" | "stat_callout";
  /** One-sentence visual tone description for this act */
  visual_tone:       string;
}

/** A sentence pre-identified as a key visual moment — Call 2 must honour it. */
export interface KeyMoment {
  /** 1-based sentence index */
  sentence_index:  number;
  /** Hard template assignment */
  scene_template:  "animated_graphic" | "fullbleed" | "text_dominant" | "stat_callout";
  /** Animation type hint when scene_template is animated_graphic */
  animation_hint?: string;
  /** One-line reason this sentence deserves a specific treatment */
  reason:          string;
}

/** Exact per-template allocation — must sum to script.sentences.length. */
export interface TemplateBudget {
  animated_graphic: number;
  stat_callout:     number;
  fullbleed:        number;
  text_dominant:    number;
}

/**
 * High-level visual brief produced by Call 1b.
 * Passed verbatim to Call 2 so the visual director works from a pre-computed
 * plan rather than inferring structure from beat tags alone.
 */
export interface VisualBrief {
  /** Overall visual identity of the video, one sentence */
  visual_theme: string;
  /** 2–4 narrative acts */
  acts:         VisualAct[];
  /** Sentences the director has pre-assigned — Call 2 cannot override these */
  key_moments:  KeyMoment[];
  /** Template counts that sum to sentences.length */
  budget:       TemplateBudget;
  /** Pacing arc note, e.g. "Open kinetic, data-heavy middle, quiet close" */
  rhythm_notes: string;
}

// ─── Call 2 output: SentenceVisualDirective ────────────────────────────────────

export type SceneTemplate =
  // Legacy data-viz bucket (counter, chart, map, etc.)
  | "animated_graphic"
  // Promoted first-class from animated_graphic sub-types
  | "timeline"
  | "flow_diagram"
  // Classic templates (kept for backward compat + fullbleed image scenes)
  | "fullbleed"
  | "text_dominant"
  | "stat_callout"
  // New editorial templates
  | "editorial_headline"
  | "subject_cutout"
  | "split_photo_data"
  | "transition_wipe";

export type TemplateData =
  | {
      type:          "editorial_headline";
      stamp_label?:  string;
      line1:         string;
      line2:         string;
      highlight_line: string;
      subtext?:      string;
    }
  | {
      type:        "subject_cutout";
      image_query: string;
      annotation?: string;
    }
  | {
      type:     "stat_callout";
      value:    number;
      label:    string;
      context?: string;
      prefix?:  string;
      suffix?:  string;
    }
  | {
      type:        "split_photo_data";
      image_query: string;
      headline:    string;
      facts:       string[];
    }
  | {
      type:  "transition_wipe";
      label: string;
    }
  | {
      type:   "timeline";
      events: Array<{ time: string; event: string; detail: string }>;
    }
  | {
      type:  "flow_diagram";
      nodes: string[];
      style: "arrow_chain" | "tree" | "cycle";
    }
  | {
      type:             "animated_graphic";
      animation_type:   string;
      animation_data:   Record<string, unknown>;
      entry_animation:  string;
    }
  | {
      type:  "text_dominant";
      lines: string[];
    }
  | {
      type:         "fullbleed";
      image_query:  string;
      image_motion: "slow_zoom_in" | "slow_zoom_out" | "pan_left" | "pan_right" | "static";
    };

export interface SentenceVisualDirective {
  sentence_index: number;
  sentence:       string;
  // timing comes from ElevenLabs only — see computeSentenceDurations
  scene_template: SceneTemplate;
  text_treatment: {
    accent_words: string[];
    animation:    "word_by_word" | "slam_in" | "line_fade";
  };
  template_data:  TemplateData;
  transition_out: "hard_cut" | "crossfade";
}

// ─── Final pipeline output ─────────────────────────────────────────────────────

export interface VideoSpec {
  topic:       string;
  accentColor: string;
  sentences:   ScriptSentence[];
  directives:  SentenceVisualDirective[];
}

// ─── Animation type (legacy — kept for registry compatibility) ────────────────

import type { ANIMATION_TYPES } from "./constants";
export type AnimationType = typeof ANIMATION_TYPES[number];

// ─── LM Studio caller options ─────────────────────────────────────────────────

export interface LMCallOptions {
  model?:       string;
  temperature?: number;
  maxTokens?:   number;
  /** LM Studio structured output — passed as response_format.json_schema */
  schema?:      Record<string, unknown>;
  schemaName?:  string;
}

// ─── Legacy types — kept for backward compatibility ───────────────────────────

/** @deprecated Use ScriptPackage + VideoSpec instead */
export type ImageMotion = "slow_zoom_in" | "slow_zoom_out" | "pan_left" | "pan_right" | "static";

/** @deprecated Use SentenceVisualDirective instead */
export type SentenceSceneDirective = {
  scene_template:  "fullbleed" | "text_dominant" | "stat_callout" | "animated_graphic";
  image_motion:    ImageMotion | null;
  highlight_words: string[];
  visual_query:    string | null;
  animation_spec:  AnimationSpec | null;
  shot_type?:      string;
  lighting?:       string;
  resolved_clip?:  string;
};

/** @deprecated Use SentenceVisualDirective.template_data.animation_type */
export interface AnimationSpec {
  type:            string;
  data:            Record<string, unknown>;
  entry_animation: "build_in" | "slam" | "draw";
  duration_ms:     number;
}

/** @deprecated Use VideoSpec */
export type ContentMetadata = {
  hook:            string;
  body:            string[];
  cta:             string;
  mood:            "mysterious" | "energetic" | "inspiring" | "dark" | "calm";
  pacing:          "slow" | "medium" | "fast";
  visualStyle:     "cinematic" | "bold" | "minimal" | "neon";
  title:           string;
  contentType:     "poetry" | "educational" | "motivational" | "storytelling" | "factual";
  accentColor:     string;
  sceneDirectives: SentenceSceneDirective[];
};
