/**
 * artDirector.ts
 *
 * Runs the art-direction LLM step.
 * The output is a per-scene brief focused on original visual systems:
 * diagrams, charts, maps, ledgers, meters, timelines, and annotated objects.
 */

import * as fs from "fs";
import * as path from "path";
import { callLMStudioText } from "./caller";
import type { VideoSpec } from "./types";

export interface ArtDirectorOptions {
  /** Raw content of the guide file. */
  guide?: string;
  /** The generated const DESIGN = {...} block. */
  designBlock?: string;
  temperature?: number;
  maxTokens?: number;
}

function loadSystemPrompt(): string {
  const promptPath = path.join(__dirname, "prompts", "prompt_art_director.txt");
  if (fs.existsSync(promptPath)) {
    return fs.readFileSync(promptPath, "utf-8").trim();
  }

  return [
    "You are an art director for short-form explanatory video.",
    "For each script sentence, produce a per-scene visual direction brief.",
    "OUTPUT FORMAT: MARKDOWN ONLY. NOT JSON. Write plain text markdown sections with --- dividers.",
    "Do NOT output JSON, arrays, curly braces, or structured formats.",
    "Prefer diagrams, charts, flows, ledgers, matrices, gauges, maps, and annotated systems over plain text on generic backgrounds.",
    "Do not imitate named creators or channels. Do not assume a dark theme.",
    "Use only DESIGN.* values for colors, fonts, spacing, and sizes.",
  ].join("\n");
}

function buildUserMessage(script: VideoSpec, opts: ArtDirectorOptions): string {
  const lines: string[] = [];

  if (opts.designBlock) {
    lines.push("## Design Constants");
    lines.push("Use DESIGN.* for all colors, fonts, spacing, sizes, line weights, and shadows.");
    lines.push(opts.designBlock);
    lines.push("");
  }

  if (opts.guide) {
    lines.push("## Visual Guide");
    lines.push(opts.guide.slice(0, 5000));
    lines.push("");
  }

  lines.push("## Script");
  lines.push(`Topic: ${script.topic}`);
  lines.push(`Accent color: ${script.accentColor}`);
  lines.push(`Total sentences: ${script.sentences.length}`);
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(
    script.sentences.map((s) => ({
      index: s.index,
      beat: s.beat,
      text: s.text,
      highlightWords: s.highlightWords,
      dataValue: s.dataValue,
      needsImage: s.needsImage,
      visualQuery: s.visualQuery,
      duration_s: (s.suggested_duration_ms / 1000).toFixed(1),
    })),
    null,
    2,
  ));
  lines.push("```");
  lines.push("");
  lines.push("Now write the per-scene art direction brief for all scenes above.");
  lines.push("At least half the scenes should use constructed visuals: diagrams, charts, maps, ledgers, meters, timelines, matrices, annotated objects, or flow systems.");
  lines.push("Photo scenes are allowed only when they add evidence or place; add an information-bearing overlay.");
  lines.push("Do not reference or imitate named YouTube channels, documentary creators, or a default dark cinematic style.");

  return lines.join("\n");
}

export async function runArtDirector(
  script: VideoSpec,
  opts: ArtDirectorOptions = {},
): Promise<string | null> {
  const systemPrompt = loadSystemPrompt();
  const userMessage = buildUserMessage(script, opts);

  try {
    let result = await callLMStudioText(systemPrompt, userMessage, {
      temperature: opts.temperature ?? 0.65,
      maxTokens: opts.maxTokens ?? 12000,
    });

    if (!result || result.trim().length < 200) {
      console.warn("  Art director: LLM returned an unexpectedly short response; using fallback brief");
      return null;
    }

    // Check if the LLM returned JSON despite being asked for markdown
    const trimmed = result.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      console.warn("  ⚠️  Art director returned JSON instead of markdown. LM Studio may have JSON mode enabled globally.");
      console.warn("  ⚠️  Disable JSON mode in LM Studio settings or convert the response to markdown.");
      return null;
    }

    return result.trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  Art director call failed (${msg}); using fallback brief`);
    return null;
  }
}

export function generateFallbackBrief(script: VideoSpec, _accentColor: string): string {
  const lines: string[] = [
    "## Art Direction Brief",
    "",
    "> Generated without the art-direction LLM.",
    "> Prefer original diagrams, charts, ledgers, maps, meters, timelines, and annotated systems.",
    "> Do not assume a dark theme and do not imitate any named creator or channel.",
    "",
  ];

  for (const sentence of script.sentences) {
    const durationS = (sentence.suggested_duration_ms / 1000).toFixed(1);
    const highlights = sentence.highlightWords.length > 0
      ? sentence.highlightWords.join(", ")
      : "none";
    const direction = fallbackDirection(sentence);

    lines.push("---");
    lines.push(`### Scene ${sentence.index} - "${preview(sentence.text)}"`);
    lines.push(`**Beat:** ${sentence.beat} | **Duration:** ~${durationS}s | **Highlight words:** ${highlights}`);
    lines.push("");
    lines.push(`**Visual concept:**\n${direction.concept}`);
    lines.push("");
    lines.push(`**Entry animation:**\n${direction.entry}`);
    lines.push("");
    lines.push(`**Background:**\n${direction.background}`);
    lines.push("");
    lines.push("**Why this is different from the previous scene:**");
    lines.push("Use a different spatial structure, density, or mechanism than the preceding scene.");
    lines.push("");
  }

  return lines.join("\n");
}

function preview(text: string): string {
  return `${text.slice(0, 50)}${text.length > 50 ? "..." : ""}`;
}

function fallbackDirection(sentence: VideoSpec["sentences"][number]): {
  concept: string;
  entry: string;
  background: string;
} {
  if (sentence.beat === "hook") {
    return {
      concept: "Make one visual claim immediately: a large number, object, contradiction, map point, or machine part is visible before the sentence completes. Text supports the visual system rather than replacing it.",
      entry: "Primary visual element appears on frame 0. Supporting labels draw or snap in over 10-16 frames. Highlight words use DESIGN.accent and a heavier weight.",
      background: "Use DESIGN.bg or DESIGN.surface as a designed canvas with one meaningful structure: axis, ledger line, map grid, meter, or object outline.",
    };
  }

  if (sentence.beat === "breathe") {
    return {
      concept: "Use restraint, but include one precise visual object when useful: a threshold line, held meter, single ledger entry, or isolated map marker.",
      entry: "Single controlled reveal over 12-18 frames. No decorative motion.",
      background: "A clean DESIGN.bg or DESIGN.surface canvas. Avoid empty darkness as a default.",
    };
  }

  if (sentence.beat === "close") {
    return {
      concept: "Return to the opening idea with new annotation: a completed system, explained machine, final diagnostic panel, or callback object with labels the viewer now understands.",
      entry: "The callback visual appears first; final labels arrive slowly with a 4-frame stagger.",
      background: "Use the same design family as the hook, but add one earned layer of explanation.",
    };
  }

  if (sentence.dataValue !== null) {
    return {
      concept: `The number "${sentence.dataValue}" owns the frame, but it must be explained with scale: comparison bar, gauge, threshold, axis, ledger amount, map label, or meter. Supporting text is secondary.`,
      entry: "The scale visual draws first. The number lands after the viewer sees what it is measured against.",
      background: "Designed data surface using DESIGN.bg or DESIGN.surface, with DESIGN.border/grid lines only when they clarify scale.",
    };
  }

  if (sentence.beat === "reveal") {
    return {
      concept: "Expose the mechanism: split the frame, connect causes with arrows, compress a block, flip a label, or show the hidden relationship.",
      entry: "System parts enter in causal order, then the reveal label arrives in DESIGN.accent.",
      background: "Diagram field or annotated surface. Avoid pure text unless the sentence is extremely short.",
    };
  }

  if (sentence.needsImage) {
    return {
      concept: `Use a sourced image only if it adds place or evidence. Query: "${sentence.visualQuery ?? sentence.text.slice(0, 40)}". Specify the crop and build labels, routes, panels, or annotations so the image becomes explanatory.`,
      entry: "Image uses Ken Burns. Foreground lines, labels, or panels animate in causal order.",
      background: "Photo with a legibility treatment from DESIGN values. The overlay must carry information, not mood.",
    };
  }

  return {
    concept: "Build a simple visual structure behind or beside the sentence: two-column comparison, object stack, timeline tick, process row, or labeled panel. Accent words render in DESIGN.accent.",
    entry: "Structure draws first, then words reveal with a 3-frame stagger.",
    background: "Designed surface using DESIGN.bg or DESIGN.surface. No generic mood gradient.",
  };
}
