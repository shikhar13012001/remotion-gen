export { analyzeAndStructure, generateVideoSpec, videoSpecToMetadata } from "./orchestrate.js";
export { runCall1b } from "./call1b.js";
export { TokenMapSchema } from "./types.js";
export type {
  // New canonical types
  TokenMap,
  Beat,
  ScriptSentence,
  ScriptPackage,
  // Call 1b
  VisualAct,
  KeyMoment,
  TemplateBudget,
  VisualBrief,
  // Call 2
  SceneTemplate,
  TemplateData,
  SentenceVisualDirective,
  VideoSpec,
  // Legacy types (backward compat)
  ImageMotion,
  AnimationSpec,
  SentenceSceneDirective,
  ContentMetadata,
  AnimationType,
  SceneIntent,
  ScriptOutput,
} from "./types.js";
export { ANIMATION_TYPES, ACCENT_PALETTE } from "./constants.js";
