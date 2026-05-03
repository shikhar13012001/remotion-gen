/**
 * compose.ts — Claude Code as compositor
 *
 * Reads:
 *   data/output/script.json   (ScriptPackage from Call 1)
 *   --guide <path>            creative brief for this category
 *
 * Calls the configured model endpoint with guide + script → generates
 * src/compositions/GeneratedComposition.tsx
 *
 * Usage:
 *   npm run compose -- --guide guides/history/documentary.md
 *
 * Env vars (same as the rest of the pipeline):
 *   LM_STUDIO_URL    — base URL of any OpenAI-compat endpoint (default: http://localhost:1234/v1)
 *   LM_STUDIO_MODEL  — model name to use (default: local-model)
 *   OPENAI_API_KEY   — API key (default: "lm-studio" for local servers that don't need one)
 */

import * as fs from "fs";
import * as path from "path";
import { callLMStudioText } from "../lmstudio/caller.js";
import type { LMCallOptions } from "../lmstudio/types.js";

try { require("dotenv").config(); } catch {}

const SCRIPT_PATH = path.join(__dirname, "..", "data", "output", "script.json");
const OUT_PATH    = path.join(__dirname, "..", "src", "compositions", "GeneratedComposition.tsx");

// ── Parse --guide flag ───────────────────────────────────────────────────────

function parseGuideArg(): string {
  const args = process.argv.slice(2);
  const idx  = args.indexOf("--guide");
  if (idx === -1 || !args[idx + 1]) {
    console.error("Usage: npm run compose -- --guide guides/history/documentary.md");
    process.exit(1);
  }
  return args[idx + 1];
}

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(guide: string): string {
  return `${guide}

---

## Your task

You are generating a complete Remotion composition TypeScript file for a YouTube Shorts video (1080×1920, 30fps).

You will receive a ScriptPackage JSON object with:
- \`topic\`: the video topic
- \`accentColor\`: the hex accent color for the video (use this everywhere TOKEN.gold would be used in single-video context)
- \`sentences[]\`: array of { index, text, beat, word_count, suggested_duration_ms, visualQuery, needsImage, highlightWords, dataValue }

Beats: "hook" (first), "build", "turn", "reveal", "breathe", "close" (last)

## Output requirements

Output a SINGLE valid .tsx file. No markdown fences. No explanation. No comments other than what aids understanding. Just the file.

The file must:
1. Be named GeneratedComposition and export it as both named and default export
2. Accept \`{ script: ScriptPackage }\` as props (import ScriptPackage type from "../../lmstudio/index.js")
3. Use \`useCurrentFrame()\` from "remotion" for all animation
4. Import scene components ONLY from "@yt-shorts/video-renderer"
5. Compute scene offsets from \`sentence.suggested_duration_ms / (1000/30)\` rounded to integer frames
6. Wrap each scene in \`<Sequence from={offset} durationInFrames={dur}>\` from "remotion"
7. Use TOKEN.bgVoid as the root background color
8. Apply the guide's template selection rules — hook/close → TplEditorialHeadline, numbers/stats → TplStatCallout, sequences → TplTimeline, process → TplFlowDiagram, impact/transition → TplTextDominant
9. Use KineticText for narration sentences where a template doesn't apply
10. Pass \`frame={frame}\` and \`startFrame={offset}\` to every component
11. Use \`sentence.highlightWords\` for accent word highlighting, \`sentence.dataValue\` for stat templates

## Scene routing by beat

- "hook"    → TplEditorialHeadline with BgFlare, line1 from sentence text
- "close"   → TplEditorialHeadline with BgDeepField
- "breathe" → TplTextDominant (single line, clean)
- "turn"    → TplEditorialHeadline or TplStatCallout if text has a number
- "reveal"  → TplStatCallout if dataValue is non-null, else TplTimeline or TplFlowDiagram if structure, else TplEditorialHeadline
- "build"   → TplSplitPhotoData, TplSubjectCutout, or TplTextDominant — vary these

## Distribution — enforce these minimums

- At least 2 TplEditorialHeadline (hook + at least one more)
- At least 1 TplStatCallout (if any sentence has a dataValue)
- At least 1 TplTextDominant (breathing room)
- No more than 3 consecutive scenes with the same template type

## accentColor usage

The script provides accentColor. Pass it through to any component that accepts a color override, or note it in a const at the top of the file. The templates use TOKEN.gold by default — the accentColor replaces gold when they differ.`;
}

// ── User message ─────────────────────────────────────────────────────────────

function buildUserMessage(scriptJson: string): string {
  return `Here is the ScriptPackage. Generate the composition now.\n\n${scriptJson}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const guidePath = parseGuideArg();

  if (!fs.existsSync(guidePath)) {
    console.error(`Guide not found: ${guidePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(SCRIPT_PATH)) {
    console.error(`Script not found at ${SCRIPT_PATH}`);
    console.error("Run: npm run pipeline -- --skip-audio first");
    process.exit(1);
  }

  const guide      = fs.readFileSync(guidePath, "utf-8");
  const scriptJson = fs.readFileSync(SCRIPT_PATH, "utf-8");

  const baseUrl = process.env.LM_STUDIO_URL   ?? "http://localhost:1234/v1";
  const mdlName = process.env.LM_STUDIO_MODEL ?? "local-model";

  console.log(`\nComposing with guide: ${guidePath}`);
  console.log(`Script:   ${SCRIPT_PATH}`);
  console.log(`Endpoint: ${baseUrl}  model: ${mdlName}`);
  console.log("Calling model...\n");

  const opts: LMCallOptions = { model: mdlName, temperature: 0.4, maxTokens: 8192 };

  const raw = await callLMStudioText(
    buildSystemPrompt(guide),
    buildUserMessage(scriptJson),
    opts,
  );

  // Strip markdown fences if the model added them despite instructions
  const tsx = raw
    .replace(/^```tsx?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, tsx + "\n", "utf-8");

  console.log(`\nGenerated: ${OUT_PATH}`);
  console.log(`Lines: ${tsx.split("\n").length}`);
  console.log("\nNext: npx tsc --noEmit  then  npm run pipeline -- --skip-audio --skip-stitch");
}

main().catch(err => {
  console.error("compose failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
