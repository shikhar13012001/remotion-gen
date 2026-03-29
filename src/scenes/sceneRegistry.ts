import type { SentenceSceneDirective, SentenceVisualDirective, SceneTemplate } from "../../lmstudio/index";
import type { WordTiming } from "../utils/sentenceBoundaries";
import type { Theme, Pacing, StyleConf } from "../lib/tokens";

// ─── Legacy scene renderer props (old SentenceSceneDirective) ─────────────────

export interface SceneRendererProps {
  directive:         SentenceSceneDirective;
  sentenceIndex:     number;
  wordTimings:       WordTiming[];
  globalFrameOffset: number;
  durationInFrames:  number;
  theme:             Theme;
  pacing:            Pacing;
  styleConf:         StyleConf;
  accent:            string;
  sceneIndex:        number;
  totalScenes:       number;
  /** Fallback clip path when directive.resolved_clip is absent */
  fallbackClip?:     string;
  /** Sentence text for frame-based word reveal when wordTimings are absent */
  sentenceText?:     string;
}

// ─── New scene renderer props (new SentenceVisualDirective) ───────────────────

export interface NewSceneRendererProps {
  directive:         SentenceVisualDirective;
  sentenceIndex:     number;
  wordTimings:       WordTiming[];
  globalFrameOffset: number;
  durationInFrames:  number;
  theme:             Theme;
  pacing:            Pacing;
  styleConf:         StyleConf;
  accent:            string;
  sceneIndex:        number;
  totalScenes:       number;
  fallbackClip?:     string;
  sentenceText?:     string;
}

// ─── Unified renderer props ────────────────────────────────────────────────────

/** Accepts both old and new directive types. SceneDirectiveRenderer handles routing. */
export interface UnifiedSceneRendererProps {
  directive:         SentenceSceneDirective | SentenceVisualDirective;
  sentenceIndex:     number;
  wordTimings:       WordTiming[];
  globalFrameOffset: number;
  durationInFrames:  number;
  theme:             Theme;
  pacing:            Pacing;
  styleConf:         StyleConf;
  accent:            string;
  sceneIndex:        number;
  totalScenes:       number;
  fallbackClip?:     string;
  sentenceText?:     string;
}

export type SceneRegistryKey = SceneTemplate;

/** Type guard: returns true if directive is a new SentenceVisualDirective */
export function isNewDirective(d: SentenceSceneDirective | SentenceVisualDirective): d is SentenceVisualDirective {
  return "template_data" in d && "text_treatment" in d;
}
