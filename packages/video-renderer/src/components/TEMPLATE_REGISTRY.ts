import type { SceneTemplate } from "@yt-shorts/core";
import type { ComponentType } from "react";
import { TplSubjectCutout }    from "./templates/TplSubjectCutout";
import { TplEditorialHeadline } from "./templates/TplEditorialHeadline";
import { TplSplitPhotoData }   from "./templates/TplSplitPhotoData";
import { TplTimeline }         from "./templates/TplTimeline";
import { TplStatCallout }      from "./templates/TplStatCallout";
import { TplTextDominant }     from "./templates/TplTextDominant";
import { TplFlowDiagram }      from "./templates/TplFlowDiagram";
import { TplTransitionWipe }   from "./templates/TplTransitionWipe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TEMPLATE_REGISTRY: Record<SceneTemplate, ComponentType<any>> = {
  subject_cutout:     TplSubjectCutout,
  editorial_headline: TplEditorialHeadline,
  split_photo_data:   TplSplitPhotoData,
  timeline:           TplTimeline,
  stat_callout:       TplStatCallout,
  text_dominant:      TplTextDominant,
  flow_diagram:       TplFlowDiagram,
  transition_wipe:    TplTransitionWipe,
};
