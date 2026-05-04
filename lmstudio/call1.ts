import * as fs from "fs";
import * as path from "path";
import { callLMStudioJSON, callLMStudioRaw, model } from "./caller.js";
import { logScriptTable } from "../trace.js";
import type { ScriptPackage } from "./types.js";

const PROMPT_DIR = path.join(__dirname, "prompts");
const SCHEMA_DIR = path.join(__dirname, "schemas");

const PROMPT_CALL1 = fs.readFileSync(path.join(PROMPT_DIR, "prompt_call1_script.txt"), "utf8");
const SCHEMA_A     = JSON.parse(
  fs.readFileSync(path.join(SCHEMA_DIR, "schemaA_script.json"), "utf8")
) as Record<string, unknown>;

const REPAIR_PROMPT =
  "You are a JSON repair tool. The previous response was not valid JSON.\n" +
  "Return ONLY the corrected ScriptPackage JSON object, nothing else.\n" +
  "No markdown fences. No explanation. Just the JSON.\n\n" +
  "Required: topic (string), total_words (integer), accentColor (#rrggbb), " +
  "sentences array with index/text/beat/word_count/suggested_duration_ms/" +
  "visualQuery/needsImage/highlightWords/dataValue per item.\n\n" +
  "Previous broken output:\n";

const MIN_SENTENCES = 8;
const MAX_ATTEMPTS  = 3;

function buildUserMessage(rawContent: string, attempt: number, guide?: string, design?: string): string {
  const prefix = attempt > 1
    ? `IMPORTANT: Your previous response had too few sentences. ` +
      `You MUST write exactly 10–16 sentences in the sentences array. ` +
      `First sentence beat MUST be "hook". Last sentence beat MUST be "close".\n\n`
    : "";
  const designSection = design
    ? `DESIGN SYSTEM:\n${"\u2500".repeat(60)}\n${design}\n${"\u2500".repeat(60)}\n\n`
    : "";
  const guideSection = guide
    ? `CREATIVE GUIDE FOR THIS CATEGORY:\n${"\u2500".repeat(60)}\n${guide}\n${"\u2500".repeat(60)}\n\n`
    : "";
  return `${designSection}${guideSection}${prefix}Topic: ${rawContent.trim()}`;
}

function coerceScriptPackage(raw: Record<string, unknown>): ScriptPackage {
  const sentences = Array.isArray(raw.sentences) ? raw.sentences as Record<string, unknown>[] : [];

  const cleaned = sentences.map((s, i) => {
    const text = typeof s.text === "string" ? s.text : "";
    const beat = (["hook","build","turn","reveal","breathe","close"] as const)
      .includes(s.beat as "hook") ? s.beat as ScriptPackage["sentences"][0]["beat"] : "build";
    const isImageless = beat === "breathe" || beat === "close";

    const rawQuery = typeof s.visualQuery === "string" ? s.visualQuery.trim() : null;
    const visualQuery = rawQuery && rawQuery.split(/\s+/).length >= 4 && !isImageless
      ? rawQuery
      : null;

    const rawHighlights = Array.isArray(s.highlightWords)
      ? (s.highlightWords as unknown[]).filter((w): w is string => typeof w === "string")
      : [];
    const lowerText = text.toLowerCase();
    const highlightWords = rawHighlights.filter(w => lowerText.includes(w.toLowerCase())).slice(0, 3);

    return {
      index:                 typeof s.index  === "number" ? s.index  : i + 1,
      text,
      beat,
      word_count:            typeof s.word_count === "number" ? s.word_count : text.split(" ").length,
      suggested_duration_ms: typeof s.suggested_duration_ms === "number"
                               ? Math.min(8000, Math.max(2000, s.suggested_duration_ms))
                               : 3000,
      visualQuery,
      needsImage:            typeof s.needsImage === "boolean" ? s.needsImage && !isImageless : visualQuery !== null,
      highlightWords,
      dataValue:             typeof s.dataValue === "number" && isFinite(s.dataValue) ? s.dataValue : null,
    };
  });

  // Ensure first is hook, last is close
  if (cleaned.length > 0 && cleaned[0].beat !== "hook")   cleaned[0].beat  = "hook";
  if (cleaned.length > 1 && cleaned[cleaned.length - 1].beat !== "close") cleaned[cleaned.length - 1].beat = "close";

  // Redistribute interior beats if model returned all the same value (e.g. all "close")
  const interior = cleaned.slice(1, -1);
  if (interior.length > 1) {
    const beatCounts: Record<string, number> = {};
    for (const s of interior) beatCounts[s.beat] = (beatCounts[s.beat] ?? 0) + 1;
    const maxCount = Math.max(...Object.values(beatCounts));
    if (maxCount / interior.length >= 0.7) {
      const INTERIOR_BEATS: ScriptPackage["sentences"][0]["beat"][] =
        ["build", "build", "turn", "reveal", "build", "breathe"];
      interior.forEach((s, i) => { s.beat = INTERIOR_BEATS[i % INTERIOR_BEATS.length]; });
    }
  }

  const color = typeof raw.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.accentColor)
    ? raw.accentColor : "#c8a96e";

  return {
    topic:       typeof raw.topic       === "string" ? raw.topic       : "Unknown",
    total_words: typeof raw.total_words === "number" ? raw.total_words : cleaned.reduce((a, s) => a + s.word_count, 0),
    accentColor: color,
    sentences:   cleaned,
  };
}

export async function runCall1(
  rawContent: string,
  opts: { temperature?: number; guide?: string; design?: string } = {}
): Promise<ScriptPackage> {
  console.log("\n  ── CALL 1: Script writer ──────────────────────────────────────────────────────");

  let output: ScriptPackage | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) console.log(`  ↻  Retry ${attempt}/${MAX_ATTEMPTS}`);

    let result: Record<string, unknown>;
    try {
      result = await callLMStudioJSON<Record<string, unknown>>(
        PROMPT_CALL1,
        buildUserMessage(rawContent, attempt, opts.guide, opts.design),
        { model, temperature: opts.temperature ?? 0.6, maxTokens: 3000, schema: SCHEMA_A, schemaName: "script_package" }
      );
    } catch (parseErr) {
      // JSON parse failed — run repair
      console.warn(`  ⚠  Call 1 parse failed (attempt ${attempt}) — attempting repair…`);
      try {
        const rawStr = await callLMStudioRaw(
          PROMPT_CALL1,
          buildUserMessage(rawContent, attempt, opts.guide),
          { model, temperature: opts.temperature ?? 0.6, maxTokens: 3000 }
        );
        const repairMsg = REPAIR_PROMPT + rawStr;
        result = await callLMStudioJSON<Record<string, unknown>>(
          "You are a JSON repair tool. Return only valid JSON.",
          repairMsg,
          { model, temperature: 0.1, maxTokens: 3000 }
        );
      } catch (repairErr) {
        console.warn(`  ✗  Repair failed on attempt ${attempt}:`, repairErr instanceof Error ? repairErr.message : repairErr);
        if (attempt === MAX_ATTEMPTS) throw repairErr;
        continue;
      }
    }

    const candidate = coerceScriptPackage(result);

    if (candidate.sentences.length >= MIN_SENTENCES) {
      output = candidate;
      break;
    }
    console.warn(`  ⚠  Attempt ${attempt}: ${candidate.sentences.length} sentences (need ≥${MIN_SENTENCES})`);
    if (attempt === MAX_ATTEMPTS) {
      console.warn(`  ⚠  All ${MAX_ATTEMPTS} attempts under-spec — using best result`);
      output = candidate;
    }
  }

  const pkg = output!;
  const hookCount = pkg.sentences.filter(s => s.beat === "hook").length;
  const closeCount = pkg.sentences.filter(s => s.beat === "close").length;
  const revealCount = pkg.sentences.filter(s => s.beat === "reveal").length;

  if (hookCount === 0)   console.warn("  ⚠  No hook beat found — first sentence will be treated as hook");
  if (closeCount === 0)  console.warn("  ⚠  No close beat found — last sentence will be treated as close");
  if (revealCount === 0) console.warn("  ⚠  No reveal beat found — consider adding one for narrative impact");

  const totalMs = pkg.sentences.reduce((a, s) => a + s.suggested_duration_ms, 0);
  console.log(`  ✅  Call 1 — ${pkg.sentences.length} sentences · ${pkg.total_words} words · ~${Math.round(totalMs / 1000)}s`);
  console.log(`      accent: ${pkg.accentColor}  |  "${pkg.topic}"`);
  logScriptTable(pkg);

  return pkg;
}
