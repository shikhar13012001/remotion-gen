import * as fs from "fs";
import * as path from "path";
import { callLMStudioJSON, callLMStudioRaw, model } from "./caller.js";
import { validateDirectivesArray, buildTextDominantFallback } from "./validate.js";
import type { ScriptPackage, SentenceVisualDirective, VisualBrief } from "./types.js";

const PROMPT_DIR = path.join(__dirname, "prompts");
const SCHEMA_DIR = path.join(__dirname, "schemas");

const PROMPT_CALL2 = fs.readFileSync(path.join(PROMPT_DIR, "prompt_call2_scenes.txt"), "utf8");
const SCHEMA_B     = JSON.parse(
  fs.readFileSync(path.join(SCHEMA_DIR, "schemaB_scenes.json"), "utf8")
) as Record<string, Record<string, unknown>>;

const SCHEMA_KEY = "schemaB_directives";

const REPAIR_PROMPT_PREFIX =
  "You are a JSON repair tool. The previous response was not a valid JSON array.\n" +
  "Return ONLY the corrected JSON array, nothing else.\n" +
  "No markdown. No explanation. Just the array starting with [ and ending with ].\n\n" +
  "Critical fixes needed:\n" +
  "- template_data objects must have a 'type' field matching the scene_template\n" +
  "- accent_words must be an array of strings, never null\n" +
  "- Every object needs transition_out: 'hard_cut' or 'crossfade'\n\n" +
  "Previous broken output:\n";

const DISTRIBUTION_REPAIR_PREFIX =
  "Review this directive array and improve template variety.\n" +
  "Current problem: too many text_dominant scenes. Convert them using these rules IN ORDER:\n\n" +
  "  1. sentence contains a number, statistic, percentage, or death toll → stat_callout\n" +
  "  2. sentence describes data, geography, sequence, comparison, trend, process → animated_graphic\n" +
  "  3. sentence names a specific person, place, or dated event with photographic subject → fullbleed\n" +
  "  4. sentence is a rhetorical question, emotional beat, or transition → keep as text_dominant\n\n" +
  "Valid scene_template values: fullbleed, text_dominant, stat_callout, animated_graphic\n" +
  "DO NOT use: editorial_headline, subject_cutout, split_photo_data, transition_wipe\n\n" +
  "Return a JSON object with a 'directives' key containing the complete corrected array.\n" +
  "Same item count. Same sentence text. Never change: sentence, transition_out, accent_words.\n" +
  "Only change scene_template and template_data where a rule applies.\n\n" +
  "Current array:\n";

/** Build the user message for Call 2: brief header + numbered sentences with beat + timing. */
export function buildVisualDirectorInput(
  script: ScriptPackage,
  brief?: VisualBrief
): string {
  const n = script.sentences.length;

  // ── Build per-sentence act label lookup ──────────────────────────────────
  const actLabel: Record<number, string> = {};
  if (brief) {
    for (const act of brief.acts) {
      const [from, to] = act.sentence_range;
      for (let i = from; i <= to; i++) actLabel[i] = act.label;
    }
  }

  // ── Build key_moment lookup ───────────────────────────────────────────────
  const hardConstraints: Record<number, string> = {};
  if (brief) {
    for (const km of brief.key_moments) {
      const hint = km.animation_hint ? ` · animation_hint: ${km.animation_hint}` : "";
      hardConstraints[km.sentence_index] =
        `⚑ HARD ASSIGNMENT: scene_template="${km.scene_template}"${hint} — ${km.reason}`;
    }
  }

  // ── Build sentence lines ──────────────────────────────────────────────────
  let cumulativeMs = 0;
  const lines = script.sentences.map(s => {
    const act   = actLabel[s.index] ? ` | ACT: ${actLabel[s.index]}` : "";
    const hard  = hardConstraints[s.index] ? `\n  ${hardConstraints[s.index]}` : "";
    const line  = `[${s.index}] (${s.beat.toUpperCase()} · ${s.suggested_duration_ms}ms · starts at ${cumulativeMs}ms${act})${hard}\n"${s.text}"`;
    cumulativeMs += s.suggested_duration_ms;
    return line;
  });

  // ── Build brief header ────────────────────────────────────────────────────
  let briefHeader = "";
  if (brief) {
    const b = brief.budget;
    const budgetLine =
      `animated_graphic=${b.animated_graphic}  stat_callout=${b.stat_callout}  ` +
      `fullbleed=${b.fullbleed}  text_dominant=${b.text_dominant}  (total=${n})`;
    briefHeader =
      `DIRECTOR'S BRIEF:\n` +
      `Visual theme: ${brief.visual_theme}\n` +
      `Rhythm: ${brief.rhythm_notes}\n` +
      `\nTEMPLATE BUDGET (fill these counts exactly):\n  ${budgetLine}\n` +
      `\nACT STRUCTURE:\n` +
      brief.acts.map(a =>
        `  ${a.label} [sentences ${a.sentence_range[0]}–${a.sentence_range[1]}]: ` +
        `favour ${a.dominant_template} — ${a.visual_tone}`
      ).join("\n") +
      `\n\nKEY MOMENTS (⚑ = hard assignment — you CANNOT change these):\n` +
      (brief.key_moments.length > 0
        ? brief.key_moments.map(km => {
            const hint = km.animation_hint ? `, animation_hint: ${km.animation_hint}` : "";
            return `  Sentence ${km.sentence_index}: ${km.scene_template}${hint} — ${km.reason}`;
          }).join("\n")
        : "  (none)") +
      `\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  return (
    `${briefHeader}` +
    `Topic: ${script.topic}\n` +
    `Total video duration: ${cumulativeMs}ms\n` +
    `Accent color: ${script.accentColor}\n` +
    `REQUIRED: Output exactly ${n} directives — one per sentence, in order.\n` +
    `Hard assignments (⚑) MUST be honoured — use exactly the template specified.\n\n` +
    `Sentences:\n\n${lines.join("\n\n")}`
  );
}

function extractArray(result: unknown): unknown[] {
  if (Array.isArray(result)) return result as unknown[];
  if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;
    // Look for a directives key first, then any array
    if (Array.isArray(obj.directives)) return obj.directives as unknown[];
    const arrayKey = Object.keys(obj).find(k => Array.isArray(obj[k]));
    if (arrayKey) return obj[arrayKey] as unknown[];
  }
  return [];
}

export async function runCall2(
  script: ScriptPackage,
  opts: { temperature?: number; brief?: VisualBrief; guide?: string } = {}
): Promise<SentenceVisualDirective[]> {
  console.log(`\n  ── CALL 2: Visual director (${script.sentences.length} sentences) ──────────`);

  const schemaKey = SCHEMA_KEY;
  const schemaBase = SCHEMA_B[schemaKey];
  if (!schemaBase) throw new Error(`No schema found for key: ${schemaKey}`);

  // Lock minItems/maxItems to exact sentence count so the model cannot stop early
  const schemaProps = (schemaBase as Record<string, unknown>).properties as Record<string, unknown>;
  const schemaWithCount = {
    ...schemaBase,
    properties: {
      ...schemaProps,
      directives: {
        ...(schemaProps.directives as Record<string, unknown>),
        minItems: script.sentences.length,
        maxItems: script.sentences.length,
      },
    },
  };

  const guideHeader = opts.guide
    ? `CREATIVE GUIDE:\n${"─".repeat(60)}\n${opts.guide}\n${"─".repeat(60)}\n\n`
    : "";
  const userMessage = guideHeader + buildVisualDirectorInput(script, opts.brief);

  // ── Primary call ────────────────────────────────────────────────────────────
  let rawArray: unknown[] = [];
  let parseOk = false;

  try {
    const result = await callLMStudioJSON<unknown>(
      PROMPT_CALL2,
      userMessage,
      { model, temperature: opts.temperature ?? 0.3, maxTokens: 10000, schema: schemaWithCount, schemaName: schemaKey }
    );
    rawArray = extractArray(result);
    parseOk  = rawArray.length > 0;
  } catch (parseErr) {
    console.warn(`  ⚠  Call 2 parse failed — attempting repair…`);
  }

  // ── Repair if needed ────────────────────────────────────────────────────────
  if (!parseOk) {
    try {
      const rawStr = await callLMStudioRaw(
        PROMPT_CALL2,
        userMessage,
        { model, temperature: opts.temperature ?? 0.3, maxTokens: 10000 }
      );
      const repairMsg = REPAIR_PROMPT_PREFIX + rawStr;
      const repaired  = await callLMStudioJSON<unknown>(
        "You are a JSON repair tool. Return only valid JSON array.",
        repairMsg,
        { model, temperature: 0.1, maxTokens: 10000 }
      );
      rawArray = extractArray(repaired);
    } catch (repairErr) {
      console.warn(`  ✗  Repair failed — using text_dominant fallbacks for all sentences`);
      console.warn(repairErr instanceof Error ? repairErr.message : repairErr);
      return script.sentences.map(s =>
        buildTextDominantFallback(s.index, s.text)
      );
    }
  }

  if (rawArray.length === 0) {
    console.warn(`  ⚠  Call 2 returned 0 items — using text_dominant fallbacks`);
    return script.sentences.map(s =>
      buildTextDominantFallback(s.index, s.text)
    );
  }

  const directives = validateDirectivesArray(rawArray, script);
  console.log(`  ✅  Call 2 — ${directives.length} directives`);
  return directives;
}

/** Run a distribution repair pass if text_dominant is too dominant (> 40%). */
export async function runDistributionRepair(
  directives: SentenceVisualDirective[],
  script:     ScriptPackage,
  opts:       { temperature?: number } = {}
): Promise<SentenceVisualDirective[]> {
  const repairMsg = DISTRIBUTION_REPAIR_PREFIX + JSON.stringify(directives, null, 2);

  try {
    const result = await callLMStudioJSON<unknown>(
      "You are a JSON repair tool for video scene directives. " +
      "Improve template variety by converting text_dominant scenes per the rules below. " +
      "Return a JSON object with a 'directives' array. No markdown, no explanation.",
      repairMsg,
      { model, temperature: opts.temperature ?? 0.2, maxTokens: 10000,
        schema: SCHEMA_B[SCHEMA_KEY], schemaName: SCHEMA_KEY }
    );
    const rawArray = extractArray(result);
    if (rawArray.length === 0) return directives;
    return validateDirectivesArray(rawArray, script);
  } catch (err) {
    console.warn(`  ✗  Distribution repair failed:`, err instanceof Error ? err.message : err);
    return directives;
  }
}
