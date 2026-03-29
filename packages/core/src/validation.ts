import { z } from "zod";
import type { SentenceVisualDirective } from "./types";

const SubjectCutoutSchema = z.object({
  type:        z.literal("subject_cutout"),
  stamp_label: z.string().min(1),
  headline:    z.string().max(60),
  annotations: z.array(z.object({ text: z.string().max(80), side: z.enum(["left","right"]) })).length(2),
  image_query: z.string().min(5),
});

const EditorialHeadlineSchema = z.object({
  type:           z.literal("editorial_headline"),
  stamp_label:    z.string().min(1),
  line1:          z.string().max(30),
  line2:          z.string().max(30),
  highlight_line: z.string().max(40),
  subtext:        z.string().max(100),
});

const SplitPhotoSchema = z.object({
  type:        z.literal("split_photo_data"),
  stamp_label: z.string().min(1),
  headline:    z.string().max(50),
  facts:       z.array(z.string().max(80)).min(3).max(5),
  image_query: z.string().min(5),
});

const TimelineSchema = z.object({
  type:        z.literal("timeline"),
  headline:    z.string().max(40),
  stamp_label: z.string().min(1),
  items:       z.array(z.object({ time: z.string(), event: z.string().max(60), detail: z.string().max(80) })).min(3).max(5),
});

const StatCalloutSchema = z.object({
  type:        z.literal("stat_callout"),
  stamp_label: z.string().min(1),
  value:       z.number(),
  prefix:      z.string(),
  suffix:      z.string(),
  label:       z.string().max(30),
  context:     z.string().max(120),
});

const TextDominantSchema = z.object({
  type:  z.literal("text_dominant"),
  lines: z.array(z.string().max(60)).min(1).max(3),
});

const FlowDiagramSchema = z.object({
  type:        z.literal("flow_diagram"),
  stamp_label: z.string().min(1),
  headline:    z.string().max(50),
  nodes:       z.array(z.string().max(40)).min(3).max(6),
});

const TransitionWipeSchema = z.object({
  type:  z.literal("transition_wipe"),
  label: z.string().max(30),
});

const TemplateDataSchema = z.discriminatedUnion("type", [
  SubjectCutoutSchema, EditorialHeadlineSchema, SplitPhotoSchema,
  TimelineSchema, StatCalloutSchema, TextDominantSchema, FlowDiagramSchema, TransitionWipeSchema,
]);

const DirectiveSchema = z.object({
  sentence:       z.string().min(1),
  duration_ms:    z.number().min(2000).max(8000),
  scene_template: z.enum(["subject_cutout","editorial_headline","split_photo_data","timeline","stat_callout","text_dominant","flow_diagram","transition_wipe"]),
  text_treatment: z.object({
    accent_words: z.array(z.string()).min(1).max(3),
    animation:    z.enum(["word_by_word","line_reveal","slam_in"]),
  }),
  template_data:  TemplateDataSchema,
  transition_out: z.enum(["hard_cut","crossfade"]),
}).superRefine((data, ctx) => {
  if (["subject_cutout","split_photo_data"].includes(data.scene_template)) {
    const d = data.template_data as { image_query?: string };
    if (!d.image_query || d.image_query.split(" ").length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "image_query must be 5+ specific words" });
    }
  }
  data.text_treatment.accent_words.forEach(word => {
    if (!data.sentence.toLowerCase().includes(word.toLowerCase())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `accent_word "${word}" not found in sentence` });
    }
  });
  if (data.scene_template === "transition_wipe" && data.template_data.type !== "transition_wipe") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "transition_wipe scene must use TransitionWipeData" });
  }
});

function textDominantFallback(sentence: string): SentenceVisualDirective {
  const words = sentence.split(" ");
  const lines = [];
  for (let i = 0; i < Math.min(words.length, 12); i += 6) {
    lines.push(words.slice(i, i + 6).join(" "));
  }
  return {
    sentence,
    duration_ms:    Math.max(2000, Math.min(8000, Math.round(sentence.split(" ").length * 150 / 100) * 100)),
    scene_template: "text_dominant",
    text_treatment: { accent_words: [words[0] ?? ""], animation: "word_by_word" },
    template_data:  { type: "text_dominant", lines: lines.slice(0, 3) },
    transition_out: "hard_cut",
  };
}

export function validateDirectives(raw: unknown[]): SentenceVisualDirective[] {
  const results: SentenceVisualDirective[] = [];
  const counts: Record<string, number> = {};

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const parsed = DirectiveSchema.safeParse(item);
    if (parsed.success) {
      results.push(parsed.data as SentenceVisualDirective);
      const t = parsed.data.scene_template;
      counts[t] = (counts[t] ?? 0) + 1;
    } else {
      const sentence = typeof (item as Record<string,unknown>)?.sentence === "string"
        ? (item as Record<string,unknown>).sentence as string : `[sentence ${i}]`;
      console.warn(`[validate] directive ${i} failed — falling back to text_dominant`);
      console.warn(`  sentence: "${sentence.slice(0, 60)}"`);
      const issues = (parsed.error as unknown as { issues: Array<{ message: string }> }).issues;
      issues.forEach(e => console.warn(`  error: ${e.message}`));
      results.push(textDominantFallback(sentence));
      counts["text_dominant"] = (counts["text_dominant"] ?? 0) + 1;
    }
  }

  const total = results.length;
  console.log(`[validate] ${total} directives validated:`);
  Object.entries(counts).forEach(([k, v]) => {
    const pct = Math.round(v / total * 100);
    const warn = v / total > 0.40 ? " ⚠ >40%" : "";
    console.log(`  ${k}: ${v} (${pct}%)${warn}`);
  });

  return results;
}
