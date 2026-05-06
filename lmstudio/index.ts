export { generateVideoSpec } from "./orchestrate.js";
export { TokenMapSchema } from "./types.js";
export type {
  // Canonical types
  TokenMap,
  Beat,
  ScriptSentence,
  ScriptPackage,
  ScriptContextBundle,
  ScriptPlan,
  ScriptSpec,
  ValidationReport,
  ValidatedScriptResult,
  ScriptGenerationTrace,
  ScriptLLMProvider,
  // Scene/directive types
  SceneTemplate,
  TemplateData,
  SentenceVisualDirective,
  VideoSpec,
  // Animation types
  AnimationType,
  AnimationSpec,
  // Legacy types (kept for backward-compat consumers in src/)
  ImageMotion,
  SentenceSceneDirective,
  ContentMetadata,
} from "./types.js";
export { ANIMATION_TYPES, ACCENT_PALETTE } from "./constants.js";
