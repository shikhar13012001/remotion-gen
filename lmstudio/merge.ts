import type {
  ScriptOutput, SentenceSceneDirective, ContentMetadata,
  ImageMotion, AnimationSpec,
} from "./types.js";
import { parseDirective } from "./mergeUtils.js";

export { defaultMetadata, parseDirective } from "./mergeUtils.js";

export function mergeOutputs(
  scriptOutput: ScriptOutput,
  sceneResults: Record<string, { directives: unknown[] }>
): ContentMetadata {
  const lookup = new Map<number, { group: string; directive: Record<string, unknown> }>();
  for (const [group, result] of Object.entries(sceneResults)) {
    for (const d of result.directives) {
      const dir = d as Record<string, unknown>;
      const idx = typeof dir.sentence_index === "number" ? dir.sentence_index : -1;
      if (idx >= 0) lookup.set(idx, { group, directive: dir });
    }
  }

  const sceneDirectives: SentenceSceneDirective[] = scriptOutput.scene_intents.map((intent) => {
    const { sentence_index, scene_template, highlight_words } = intent;
    const found = lookup.get(sentence_index);

    const base = {
      scene_template,
      highlight_words,
      image_motion:   null as null | ImageMotion,
      visual_query:   null as string | null,
      animation_spec: null as AnimationSpec | null,
      shot_type:      undefined as string | undefined,
      lighting:       undefined as string | undefined,
    };

    if (!found) {
      console.warn(`  No directive for sentence_index ${sentence_index} (${scene_template})`);
      return base;
    }

    const d = found.directive;

    switch (scene_template) {
      case "fullbleed":
        return parseDirective({ ...base, visual_query: d.visual_query, image_motion: d.image_motion,
          shot_type: d.shot_type, lighting: d.lighting });
      case "text_dominant":
        return parseDirective(base);
      case "stat_callout":
        return parseDirective({
          ...base,
          animation_spec: {
            type: "counter", entry_animation: d.entry_animation ?? "slam",
            duration_ms: d.duration_ms ?? 4000,
            data: { value: d.stat_value, prefix: d.stat_prefix ?? undefined, suffix: d.stat_suffix ?? undefined },
          },
        });
      case "animated_graphic":
        return parseDirective({
          ...base,
          animation_spec: {
            type: d.animation_type, entry_animation: d.entry_animation ?? "build_in",
            duration_ms: d.duration_ms ?? 5000, data: d.animation_data ?? {},
          },
        });
      default:
        return parseDirective(base);
    }
  });

  return {
    hook: scriptOutput.hook, body: scriptOutput.body, cta: scriptOutput.cta,
    title: scriptOutput.title, contentType: scriptOutput.contentType,
    mood: scriptOutput.mood, pacing: scriptOutput.pacing, visualStyle: scriptOutput.visualStyle,
    accentColor: scriptOutput.accentColor, sceneDirectives,
  };
}
