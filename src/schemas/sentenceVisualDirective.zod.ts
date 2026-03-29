import { z } from "zod";

// ─── TemplateData discriminated union ─────────────────────────────────────────

const EditorialHeadlineDataSchema = z.object({
  type:           z.literal("editorial_headline"),
  stamp_label:    z.string().optional(),
  line1:          z.string(),
  line2:          z.string(),
  highlight_line: z.string(),
  subtext:        z.string().optional(),
});

const SubjectCutoutDataSchema = z.object({
  type:        z.literal("subject_cutout"),
  image_query: z.string().min(5),
  annotation:  z.string().optional(),
});

const StatCalloutDataSchema = z.object({
  type:    z.literal("stat_callout"),
  value:   z.number(),
  label:   z.string(),
  context: z.string().optional(),
  prefix:  z.string().optional(),
  suffix:  z.string().optional(),
});

const SplitPhotoDataSchema = z.object({
  type:        z.literal("split_photo_data"),
  image_query: z.string().min(5),
  headline:    z.string(),
  facts:       z.array(z.string()).min(1).max(5),
});

const TransitionWipeDataSchema = z.object({
  type:  z.literal("transition_wipe"),
  label: z.string(),
});

const TimelineDataSchema = z.object({
  type:   z.literal("timeline"),
  events: z.array(z.object({
    time:   z.string(),
    event:  z.string(),
    detail: z.string(),
  })).min(2),
});

const FlowDiagramDataSchema = z.object({
  type:  z.literal("flow_diagram"),
  nodes: z.array(z.string()).min(2).max(8),
  style: z.enum(["arrow_chain", "tree", "cycle"]),
});

const AnimatedGraphicDataSchema = z.object({
  type:             z.literal("animated_graphic"),
  animation_type:   z.string(),
  animation_data:   z.record(z.string(), z.unknown()),
  entry_animation:  z.string(),
});

const TextDominantDataSchema = z.object({
  type:  z.literal("text_dominant"),
  lines: z.array(z.string()).min(1).max(3),
});

const FullbleedDataSchema = z.object({
  type:         z.literal("fullbleed"),
  image_query:  z.string().min(5),
  image_motion: z.enum(["slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right", "static"]),
});

export const TemplateDataSchema = z.discriminatedUnion("type", [
  EditorialHeadlineDataSchema,
  SubjectCutoutDataSchema,
  StatCalloutDataSchema,
  SplitPhotoDataSchema,
  TransitionWipeDataSchema,
  TimelineDataSchema,
  FlowDiagramDataSchema,
  AnimatedGraphicDataSchema,
  TextDominantDataSchema,
  FullbleedDataSchema,
]);

// ─── Full SentenceVisualDirective schema ──────────────────────────────────────

export const SentenceVisualDirectiveSchema = z.object({
  sentence_index: z.number().int().positive(),
  sentence:       z.string().min(1),
  duration_ms:    z.number().int().min(2000).max(8000),
  scene_template: z.enum([
    "editorial_headline", "subject_cutout", "stat_callout",
    "split_photo_data",   "transition_wipe", "timeline",
    "flow_diagram",       "animated_graphic", "text_dominant",
    "fullbleed",
  ]),
  text_treatment: z.object({
    accent_words: z.array(z.string()).min(1).max(3),
    animation:    z.enum(["word_by_word", "slam_in", "line_fade"]),
  }),
  template_data:  TemplateDataSchema,
  transition_out: z.enum(["hard_cut", "crossfade"]),
});

export type SentenceVisualDirectiveZod = z.infer<typeof SentenceVisualDirectiveSchema>;
