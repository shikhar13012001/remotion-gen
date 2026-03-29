// ─── Constants for the lmstudio pipeline ──────────────────────────────────────

export const ANIMATION_TYPES = [
  "counter",
  "line_chart",
  "bar_chart",
  "comparison_bars",
  "percentage_fill",
  "map_spread",
  "world_highlight",
  "timeline",
  "flow_diagram",
  "svg_draw_path",
  "icon_arrangement",
  "shape_metaphor",
] as const;

export const ACCENT_PALETTE = {
  history:     "#c8a96e",
  finance:     "#f0c040",
  science:     "#4fc3f7",
  crime:       "#ef5350",
  health:      "#66bb6a",
  space:       "#ce93d8",
  geopolitics: "#90a4ae",
  philosophy:  "#bcaaa4",
} as const;

export type AccentKey = keyof typeof ACCENT_PALETTE;

// Prepended to every LM Studio system prompt to prevent HTML, markdown, and
// Wikipedia-style artefacts from contaminating script output.
export const TEXT_CLEAN_PREFIX = `You generate clean, plain spoken-word text only.
STRICT RULES — violations cause rejection:
  • No HTML tags of any kind (<p>, <a>, <span>, <em>, <strong>, etc.)
  • No markdown (no **, no __, no ##, no backticks, no bullet lists)
  • No Wikipedia citation markup ([1], [citation needed], etc.)
  • No URLs, no href, no wiki-style links
  • No JSON escaping artefacts in text fields (no \\n, no \\")
  • Write as if speaking directly to a camera — short, declarative sentences
  • Numbers as digits where impactful (30,000 dead), as words otherwise (three days)
`;
