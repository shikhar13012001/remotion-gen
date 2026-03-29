export type SceneTemplate =
  | "subject_cutout"
  | "editorial_headline"
  | "split_photo_data"
  | "timeline"
  | "stat_callout"
  | "text_dominant"
  | "flow_diagram"
  | "transition_wipe";

export interface SentenceVisualDirective {
  sentence:       string;
  duration_ms:    number;
  scene_template: SceneTemplate;
  text_treatment: {
    accent_words: string[];
    animation:    "word_by_word" | "line_reveal" | "slam_in";
  };
  template_data:  TemplateData;
  transition_out: "hard_cut" | "crossfade";
}

export type TemplateData =
  | SubjectCutoutData
  | EditorialHeadlineData
  | SplitPhotoData
  | TimelineData
  | StatCalloutData
  | TextDominantData
  | FlowDiagramData
  | TransitionWipeData;

export interface SubjectCutoutData {
  type:        "subject_cutout";
  stamp_label: string;
  headline:    string;
  annotations: Array<{ text: string; side: "left" | "right" }>;
  image_query: string;
}

export interface EditorialHeadlineData {
  type:           "editorial_headline";
  stamp_label:    string;
  line1:          string;
  line2:          string;
  highlight_line: string;
  subtext:        string;
}

export interface SplitPhotoData {
  type:        "split_photo_data";
  stamp_label: string;
  headline:    string;
  facts:       string[];
  image_query: string;
}

export interface TimelineData {
  type:        "timeline";
  headline:    string;
  stamp_label: string;
  items:       Array<{ time: string; event: string; detail: string }>;
}

export interface StatCalloutData {
  type:        "stat_callout";
  stamp_label: string;
  value:       number;
  prefix:      string;
  suffix:      string;
  label:       string;
  context:     string;
}

export interface TextDominantData {
  type:  "text_dominant";
  lines: string[];
}

export interface FlowDiagramData {
  type:        "flow_diagram";
  stamp_label: string;
  headline:    string;
  nodes:       string[];
}

export interface TransitionWipeData {
  type:  "transition_wipe";
  label: string;
}
