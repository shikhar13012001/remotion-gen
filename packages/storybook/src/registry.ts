import type { ReactElement } from "react";
import { GridStories }              from "./stories/story.Grid";
import { VignetteStories }          from "./stories/story.Vignette";
import { StampStories }             from "./stories/story.Stamp";
import { GoldDividerStories }       from "./stories/story.GoldDivider";
import { KineticTextStories }       from "./stories/story.KineticText";
import { AnnotationStories }        from "./stories/story.Annotation";
import { TimelineItemStories }      from "./stories/story.TimelineItem";
import { FlowNodeStories }          from "./stories/story.FlowNode";
import { BgDeepFieldStories }       from "./stories/story.BgDeepField";
import { BgSignalStories }          from "./stories/story.BgSignal";
import { BgFlareStories }           from "./stories/story.BgFlare";
import { TplSubjectCutoutStories }    from "./stories/story.TplSubjectCutout";
import { TplEditorialHeadlineStories } from "./stories/story.TplEditorialHeadline";
import { TplTimelineStories }         from "./stories/story.TplTimeline";
import { TplStatCalloutStories }      from "./stories/story.TplStatCallout";
import { TplTextDominantStories }     from "./stories/story.TplTextDominant";
import { TplFlowDiagramStories }      from "./stories/story.TplFlowDiagram";
import { TplSplitPhotoDataStories }   from "./stories/story.TplSplitPhotoData";
import { TplTransitionWipeStories }   from "./stories/story.TplTransitionWipe";

export interface Story {
  id:        string;
  label:     string;
  group:     string;
  component: string;
  duration:  number;
  variants:  string[];
  render:    (variant: string, frame: number) => ReactElement;
}

export const ALL_STORIES: Story[] = [
  ...GridStories,
  ...VignetteStories,
  ...StampStories,
  ...GoldDividerStories,
  ...KineticTextStories,
  ...AnnotationStories,
  ...TimelineItemStories,
  ...FlowNodeStories,
  ...BgDeepFieldStories,
  ...BgSignalStories,
  ...BgFlareStories,
  ...TplSubjectCutoutStories,
  ...TplEditorialHeadlineStories,
  ...TplTimelineStories,
  ...TplStatCalloutStories,
  ...TplTextDominantStories,
  ...TplFlowDiagramStories,
  ...TplSplitPhotoDataStories,
  ...TplTransitionWipeStories,
];

export const GROUPS = Array.from(new Set(ALL_STORIES.map(s => s.group)));
