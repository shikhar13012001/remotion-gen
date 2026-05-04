import * as fs from "fs";
import * as path from "path";
import { runCall1 } from "./call1.js";
import { logVideoSpecSummary } from "../trace.js";
import type {
  VideoSpec,
  ScriptPackage,
} from "./types.js";

function timer(): () => string {
  const t = Date.now();
  return () => `${((Date.now() - t) / 1000).toFixed(1)}s`;
}

// ─── Main pipeline ─────────────────────────────────────────────────────────────

export async function generateVideoSpec(
  rawContent: string,
  options: {
    temperature?: number;
    outputDir?:   string;
    guide?:       string;
    design?:      string;
  } = {}
): Promise<{ videoSpec: VideoSpec; savedTo: string }> {
  const outputDir = options.outputDir ?? path.join(__dirname, "..", "data", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("  ║        LM Studio · Script Generation      ║");
  console.log("  ╚═══════════════════════════════════════════╝");

  // ── CALL 1: Script writer ──────────────────────────────────────────────────
  const t1 = timer();
  let script: ScriptPackage;

  // Resolve guide path → read file content so the LLM receives the actual guide,
  // not just a file path string.
  let guideContent: string | undefined;
  if (options.guide) {
    const guideAbs = path.isAbsolute(options.guide)
      ? options.guide
      : path.resolve(process.cwd(), options.guide);
    if (fs.existsSync(guideAbs)) {
      guideContent = fs.readFileSync(guideAbs, "utf-8");
      console.log(`  Guide: ${options.guide}`);
    } else {
      console.warn(`  ⚠  Guide not found (skipping): ${options.guide}`);
    }
  }

  // Resolve design path → read DESIGN.md content so the LLM gets color/type/spacing values.
  let designContent: string | undefined;
  if (options.design) {
    const designAbs = path.isAbsolute(options.design)
      ? options.design
      : path.resolve(process.cwd(), options.design);
    if (fs.existsSync(designAbs)) {
      designContent = fs.readFileSync(designAbs, "utf-8");
      console.log(`  Design: ${options.design}`);
    } else {
      console.warn(`  ⚠  Design file not found (skipping): ${options.design}`);
    }
  }

  try {
    script = await runCall1(rawContent, { temperature: options.temperature, guide: guideContent, design: designContent });
  } catch (err) {
    console.warn(`  ✗  Call 1 failed (${t1()}) — aborting`);
    throw err;
  }
  console.log(`  ✓  Call 1 done (${t1()})`);

  // ── Save outputs ───────────────────────────────────────────────────────────
  const scriptJsonPath = path.join(outputDir, "script.json");
  fs.writeFileSync(scriptJsonPath, JSON.stringify(script, null, 2), "utf-8");

  // output.txt — plain narration text, consumed by ElevenLabs TTS step
  const savedTo    = path.join(outputDir, "output.txt");
  const scriptText = script.sentences.map(s => s.text).join(" ");
  fs.writeFileSync(savedTo, scriptText, "utf-8");

  console.log(`  Saved → ${scriptJsonPath}`);
  console.log(`  Saved → ${savedTo}\n`);

  const videoSpec: VideoSpec = {
    topic:       script.topic,
    accentColor: script.accentColor,
    sentences:   script.sentences,
    directives:  [],
  };

  logVideoSpecSummary(videoSpec);

  return { videoSpec, savedTo };
}
