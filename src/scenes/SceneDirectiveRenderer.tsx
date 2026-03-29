import React from "react";
import type { ComponentType } from "react";
import type { SceneRegistryKey, SceneRendererProps, UnifiedSceneRendererProps } from "./sceneRegistry";
import { isNewDirective } from "./sceneRegistry";
import { FullbleedScene }       from "./FullbleedScene";
import { TextDominantScene }    from "./TextDominantScene";
import { StatCalloutScene }     from "./StatCalloutScene";
import { AnimatedGraphicScene } from "./AnimatedGraphicScene";
import { EditorialHeadlineScene } from "./EditorialHeadlineScene";
import { SubjectCutoutScene }     from "./SubjectCutoutScene";
import { TransitionWipeScene }    from "./TransitionWipeScene";
import { SplitPhotoDataScene }    from "./SplitPhotoDataScene";
import { TimelineScene }          from "./TimelineScene";
import { FlowDiagramScene }       from "./FlowDiagramScene";
import { autoDetectTemplate }   from "../lib/compositionUtils";
import type { SentenceVisualDirective, TemplateData } from "../../lmstudio/index";

// ─── Legacy registry (old SentenceSceneDirective) ─────────────────────────────

const LEGACY_REGISTRY: Record<string, ComponentType<SceneRendererProps>> = {
  fullbleed:        FullbleedScene,
  text_dominant:    TextDominantScene,
  stat_callout:     StatCalloutScene,
  animated_graphic: AnimatedGraphicScene,
};

// ─── Type helpers ──────────────────────────────────────────────────────────────

function getTemplateData<T extends TemplateData["type"]>(
  d: SentenceVisualDirective,
  type: T
): Extract<TemplateData, { type: T }> | null {
  if (d.template_data.type === type) {
    return d.template_data as Extract<TemplateData, { type: T }>;
  }
  return null;
}

// ─── New directive router ──────────────────────────────────────────────────────

function renderNewDirective(props: UnifiedSceneRendererProps, d: SentenceVisualDirective): React.ReactElement {
  const {
    sentenceIndex, wordTimings, globalFrameOffset,
    durationInFrames, pacing, styleConf, accent, fallbackClip,
  } = props;
  const accentWords = d.text_treatment.accent_words;

  switch (d.scene_template) {
    case "editorial_headline": {
      const td = getTemplateData(d, "editorial_headline");
      if (!td) break;
      return (
        <EditorialHeadlineScene
          line1={td.line1} line2={td.line2} highlight_line={td.highlight_line}
          subtext={td.subtext} stamp_label={td.stamp_label}
          accent={accent} wordTimings={wordTimings} sentenceIndex={sentenceIndex}
          globalFrameOffset={globalFrameOffset} durationInFrames={durationInFrames}
          accentWords={accentWords} pacing={pacing} styleConf={styleConf}
        />
      );
    }

    case "subject_cutout": {
      const td = getTemplateData(d, "subject_cutout");
      if (!td) break;
      return (
        <SubjectCutoutScene
          image_query={td.image_query} annotation={td.annotation}
          accent={accent} wordTimings={wordTimings} sentenceIndex={sentenceIndex}
          globalFrameOffset={globalFrameOffset} durationInFrames={durationInFrames}
          accentWords={accentWords} pacing={pacing} styleConf={styleConf}
          resolvedClip={fallbackClip}
        />
      );
    }

    case "split_photo_data": {
      const td = getTemplateData(d, "split_photo_data");
      if (!td) break;
      return (
        <SplitPhotoDataScene
          image_query={td.image_query} headline={td.headline} facts={td.facts}
          accent={accent} wordTimings={wordTimings} sentenceIndex={sentenceIndex}
          globalFrameOffset={globalFrameOffset} durationInFrames={durationInFrames}
          accentWords={accentWords} pacing={pacing} styleConf={styleConf}
          resolvedClip={fallbackClip}
        />
      );
    }

    case "transition_wipe": {
      const td = getTemplateData(d, "transition_wipe");
      if (!td) break;
      return (
        <TransitionWipeScene
          label={td.label} accent={accent}
          durationInFrames={durationInFrames} pacing={pacing}
        />
      );
    }

    case "timeline": {
      const td = getTemplateData(d, "timeline");
      if (!td) break;
      return (
        <TimelineScene
          events={td.events} accent={accent}
          wordTimings={wordTimings} sentenceIndex={sentenceIndex}
          globalFrameOffset={globalFrameOffset} durationInFrames={durationInFrames}
          accentWords={accentWords} pacing={pacing} styleConf={styleConf}
        />
      );
    }

    case "flow_diagram": {
      const td = getTemplateData(d, "flow_diagram");
      if (!td) break;
      return (
        <FlowDiagramScene
          nodes={td.nodes} style={td.style} accent={accent}
          wordTimings={wordTimings} sentenceIndex={sentenceIndex}
          globalFrameOffset={globalFrameOffset} durationInFrames={durationInFrames}
          accentWords={accentWords} pacing={pacing} styleConf={styleConf}
        />
      );
    }

    // For legacy templates (fullbleed, text_dominant, stat_callout, animated_graphic),
    // convert new directive → old directive shape for existing scene components
    case "fullbleed":
    case "text_dominant":
    case "stat_callout":
    case "animated_graphic": {
      const legacyDirective = convertToLegacy(d);
      const SceneComponent = LEGACY_REGISTRY[d.scene_template];
      if (SceneComponent) {
        return (
          <SceneComponent
            {...props}
            directive={legacyDirective}
            sentenceText={d.sentence}
          />
        );
      }
      break;
    }
  }

  // Fallback: text_dominant
  const legacyFallback = convertToLegacy(d);
  return <TextDominantScene {...props} directive={legacyFallback} sentenceText={d.sentence} />;
}

/** Convert a new SentenceVisualDirective to the legacy SentenceSceneDirective shape. */
function convertToLegacy(d: SentenceVisualDirective) {
  const td = d.template_data;
  const imageMotion = td.type === "fullbleed"
    ? (td.image_motion ?? "slow_zoom_in")
    : null;
  const visualQuery = (td.type === "fullbleed" || td.type === "subject_cutout" || td.type === "split_photo_data")
    ? td.image_query
    : null;
  const animationSpec = td.type === "animated_graphic"
    ? { type: td.animation_type, data: td.animation_data, entry_animation: td.entry_animation as "build_in" | "slam" | "draw", duration_ms: d.duration_ms }
    : td.type === "stat_callout"
      ? { type: "counter", data: { value: td.value, prefix: td.prefix ?? "", suffix: td.suffix ?? "" }, entry_animation: "slam" as const, duration_ms: d.duration_ms }
      : null;

  return {
    scene_template:  d.scene_template as "fullbleed" | "text_dominant" | "stat_callout" | "animated_graphic",
    image_motion:    imageMotion as "slow_zoom_in" | "slow_zoom_out" | "pan_left" | "pan_right" | "static" | null,
    highlight_words: d.text_treatment.accent_words,
    visual_query:    visualQuery,
    animation_spec:  animationSpec,
    resolved_clip:   undefined as string | undefined,
  };
}

// ─── Main renderer ─────────────────────────────────────────────────────────────

export const SceneDirectiveRenderer: React.FC<UnifiedSceneRendererProps> = (props) => {
  const { directive, wordTimings, sentenceIndex } = props;

  // New directive path
  if (isNewDirective(directive)) {
    return renderNewDirective(props, directive);
  }

  // Legacy directive path
  const legacyDirective = directive;
  const key = legacyDirective.scene_template as SceneRegistryKey;
  const SceneComponent = LEGACY_REGISTRY[key];

  if (SceneComponent) {
    return <SceneComponent {...props} directive={legacyDirective} />;
  }

  // Auto-detect fallback
  const words = wordTimings
    .filter(w => w.sentenceIndex === sentenceIndex)
    .map(w => w.word);
  const detected = autoDetectTemplate(words) as string;
  const Fallback = LEGACY_REGISTRY[detected] ?? TextDominantScene;
  return <Fallback {...props} directive={legacyDirective} />;
};
