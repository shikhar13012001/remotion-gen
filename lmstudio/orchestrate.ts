import * as fs from "fs";
import * as path from "path";
import { runCall1 } from "./call1";
import { logVideoSpecSummary } from "../trace";
import type {
  VideoSpec,
  ScriptPackage,
} from "./types";

function timer(): () => string {
  const startedAt = Date.now();
  return () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
}

export async function generateVideoSpec(
  rawContent: string,
  options: {
    temperature?: number;
    outputDir?: string;
    guide?: string;
    design?: string;
  } = {},
): Promise<{ videoSpec: VideoSpec; savedTo: string }> {
  const outputDir = options.outputDir ?? path.join(__dirname, "..", "data", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("\n+-------------------------------------------+");
  console.log("  |        LM Studio · Script Generation    |");
  console.log("  +-------------------------------------------+");

  const t1 = timer();
  let script: ScriptPackage;
  let scriptContext: unknown;
  let scriptPlan: unknown;
  let scriptTrace: unknown;

  let guideContent: string | undefined;
  if (options.guide) {
    const guideAbs = path.isAbsolute(options.guide)
      ? options.guide
      : path.resolve(process.cwd(), options.guide);
    if (fs.existsSync(guideAbs)) {
      guideContent = fs.readFileSync(guideAbs, "utf-8");
      console.log(`  Guide: ${options.guide}`);
    } else {
      console.warn(`  Warning: guide not found, skipping: ${options.guide}`);
    }
  }

  let designContent: string | undefined;
  if (options.design) {
    const designAbs = path.isAbsolute(options.design)
      ? options.design
      : path.resolve(process.cwd(), options.design);
    if (fs.existsSync(designAbs)) {
      designContent = fs.readFileSync(designAbs, "utf-8");
      console.log(`  Design: ${options.design}`);
    } else {
      console.warn(`  Warning: design file not found, skipping: ${options.design}`);
    }
  }

  try {
    const result = await runCall1(rawContent, {
      temperature: options.temperature,
      guideContent,
      guidePath: options.guide,
      designContent,
      designPath: options.design,
    });
    script = result.script;
    scriptContext = result.context;
    scriptPlan = result.plan;
    scriptTrace = result.trace;
  } catch (error) {
    console.warn(`  x  Script subsystem failed (${t1()})`);
    throw error;
  }

  console.log(`  ok Script subsystem done (${t1()})`);

  const scriptJsonPath = path.join(outputDir, "script.json");
  const contextJsonPath = path.join(outputDir, "script_context.json");
  const planJsonPath = path.join(outputDir, "script_plan.json");
  const traceJsonPath = path.join(outputDir, "script_trace.json");
  fs.writeFileSync(scriptJsonPath, JSON.stringify(script, null, 2), "utf-8");
  fs.writeFileSync(contextJsonPath, JSON.stringify(scriptContext, null, 2), "utf-8");
  fs.writeFileSync(planJsonPath, JSON.stringify(scriptPlan, null, 2), "utf-8");
  fs.writeFileSync(traceJsonPath, JSON.stringify(scriptTrace, null, 2), "utf-8");

  const savedTo = path.join(outputDir, "output.txt");
  const scriptText = script.sentences.map((sentence) => sentence.text).join(" ");
  fs.writeFileSync(savedTo, scriptText, "utf-8");

  console.log(`  Saved -> ${scriptJsonPath}`);
  console.log(`  Saved -> ${contextJsonPath}`);
  console.log(`  Saved -> ${planJsonPath}`);
  console.log(`  Saved -> ${traceJsonPath}`);
  console.log(`  Saved -> ${savedTo}\n`);

  const videoSpec: VideoSpec = {
    topic: script.topic,
    accentColor: script.accentColor,
    sentences: script.sentences,
    directives: [],
  };

  logVideoSpecSummary(videoSpec);

  return { videoSpec, savedTo };
}
