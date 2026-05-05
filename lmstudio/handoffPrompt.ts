export interface HandoffPromptOptions {
  topic: string;
  accentColor: string;
  sentenceCount: number;
  hasAudio: boolean;
  guidePath: string | null;
  scriptJsonPath?: string;
}

export function slugFromTopic(topic: string): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join("-");

  return slug || "generated-video";
}

export function componentNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
}

export function buildHandoffPrompt(opts: HandoffPromptOptions): string {
  const slug = slugFromTopic(opts.topic);
  const componentBase = componentNameFromSlug(slug);
  const componentName = `${componentBase}Composition`;
  const scriptPath = opts.scriptJsonPath ?? "data/output/script.json";
  const guidePath = opts.guidePath?.replace(/\\/g, "/") ?? null;
  const guideLine = guidePath
    ? `- \`${guidePath}\` - category guide; this is the design and scene-template authority.`
    : "- No guide path was provided. Infer conservatively from script metadata and generated art direction.";
  const bgDir = guidePath
    ? `${guidePath.split("/").slice(0, -1).join("/")}/bg`
    : "guides/<category>/bg";
  const audioLine = opts.hasAudio
    ? "`public/voice.mp3` and `public/timing.json` are available."
    : "Audio is not available yet; use `suggested_duration_ms` from the script.";

  return `# Composition Brief: ${opts.topic}

Build \`${componentName}\` for a 1080x1920 Remotion short.

## Identity

- Slug: \`${slug}\`
- Component: \`${componentName}\`
- Sentences: ${opts.sentenceCount}
- Accent: \`${opts.accentColor}\`
- Audio: ${audioLine}

## Read First

- \`${scriptPath}\` - sentence text, beats, durations, highlightWords, dataValue, needsImage.
- \`data/output/art_direction.md\` - per-scene visual plan. Follow it unless it conflicts with the guide or Remotion constraints.
- \`data/output/design_tokens.json\` - importable token source for code.
- \`data/output/image_manifest.json\` - resolved image assets for this run. It contains both per-sentence resolved images and per-query asset sets gathered from each \`visualQuery\`. Use sentence-specific assets first, then the shared background asset.
- \`data/output/design_block.txt\` - human-readable token reference only; do not paste it into generated files.
${guideLine}
- \`AGENTS.md\` - repository structure and composition rules.
- \`.agents/skills/remotion-best-practices/SKILL.md\` - Remotion rules; use relevant rule files when editing Remotion code.

## Implementation Contract

- Create video-specific code only under \`src/compositions/${slug}/\` and \`src/scenes/${slug}/\`.
- Add \`index.ts\` files for both folders and import the composition in \`src/Root.tsx\` only from \`./compositions/${slug}/index\`.
- Use one video-local design adapter if needed. It should read \`data/output/design_tokens.json\`; do not scatter copied constants.
- All colors, typography, spacing, line widths, and surfaces must come from DESIGN/TOKEN values.
- Treat DESIGN/TOKEN surfaces as authoritative. If the design system is light, keep the video light unless a single scene has an explicit content reason to invert.
- The design file controls brand surfaces, typography, corner radius, and accent behavior; the topic guide controls scene vocabulary and content patterns.
- Follow the provided guide's visual language. Do not impose a dark theme, documentary house style, or named creator/channel reference.
- Prefer constructed visuals: diagrams, charts, maps, ledgers, gauges, matrices, timelines, annotated objects, and flow systems.
- Use image backgrounds only when they add place or evidence. Check \`${bgDir}\` first, then \`public/bg-image.png\`.
- Prefer fetched assets in \`public/assets/${slug}/\` when \`image_manifest.json\` provides them. Respect the sentence's intended visualQuery usage: background plate, split panel, subject cutout, or annotated evidence. When a query has multiple fetched assets, choose the one that best fits the scene layout instead of reusing the background by default.
- Images must use Remotion \`<Img>\` with \`staticFile()\` and frame-driven Ken Burns motion. Do not use native \`<img>\` or CSS background images.
- All animation must be driven by \`useCurrentFrame()\`, \`interpolate()\`, and \`spring()\`. No CSS transitions, keyframes, or third-party auto-animation.
- If using \`TransitionSeries.Transition\`, account for overlap in \`calculateMetadata\` because transitions shorten total duration.
- Chart and diagram animation should be React/SVG driven from frame values. Disable any library animation.
- Keep components modular. One distinct scene layout per file unless a video-local shared renderer clearly reduces duplication.
- Do not hardcode prompt text in TypeScript; prompt text belongs in \`.txt\` files.

## Scene Mapping

- Use \`beat\`, \`dataValue\`, \`needsImage\`, and \`art_direction.md\` to choose scene layouts.
- Data scenes should show scale, comparison, threshold, or consequence, not just a large number.
- Breathe scenes may be restrained, but should still carry a precise visual idea when the guide calls for it.
- Close scenes should callback with new understanding, not simply repeat the hook.

## Validate

Run:

- \`node_modules\\\\.bin\\\\tsc.cmd --noEmit\` on Windows, or \`npx tsc --noEmit\` where npx is allowed.
- \`node_modules\\\\.bin\\\\remotion.cmd render ${componentName} out\\\\video.mp4\` on Windows, or \`npx remotion render ${componentName} out/video.mp4\`.

Before finishing, confirm the render has no blank frames, obvious text overflow, static image backgrounds, or stale audio timing.
`;
}
