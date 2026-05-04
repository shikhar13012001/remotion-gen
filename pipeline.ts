// Pipeline: input.txt → data/output/script.json → public/voice.mp3 + timing.json → out/prompt/claude.md
// Uses guides (./guides/*.md) and design system (./designs/**/*.md)
//
// Usage: npm run pipeline [--design ./designs/claude/DESIGN.md] [--guide guides/history/documentary.md]
//        npm run pipeline --skip-audio          (skip ElevenLabs TTS step)
//        npm run pipeline --voice-id <id>       (override ElevenLabs voice)
import * as fs from "fs";
import * as path from "path";
import { generateVideoSpec } from "./lmstudio/orchestrate";
import { parseFlags } from "./pipelineHelpers";
import { generateAudioStep } from "./pipelineAudio";
import { stepStart, stepDone, stepFail } from "./trace";

try { require("dotenv").config(); } catch {}

const INPUT_FILE  = path.join(__dirname, "data", "input", "input.txt");
const OUTPUT_DIR  = path.join(__dirname, "data", "output");
const PUBLIC_DIR  = path.join(__dirname, "public");
const PROMPT_FILE = path.join(__dirname, "out", "prompt", "claude.md");

async function runPipeline(): Promise<void> {
  const { designPath, guide, skipAudio, voiceId } = parseFlags();
  const pipelineStart = Date.now();

  console.log("\n╔═════════════════════════════════════════════════════╗");
  console.log("║    YT Shorts — Script Generation Pipeline           ║");
  console.log("╚═════════════════════════════════════════════════════╝");

  // ── STEP 1: Load design system + guide ──────────────────────────────────────
  let designContent: string | undefined;
  if (designPath) {
    stepStart("STEP 1  Load design system");
    if (!fs.existsSync(designPath)) {
      stepFail(`Design file not found: ${designPath}`); process.exit(1);
    }
    try { designContent = fs.readFileSync(designPath, "utf-8"); }
    catch { stepFail(`Failed to read design file: ${designPath}`); process.exit(1); }
    stepDone("STEP 1  Load design system", designPath);
  }

  let guideContent: string | undefined;
  if (guide) {
    const guideAbs = path.isAbsolute(guide) ? guide : path.resolve(__dirname, guide);
    if (fs.existsSync(guideAbs)) {
      guideContent = fs.readFileSync(guideAbs, "utf-8");
    } else {
      console.warn(`  ⚠  Guide not found (skipping): ${guide}`);
    }
  }

  // ── STEP 2: Read input brief ───────────────────────────────────────────────
  stepStart("STEP 2  Read input.txt");
  if (!fs.existsSync(INPUT_FILE)) {
    stepFail(`input.txt not found: ${INPUT_FILE}`); process.exit(1);
  }
  const rawInput = fs.readFileSync(INPUT_FILE, "utf-8").trim();
  if (!rawInput) { stepFail("input.txt is empty."); process.exit(1); }
  stepDone("STEP 2  Read input.txt", `${rawInput.split(/\s+/).length} words`);

  // ── STEP 3: Script generation ──────────────────────────────────────────────
  stepStart("STEP 3  Generate script");
  const { videoSpec, savedTo: scriptTxtPath } = await generateVideoSpec(rawInput, {
    outputDir: OUTPUT_DIR,
    guide,
    design: designPath,
  });
  const scriptJsonPath = path.join(OUTPUT_DIR, "script.json");
  stepDone("STEP 3  Script generation", `${videoSpec.sentences.length} sentences → data/output/script.json`);

  // ── STEP 4: Audio generation (ElevenLabs TTS) ─────────────────────────────
  stepStart("STEP 4  Generate audio");
  const audioResult = await generateAudioStep(
    scriptTxtPath,
    PUBLIC_DIR,
    "voice.mp3",
    "timing.json",
    { skipAudio, voiceId, sentenceTexts: videoSpec.sentences.map(s => s.text) },
  );
  if (audioResult.audioFile) {
    stepDone("STEP 4  Generate audio", `${audioResult.durationSec.toFixed(1)}s → public/voice.mp3 + timing.json`);
  } else {
    stepDone("STEP 4  Generate audio", "skipped (no API key or --skip-audio flag)");
  }

  // ── STEP 5: Save handoff prompt ────────────────────────────────────────────
  stepStart("STEP 5  Save handoff prompt");
  saveHandoffPrompt({
    promptFile:    PROMPT_FILE,
    scriptJsonPath,
    designPath:    designPath ?? null,
    designContent: designContent ?? null,
    guidePath:     guide ?? null,
    guideContent:  guideContent ?? null,
    topic:         videoSpec.topic,
    accentColor:   videoSpec.accentColor,
    sentenceCount: videoSpec.sentences.length,
    hasAudio:      !!audioResult.audioFile,
  });
  stepDone("STEP 5  Save handoff prompt", PROMPT_FILE);

  // ── COMPLETION ─────────────────────────────────────────────────────────────
  console.log(`\n✅ Pipeline complete in ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s`);
  console.log(`\n📄 Outputs:`);
  console.log(`   Script  : data/output/script.json`);
  if (audioResult.audioFile) {
    console.log(`   Audio   : public/voice.mp3`);
    console.log(`   Timing  : public/timing.json`);
  }
  console.log(`   Prompt  : out/prompt/claude.md`);
  console.log(`\n▶  Open out/prompt/claude.md and follow the instructions to build the composition.`);
}

function saveHandoffPrompt(opts: {
  promptFile:     string;
  scriptJsonPath: string;
  designPath:     string | null;
  designContent:  string | null;
  guidePath:      string | null;
  guideContent:   string | null;
  topic:          string;
  accentColor:    string;
  sentenceCount:  number;
  hasAudio:       boolean;
}): void {
  const { promptFile, scriptJsonPath, designPath, designContent, guidePath, guideContent, topic, accentColor, sentenceCount, hasAudio } = opts;

  // Derive the guide's bg/ directory so the handoff prompt can reference it.
  // e.g. guides/history/documentary.md → guides/history/bg
  const bgDir = guidePath
    ? guidePath.replace(/\\/g, "/").split("/").slice(0, -1).join("/") + "/bg"
    : null;

  const audioSection = hasAudio
    ? `Audio         : public/voice.mp3\nTiming        : public/timing.json`
    : `(No audio — run \`npm run audio:generate\` to generate separately)`;

  // Derive video slug from topic: lowercase, kebab-case, max 4 words
  const videoSlug = topic
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join("-");

  const guideBlock = guideContent
    ? `\n---\n\n## Design Guide — ${guidePath ?? "guide"}\n\n${guideContent}\n`
    : "";
  const designBlock = designContent
    ? `\n---\n\n## Design System — ${designPath ?? "design"}\n\n${designContent}\n`
    : "";

  const prompt = `# Build Remotion Composition from Generated Script

Topic         : ${topic}
Script        : ${scriptJsonPath}
Sentences     : ${sentenceCount}
Accent Color  : ${accentColor}
Video Slug    : ${videoSlug}
${designPath ? `Design System : ${designPath}\n` : ""}${guidePath ? `Design Guide  : ${guidePath}\n` : ""}${audioSection}

---

## Step 1 — Context (already loaded below)

1. Read the full script: \`${scriptJsonPath}\`
   Each sentence has: \`index\`, \`text\`, \`beat\`, \`highlightWords\`, \`dataValue\`, \`needsImage\`, \`suggested_duration_ms\`

2. Design guide${guidePath ? ` (\`${guidePath}\`)` : ""} — embedded at the bottom of this file.
   Use it for scene templates, components, backgrounds, and animation rules.

3. Design system${designPath ? ` (\`${designPath}\`)` : ""} — embedded at the bottom of this file.
   Extract colors, typography, and spacing directly from it. Do not guess or hardcode.

---

## Step 2 — File layout (mandatory)

Every video is self-contained in two folders named after the video slug.
The slug for this video is: \`${videoSlug}\`

\`\`\`
src/
├── compositions/
│   └── ${videoSlug}/
│       ├── index.ts                      ← REQUIRED: re-exports the composition
│       └── ${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition.tsx
│
└── scenes/
    └── ${videoSlug}/
        ├── index.ts                      ← REQUIRED: re-exports all scenes
        ├── HookScene.tsx                 ← beat=hook sentence
        ├── CloseScene.tsx                ← beat=close sentence
        └── BodyScene.tsx                 ← all body sentences (or split by type)
\`\`\`

**Rules:**
- Never place files directly in \`compositions/\` or \`scenes/\` roots — always in a named subfolder
- Every subfolder must have an \`index.ts\` that re-exports its public surface
- \`src/Root.tsx\` imports only from \`compositions/${videoSlug}/index\` — never from nested files
- Helpers or types used only by this video live inside the video folder, not in \`lib/\` or \`utils/\`

---

## Step 3 — Composition file structure

The main composition file wires everything together:

\`\`\`tsx
// src/compositions/${videoSlug}/${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition.tsx
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TOKEN } from "../../packages/video-renderer/src/tokens";
import { PaletteContext, buildPalette } from "../../context/PaletteContext";
import { HookScene }  from "../../scenes/${videoSlug}/HookScene";
import { BodyScene }  from "../../scenes/${videoSlug}/BodyScene";
import { CloseScene } from "../../scenes/${videoSlug}/CloseScene";
import type { Props } from "../ShortsComposition";

export const ${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition: React.FC<Props> = ({
  scenes, sentenceDurations, suggestedDurations, tokens,
}) => {
  const { fps } = useVideoConfig();
  const durations = sentenceDurations.length === scenes.length ? sentenceDurations : suggestedDurations;
  const frames = durations.map(ms => Math.round((ms / 1000) * fps));
  const accent = tokens.colors["accent"] ?? "${accentColor}";
  const palette = buildPalette(accent);

  return (
    <PaletteContext.Provider value={palette}>
      <AbsoluteFill>
        <TransitionSeries>
          {/* Hook */}
          <TransitionSeries.Sequence durationInFrames={frames[0] ?? 96}>
            <HookScene text={scenes[0]?.text ?? ""} accent={accent} durationInFrames={frames[0] ?? 96} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

          {/* Body scenes — one Sequence per sentence */}
          {scenes.slice(1, -1).map((scene, i) => (
            <React.Fragment key={i}>
              <TransitionSeries.Sequence durationInFrames={frames[i + 1] ?? 60}>
                <BodyScene
                  text={scene.text}
                  highlightWords={scene.highlightWords}
                  dataValue={scene.dataValue}
                  accent={accent}
                  durationInFrames={frames[i + 1] ?? 60}
                  sceneIndex={i}
                />
              </TransitionSeries.Sequence>
              {i < scenes.length - 3 && (
                <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
              )}
            </React.Fragment>
          ))}

          <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

          {/* Close */}
          <TransitionSeries.Sequence durationInFrames={frames[frames.length - 1] ?? 114}>
            <CloseScene text={scenes[scenes.length - 1]?.text ?? ""} accent={accent}
              durationInFrames={frames[frames.length - 1] ?? 114} />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </AbsoluteFill>
    </PaletteContext.Provider>
  );
};
\`\`\`

---

## Step 4 — Scene component pattern

Each scene file follows this contract:

\`\`\`tsx
// src/scenes/${videoSlug}/BodyScene.tsx
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TOKEN } from "../../../packages/video-renderer/src/tokens";
import { usePalette } from "../../context/PaletteContext";

interface BodySceneProps {
  text:             string;
  highlightWords:   string[];
  dataValue:        number | null;
  accent:           string;
  durationInFrames: number;
  sceneIndex:       number;
}

export const BodyScene: React.FC<BodySceneProps> = ({
  text, highlightWords, dataValue, accent, durationInFrames, sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = usePalette();

  // All animation via interpolate() or spring() — never CSS transitions or @keyframes
  const fadeIn = spring({ frame, fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 20 });

  return (
    <AbsoluteFill style={{ background: TOKEN.colors.surfaceDark }}>
      {/* Your scene layout here */}
    </AbsoluteFill>
  );
};
\`\`\`

**Mandatory rules for every scene component:**
- Use \`useCurrentFrame()\` — subtract a \`startFrame\` offset only when needed inside TransitionSeries
- Animate with \`interpolate()\` or \`spring()\` only — no CSS \`transition\`, no \`@keyframes\`
- All colors from \`TOKEN.*\` or \`usePalette()\` — never hardcode hex values
- All font sizes from \`TOKEN.typography.*\` — never hardcode pixel values
- All spacing from \`TOKEN.spacing.*\` — never hardcode spacing numbers
- Background defined per-scene — not globally

---

## Step 5 — Scene template mapping

Map each sentence to a template using this decision tree:

\`\`\`
beat = "hook"              → HookScene    (impact text, BgFlare or strong background)
beat = "close"             → CloseScene   (echo the hook, callback to opening)
dataValue != null          → StatScene    (giant number slam-in, accent color)
needsImage = true          → FullbleedScene (text over atmospheric background)
beat = "breathe"           → TextDominant (text only, centered, negative space)
beat = "turn" or "reveal"  → EditorialScene (bold statement, accent divider)
default                    → BodyScene    (narration text, word-by-word reveal)
\`\`\`

**Accent words:** render each word in \`highlightWords\` in \`accent\` color, bumped one font weight heavier.

**Word-by-word reveal pattern:**
\`\`\`tsx
{text.split(" ").map((word, i) => {
  const wordFrame = Math.max(0, frame - i * 3);  // 3-frame stagger
  const wordOp = interpolate(wordFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const wordY  = interpolate(wordFrame, [0, 8], [12, 0], { extrapolateRight: "clamp" });
  const isAccent = highlightWords.some(w => w.toLowerCase() === word.toLowerCase().replace(/[^a-z0-9]/g, ""));
  return (
    <span key={i} style={{
      opacity: wordOp,
      transform: \`translateY(\${wordY}px)\`,
      display: "inline-block",
      marginRight: "0.25em",
      color: isAccent ? accent : TOKEN.colors.onDark,
      fontWeight: isAccent ? 700 : 400,
    }}>
      {word}
    </span>
  );
})}
\`\`\`

---

## Step 6 — Design freedom (backgrounds + visual style)

**You are free to design the backgrounds.** Do not copy existing backgrounds rigidly.
Choose based on the topic tone: \`${topic}\`
Accent: \`${accentColor}\`

**Token values to build backgrounds with:**
\`\`\`
TOKEN.colors.surfaceDark          // near-black base
TOKEN.colors.surfaceDarkElevated  // slightly lifted surface
TOKEN.colors.surfaceDarkSoft      // warm dark
TOKEN.colors.canvas               // off-white (use for light/inverted scenes)
TOKEN.colors.accentTeal           // teal accent (secondary highlight)
TOKEN.colors.accentAmber          // amber accent (warm emphasis)
\`\`\`

**Per-scene background ideas:**
- hook / close → geometric radial, strong vignette, accent glow
- stat / data → tight grid, clinical, colder tone
- narrative → drifting blobs, film grain, editorial feel
- breathe / transition → near-black with subtle texture, maximum negative space

**Grid pattern (CSS, inline):**
\`\`\`tsx
backgroundImage: \`linear-gradient(\${TOKEN.colors.muted}18 1px, transparent 1px),
                  linear-gradient(90deg, \${TOKEN.colors.muted}18 1px, transparent 1px)\`,
backgroundSize: "48px 48px",
\`\`\`

**Background image priority — check this before coding any background:**
${bgDir ? `- **Priority 1 — Guide bg** \`${bgDir}/*.png\`` : "- **Priority 1 — Guide bg** \`guides/<category>/bg/*.png\`"} — if an image exists, copy to \`public/bg-image.png\` and use \`staticFile()\`
- **Priority 2 — Repo fallback** \`public/bg-image.png\` — always present, use directly
- **Priority 3 — Programmatic** BgDeepField / BgFlare / BgSignal — only when no image available

When using a static image, always apply Ken Burns — never render it motionless:
\`\`\`tsx
import { Img, staticFile, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
const { durationInFrames } = useVideoConfig();
const frame = useCurrentFrame();
const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], { extrapolateRight: "clamp" });
// render:
<Img src={staticFile("bg-image.png")} style={{
  position: "absolute", inset: 0, width: "100%", height: "100%",
  objectFit: "cover", filter: "saturate(0.65) brightness(0.45)",
  transform: \`scale(\${imgScale})\`,
}} />
<div style={{ position: "absolute", inset: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)" }} />
\`\`\`

---

## Step 7 — index.ts files (required)

\`\`\`ts
// src/compositions/${videoSlug}/index.ts
export { ${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition } from "./${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition";

// src/scenes/${videoSlug}/index.ts
export { HookScene }  from "./HookScene";
export { BodyScene }  from "./BodyScene";
export { CloseScene } from "./CloseScene";
\`\`\`

---

## Step 8 — Register in src/Root.tsx

Add to the existing \`Root.tsx\`:

\`\`\`tsx
import { ${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition } from "./compositions/${videoSlug}/index";

// Inside <Root>:
<Composition
  id="${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition"
  component={${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition}
  fps={30}
  width={1080}
  height={1920}
  durationInFrames={900}
  calculateMetadata={calculateMetadata}
  defaultProps={scriptToProps(script)}
/>
\`\`\`

Import the script JSON at the top:
\`\`\`tsx
import script from "../data/output/script.json";
\`\`\`

---

## Step 9 — Validate before rendering

Run after writing all files:
\`\`\`bash
npx tsc --noEmit
\`\`\`
Must pass with zero errors. Fix any type errors before rendering.

Then render:
\`\`\`bash
npx remotion render ${videoSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("")}Composition out/video.mp4
\`\`\`
${guideBlock}${designBlock}`;

  fs.mkdirSync(path.dirname(promptFile), { recursive: true });
  fs.writeFileSync(promptFile, prompt, "utf-8");

  console.log(`\n✅ Handoff prompt saved: ${promptFile}`);
}

runPipeline().catch((err) => {
  stepFail(`Pipeline failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
