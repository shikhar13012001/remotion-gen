import type { SentenceSceneDirective } from "../../lmstudio/index";
import type { WordTiming } from "../utils/sentenceBoundaries";

/** Compute hue (0-360) from accent hex color — replaces lookup-table approach. */
export function hueFromAccent(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
          : max === g ? ((b - r) / d + 2) / 6
          :             ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

/** Pick a clip from a list by wrapping index. Returns undefined when list is empty. */
export function pickClip(clips: string[], index: number): string | undefined {
  if (!clips || clips.length === 0) return undefined;
  return clips[index % clips.length];
}

/**
 * Auto-detects a scene template from sentence words when no LLM directive is available.
 * Questions → text_dominant. Sentences with numbers → stat_callout. Default → fullbleed.
 */
export function autoDetectTemplate(words: string[]): "fullbleed" | "text_dominant" | "stat_callout" | "animated_graphic" {
  const text = words.join(" ");
  if (text.trim().endsWith("?")) return "text_dominant";
  if (/\b\d[\d,.]*\s*(million|billion|thousand|%|percent)?\b/i.test(text)) return "stat_callout";
  return "fullbleed";
}

/**
 * Builds a minimal SentenceSceneDirective fallback when no LLM directive is available.
 * Used by SceneDirectiveRenderer when metadata.sceneDirectives[j] is absent.
 */
export function autoFallbackDirective(
  wordTimings: WordTiming[],
  sentenceIndex: number,
): SentenceSceneDirective {
  const words = wordTimings
    .filter((w) => w.sentenceIndex === sentenceIndex)
    .map((w) => w.word);
  const template = autoDetectTemplate(words);
  return {
    scene_template:  template,
    image_motion:    template === "fullbleed" ? "slow_zoom_in" : null,
    highlight_words: [],
    visual_query:    null,
    animation_spec:  null,
  };
}
