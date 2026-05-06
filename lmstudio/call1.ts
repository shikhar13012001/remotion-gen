import * as fs from "fs";
import * as path from "path";
import { createScriptLLMProvider, model as defaultModel } from "./caller";
import { buildDefaultScriptPlan, buildPlannerUserMessage, loadPlannerPrompt, sanitizeScriptPlan } from "./scriptPlanner";
import { buildScriptPackageSchema, buildScriptPlanSchema } from "./scriptSchemas";
import { compileScriptContextBundle } from "./scriptContext";
import { summarizeValidationReport, validateScriptPackage } from "./scriptValidation";
import { logScriptTable } from "../trace";
import type {
  PromptRequest,
  ScriptContextBundle,
  ScriptGenerationTrace,
  ScriptLLMProvider,
  ScriptPackage,
  ScriptPlan,
  ScriptSpec,
  ValidationReport,
} from "./types";

const PROMPT_DIR = path.join(__dirname, "prompts");

function readPrompt(fileName: string, fallback: string): string {
  const promptPath = path.join(PROMPT_DIR, fileName);
  return fs.existsSync(promptPath) ? fs.readFileSync(promptPath, "utf-8").trim() : fallback;
}

const WRITER_PROMPT = readPrompt(
  "prompt_script_writer.txt",
  "Return only valid ScriptPackage JSON that follows the supplied plan and spec.",
);
const JSON_REPAIR_PROMPT = readPrompt(
  "prompt_script_json_repair.txt",
  "Return only valid JSON. Repair syntax only.",
);
const SEMANTIC_REPAIR_PROMPT = readPrompt(
  "prompt_script_semantic_repair.txt",
  "Return only valid ScriptPackage JSON and fix only the issues listed.",
);

interface RunCall1Options {
  temperature?: number;
  model?: string;
  guideContent?: string;
  guidePath?: string;
  designContent?: string;
  designPath?: string;
  provider?: ScriptLLMProvider;
}

export interface RunCall1Result {
  script: ScriptPackage;
  context: ScriptContextBundle;
  plan: ScriptPlan;
  spec: ScriptSpec;
  trace: ScriptGenerationTrace;
  validation: ValidationReport;
}

function approxTokens(value: string): number {
  return Math.max(1, Math.round(value.length / 4));
}

function addAttempt(
  trace: ScriptGenerationTrace,
  stage: "plan" | "write" | "repair",
  success: boolean,
  issues: string[],
): void {
  trace.attempts.push({ stage, success, issues });
}

function buildPromptRequest(
  systemPrompt: string,
  userMessage: string,
  spec: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    schema?: Record<string, unknown>;
    schemaName?: string;
  },
): PromptRequest {
  return {
    systemPrompt,
    userMessage,
    model: spec.model,
    temperature: spec.temperature,
    maxTokens: spec.maxTokens,
    schema: spec.schema,
    schemaName: spec.schemaName,
  };
}

function buildWriterUserMessage(
  context: ScriptContextBundle,
  spec: ScriptSpec,
  plan: ScriptPlan,
  extraIssues: string[] = [],
): string {
  const lines = [
    "SCRIPT CONTEXT BUNDLE:",
    JSON.stringify(context, null, 2),
    "",
    "SCRIPT SPEC:",
    JSON.stringify(spec, null, 2),
    "",
    "SCRIPT PLAN:",
    JSON.stringify(plan, null, 2),
  ];

  if (extraIssues.length > 0) {
    lines.push("");
    lines.push("ISSUES TO FIX IN THIS ATTEMPT:");
    for (const issue of extraIssues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

function buildJsonRepairUserMessage(targetName: string, brokenOutput: string): string {
  return [
    `TARGET TYPE: ${targetName}`,
    "",
    "BROKEN OUTPUT:",
    brokenOutput,
  ].join("\n");
}

function buildSemanticRepairUserMessage(
  context: ScriptContextBundle,
  spec: ScriptSpec,
  plan: ScriptPlan,
  currentScript: ScriptPackage,
  report: ValidationReport,
): string {
  return [
    "SCRIPT CONTEXT BUNDLE:",
    JSON.stringify(context, null, 2),
    "",
    "SCRIPT SPEC:",
    JSON.stringify(spec, null, 2),
    "",
    "SCRIPT PLAN:",
    JSON.stringify(plan, null, 2),
    "",
    "CURRENT SCRIPT PACKAGE:",
    JSON.stringify(currentScript, null, 2),
    "",
    "VALIDATION ISSUES:",
    JSON.stringify(report.issues, null, 2),
  ].join("\n");
}

async function repairMalformedJson(
  provider: ScriptLLMProvider,
  model: string,
  temperature: number,
  targetName: string,
  schema: Record<string, unknown>,
  brokenOutput: string,
): Promise<Record<string, unknown>> {
  return provider.generateJSON<Record<string, unknown>>(buildPromptRequest(
    JSON_REPAIR_PROMPT,
    buildJsonRepairUserMessage(targetName, brokenOutput),
    {
      model,
      temperature: 0.1,
      maxTokens: 6000,
      schema,
      schemaName: targetName.toLowerCase(),
    },
  ));
}

async function generatePlan(
  provider: ScriptLLMProvider,
  context: ScriptContextBundle,
  spec: ScriptSpec,
  trace: ScriptGenerationTrace,
  requestModel: string,
  temperature: number,
): Promise<ScriptPlan> {
  const systemPrompt = loadPlannerPrompt();
  const userMessage = buildPlannerUserMessage(context, spec);
  trace.promptSizes.planPromptTokensApprox = approxTokens(systemPrompt) + approxTokens(userMessage);
  const schema = buildScriptPlanSchema(spec);

  try {
    const rawPlan = await provider.generateJSON<Record<string, unknown>>(buildPromptRequest(
      systemPrompt,
      userMessage,
      {
        model: requestModel,
        temperature,
        maxTokens: 3500,
        schema,
        schemaName: "script_plan",
      },
    ));
    addAttempt(trace, "plan", true, []);
    return sanitizeScriptPlan(rawPlan, context, spec);
  } catch (error) {
    addAttempt(trace, "plan", false, [error instanceof Error ? error.message : String(error)]);
  }

  try {
    const rawText = await provider.generateText(buildPromptRequest(
      systemPrompt,
      userMessage,
      {
        model: requestModel,
        temperature,
        maxTokens: 3500,
      },
    ));
    const repaired = await repairMalformedJson(
      provider,
      requestModel,
      temperature,
      "ScriptPlan",
      schema,
      rawText,
    );
    addAttempt(trace, "repair", true, ["Recovered malformed planner JSON."]);
    return sanitizeScriptPlan(repaired, context, spec);
  } catch (error) {
    addAttempt(trace, "repair", false, [error instanceof Error ? error.message : String(error)]);
  }

  return buildDefaultScriptPlan(context, spec);
}

async function generateScriptCandidate(
  provider: ScriptLLMProvider,
  context: ScriptContextBundle,
  spec: ScriptSpec,
  plan: ScriptPlan,
  trace: ScriptGenerationTrace,
  requestModel: string,
  temperature: number,
  extraIssues: string[] = [],
): Promise<Record<string, unknown>> {
  const systemPrompt = WRITER_PROMPT;
  const userMessage = buildWriterUserMessage(context, spec, plan, extraIssues);
  trace.promptSizes.writePromptTokensApprox = approxTokens(systemPrompt) + approxTokens(userMessage);
  const schema = buildScriptPackageSchema(spec);

  try {
    const result = await provider.generateJSON<Record<string, unknown>>(buildPromptRequest(
      systemPrompt,
      userMessage,
      {
        model: requestModel,
        temperature,
        maxTokens: 7000,
        schema,
        schemaName: "script_package",
      },
    ));
    addAttempt(trace, "write", true, extraIssues);
    return result;
  } catch (error) {
    addAttempt(trace, "write", false, [error instanceof Error ? error.message : String(error)]);
  }

  const rawText = await provider.generateText(buildPromptRequest(
    systemPrompt,
    userMessage,
    {
      model: requestModel,
      temperature,
      maxTokens: 7000,
    },
  ));
  const repaired = await repairMalformedJson(
    provider,
    requestModel,
    temperature,
    "ScriptPackage",
    schema,
    rawText,
  );
  addAttempt(trace, "repair", true, ["Recovered malformed writer JSON."]);
  return repaired;
}

function scoreReport(report: ValidationReport): number {
  const severityWeight = report.severity === "ok" ? 0 : report.severity === "warn" ? 100 : 200;
  return severityWeight + report.issues.length;
}

function pickBetterScript(
  left: ReturnType<typeof validateScriptPackage>,
  right: ReturnType<typeof validateScriptPackage>,
): ReturnType<typeof validateScriptPackage> {
  return scoreReport(left.report) <= scoreReport(right.report) ? left : right;
}

export async function runCall1(rawContent: string, opts: RunCall1Options = {}): Promise<RunCall1Result> {
  console.log("\n  -- CALL 1: Script subsystem ----------------------------------------");

  const provider = opts.provider ?? createScriptLLMProvider();
  const requestModel = opts.model ?? defaultModel;
  const temperature = opts.temperature ?? 0.45;

  const compiled = compileScriptContextBundle({
    topic: rawContent,
    guideContent: opts.guideContent,
    guidePath: opts.guidePath,
    designContent: opts.designContent,
    designPath: opts.designPath,
  });

  const trace: ScriptGenerationTrace = {
    promptSizes: {
      contextBundleTokensApprox: compiled.contextTokensApprox,
      planPromptTokensApprox: 0,
      writePromptTokensApprox: 0,
    },
    attempts: [],
    selectedSpec: compiled.spec,
  };

  const plan = await generatePlan(
    provider,
    compiled.bundle,
    compiled.spec,
    trace,
    requestModel,
    temperature,
  );

  let candidateRaw = await generateScriptCandidate(
    provider,
    compiled.bundle,
    compiled.spec,
    plan,
    trace,
    requestModel,
    temperature,
  );

  let validated = validateScriptPackage(candidateRaw, compiled.bundle, plan, compiled.spec);

  if (validated.report.severity === "fail") {
    try {
      const repairedRaw = await provider.generateJSON<Record<string, unknown>>(buildPromptRequest(
        SEMANTIC_REPAIR_PROMPT,
        buildSemanticRepairUserMessage(compiled.bundle, compiled.spec, plan, validated.script, validated.report),
        {
          model: requestModel,
          temperature: 0.2,
          maxTokens: 7000,
          schema: buildScriptPackageSchema(compiled.spec),
          schemaName: "script_package",
        },
      ));
      addAttempt(trace, "repair", true, summarizeValidationReport(validated.report));
      const repairedValidated = validateScriptPackage(repairedRaw, compiled.bundle, plan, compiled.spec);
      repairedValidated.repaired = true;
      validated = pickBetterScript(validated, repairedValidated);
    } catch (error) {
      addAttempt(trace, "repair", false, [error instanceof Error ? error.message : String(error)]);
    }
  }

  if (validated.report.severity === "fail") {
    try {
      candidateRaw = await generateScriptCandidate(
        provider,
        compiled.bundle,
        compiled.spec,
        plan,
        trace,
        requestModel,
        temperature,
        summarizeValidationReport(validated.report),
      );
      const rerunValidated = validateScriptPackage(candidateRaw, compiled.bundle, plan, compiled.spec);
      validated = pickBetterScript(validated, rerunValidated);
    } catch (error) {
      addAttempt(trace, "write", false, [error instanceof Error ? error.message : String(error)]);
    }
  }

  if (validated.script.sentences.length === 0) {
    throw new Error("Script generation produced no usable sentences.");
  }

  const pkg = validated.script;
  const totalMs = pkg.sentences.reduce((sum, sentence) => sum + sentence.suggested_duration_ms, 0);
  console.log(`  Generated plan for ${plan.sentenceCountTarget} sentences.`);
  console.log(`  Script result: ${pkg.sentences.length} sentences, ${pkg.total_words} words, ~${Math.round(totalMs / 1000)}s`);
  if (validated.report.issues.length > 0) {
    console.warn("  Validation notes:");
    for (const issue of summarizeValidationReport(validated.report)) {
      console.warn(`    - ${issue}`);
    }
  }
  logScriptTable(pkg);

  return {
    script: pkg,
    context: compiled.bundle,
    plan,
    spec: compiled.spec,
    trace,
    validation: validated.report,
  };
}
