import { ANIMATION_TYPES } from "./constants.js";
import type {
  SentenceSceneDirective, ContentMetadata,
  ImageMotion, AnimationSpec, AnimationType,
} from "./types.js";

const VALID_TEMPLATES = ["fullbleed", "text_dominant", "stat_callout", "animated_graphic"] as const;
export const VALID_MOTIONS: ImageMotion[] = ["slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right", "static"];
export type ValidTemplate = typeof VALID_TEMPLATES[number];
export { VALID_TEMPLATES };

export function defaultMetadata(rawContent: string): ContentMetadata {
  const sentences = rawContent.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
  return {
    hook:            sentences[0] ?? rawContent.slice(0, 80),
    body:            sentences.slice(1, -1),
    cta:             sentences[sentences.length - 1] ?? "Follow for more.",
    mood:            "dark",
    pacing:          "medium",
    visualStyle:     "bold",
    title:           "Watch This",
    contentType:     "factual",
    accentColor:     "#a78bfa",
    sceneDirectives: [],
  };
}

export function parseDirective(raw: unknown): SentenceSceneDirective {
  const d = (raw ?? {}) as Record<string, unknown>;

  const template: ValidTemplate = (VALID_TEMPLATES as readonly string[]).includes(d.scene_template as string)
    ? (d.scene_template as ValidTemplate)
    : "fullbleed";

  const isAnimated = template === "animated_graphic";

  let animation_spec: AnimationSpec | null = null;
  if (d.animation_spec && typeof d.animation_spec === "object") {
    const spec = d.animation_spec as Record<string, unknown>;
    if (typeof spec.type === "string" && (ANIMATION_TYPES as readonly string[]).includes(spec.type)) {
      animation_spec = {
        type:            spec.type as AnimationType,
        data:            (typeof spec.data === "object" && spec.data !== null)
                           ? (spec.data as Record<string, unknown>) : {},
        entry_animation: (["build_in", "slam", "draw"] as const).includes(spec.entry_animation as never)
                           ? (spec.entry_animation as AnimationSpec["entry_animation"]) : "build_in",
        duration_ms:     typeof spec.duration_ms === "number" ? spec.duration_ms : 3000,
      };
    }
  }

  return {
    scene_template:  template,
    image_motion:    isAnimated ? null
      : VALID_MOTIONS.includes(d.image_motion as ImageMotion)
        ? (d.image_motion as ImageMotion) : "slow_zoom_in",
    highlight_words: Array.isArray(d.highlight_words)
      ? (d.highlight_words as unknown[]).filter((w): w is string => typeof w === "string").slice(0, 3)
      : [],
    visual_query:    isAnimated ? null : (typeof d.visual_query === "string" ? d.visual_query : null),
    animation_spec,
    shot_type: !isAnimated && typeof d.shot_type === "string" ? d.shot_type : undefined,
    lighting:  !isAnimated && typeof d.lighting  === "string" ? d.lighting  : undefined,
  };
}
