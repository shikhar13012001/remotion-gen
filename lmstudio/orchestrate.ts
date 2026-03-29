import * as fs from "fs";
import * as path from "path";
import { runCall1 } from "./call1.js";
import { runCall1b } from "./call1b.js";
import { runCall2, runDistributionRepair } from "./call2.js";
import { logDistribution } from "./validate.js";
import { logVideoSpecSummary } from "../trace.js";
import type { VideoSpec, ContentMetadata, ScriptPackage, SentenceVisualDirective, VisualBrief } from "./types.js";

function timer(): () => string {
  const t = Date.now();
  return () => `${((Date.now() - t) / 1000).toFixed(1)}s`;
}

/** Convert new VideoSpec to legacy ContentMetadata for backward-compat consumers. */
export function videoSpecToMetadata(spec: VideoSpec): ContentMetadata {
  const sentences = spec.sentences;
  const hookSentence  = sentences.find(s => s.beat === "hook")  ?? sentences[0];
  const closeSentence = sentences.find(s => s.beat === "close") ?? sentences[sentences.length - 1];
  const body = sentences
    .filter(s => s !== hookSentence && s !== closeSentence)
    .map(s => s.text);

  // Map new SentenceVisualDirective → old SentenceSceneDirective for body sentences
  const bodyIndices = sentences
    .filter(s => s !== hookSentence && s !== closeSentence)
    .map(s => s.index - 1);

  const sceneDirectives = bodyIndices.map(i => {
    const d = spec.directives[i];
    if (!d) return {
      scene_template: "text_dominant" as const,
      image_motion: null, highlight_words: [], visual_query: null, animation_spec: null,
    };
    return {
      scene_template: (["fullbleed","text_dominant","stat_callout","animated_graphic"].includes(d.scene_template)
        ? d.scene_template : "text_dominant") as "fullbleed" | "text_dominant" | "stat_callout" | "animated_graphic",
      image_motion:    null,
      highlight_words: d.text_treatment.accent_words,
      visual_query:    null,
      animation_spec:  null,
    };
  });

  return {
    hook:            hookSentence?.text ?? "",
    body,
    cta:             closeSentence?.text ?? "",
    mood:            "dark",
    pacing:          "medium",
    visualStyle:     "cinematic",
    title:           spec.topic,
    contentType:     "factual",
    accentColor:     spec.accentColor,
    sceneDirectives,
  };
}

// ─── Main pipeline ─────────────────────────────────────────────────────────────

export async function generateVideoSpec(
  rawContent: string,
  options: { temperature?: number; outputDir?: string } = {}
): Promise<{ videoSpec: VideoSpec; metadata: ContentMetadata; script: string; savedTo: string }> {
  const outputDir = options.outputDir ?? path.join(__dirname, "..", "data", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("  ║   LM Studio · Visual Director Pipeline    ║");
  console.log("  ╚═══════════════════════════════════════════╝");

  // ── CALL 1: Script writer ──────────────────────────────────────────────────
  const t1 = timer();
  let script: ScriptPackage;

  try {
    script = await runCall1(rawContent, { temperature: options.temperature });
  } catch (err) {
    console.warn(`  ✗  Call 1 failed (${t1()}) — aborting`);
    throw err;
  }
  console.log(`  ✓  Call 1 done (${t1()})`);

  const call1Path = path.join(outputDir, "metadata_call1.json");
  fs.writeFileSync(call1Path, JSON.stringify(script, null, 2), "utf-8");
  console.log(`     Saved → ${call1Path}`);

  // ── CALL 1b: Director's brief ──────────────────────────────────────────────
  const t1b = timer();
  let brief: VisualBrief;

  try {
    brief = await runCall1b(script, { temperature: options.temperature });
  } catch (err) {
    console.warn(`  ✗  Call 1b failed (${t1b()}) — aborting`);
    throw err;
  }
  console.log(`  ✓  Call 1b done (${t1b()})`);

  const call1bPath = path.join(outputDir, "metadata_call1b.json");
  fs.writeFileSync(call1bPath, JSON.stringify(brief, null, 2), "utf-8");
  console.log(`     Saved → ${call1bPath}`);

  // ── CALL 2: Visual director ────────────────────────────────────────────────
  const t2 = timer();
  let directives: SentenceVisualDirective[];

  try {
    directives = await runCall2(script, { temperature: options.temperature, brief });
  } catch (err) {
    console.warn(`  ✗  Call 2 failed (${t2()}) — aborting`);
    throw err;
  }
  console.log(`  ✓  Call 2 done (${t2()})`);

  const call2Path = path.join(outputDir, "metadata_call2.json");
  fs.writeFileSync(call2Path, JSON.stringify(directives, null, 2), "utf-8");
  console.log(`     Saved → ${call2Path}`);

  // ── Distribution repair (safety net — brief is guidance, model may still ignore it) ──
  const textDomPct =
    directives.filter(d => d.scene_template === "text_dominant").length / directives.length;

  if (textDomPct > 0.40) {
    console.log(`  ⚠️  text_dominant at ${Math.round(textDomPct * 100)}% — running distribution repair…`);
    const repaired    = await runDistributionRepair(directives, script, { temperature: options.temperature });
    const repairedPct = repaired.filter(d => d.scene_template === "text_dominant").length / repaired.length;
    if (repairedPct < textDomPct) {
      console.log(`  ✓  Distribution improved → ${Math.round(repairedPct * 100)}% text_dominant`);
      directives = repaired;
    } else {
      console.log(`  ⚠  Repair did not improve distribution — keeping original`);
    }
  }

  logDistribution(directives);

  // ── Build VideoSpec ────────────────────────────────────────────────────────
  const videoSpec: VideoSpec = {
    topic:       script.topic,
    accentColor: script.accentColor,
    sentences:   script.sentences,
    directives,
  };

  // Also produce legacy ContentMetadata for backward compat
  const metadata = videoSpecToMetadata(videoSpec);
  logVideoSpecSummary(videoSpec);

  // Save outputs
  const scriptText  = script.sentences.map(s => s.text).join(" ");
  const savedTo     = path.join(outputDir, "output.txt");
  const metaPath    = path.join(outputDir, "metadata.json");
  const specPath    = path.join(outputDir, "videospec.json");

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  fs.writeFileSync(specPath, JSON.stringify(videoSpec, null, 2), "utf-8");
  fs.writeFileSync(savedTo, scriptText, "utf-8");

  console.log(`  Saved → ${specPath}  (${directives.length} directives)`);
  console.log(`  Saved → ${metaPath}`);
  console.log(`  Saved → ${savedTo}\n`);

  return { videoSpec, metadata, script: scriptText, savedTo };
}

/** @deprecated Use generateVideoSpec instead */
export async function analyzeAndStructure(
  rawContent: string,
  options: { temperature?: number; outputDir?: string } = {}
): Promise<{ metadata: ContentMetadata; script: string; savedTo: string }> {
  const { metadata, script, savedTo } = await generateVideoSpec(rawContent, options);
  return { metadata, script, savedTo };
}
