import * as fs from "fs";
import * as path from "path";
import { callLMStudioJSON, model } from "./caller.js";
import type { ScriptPackage, VisualBrief, KeyMoment, TemplateBudget } from "./types.js";

const PROMPT_DIR = path.join(__dirname, "prompts");
const SCHEMA_DIR = path.join(__dirname, "schemas");

const PROMPT_CALL1B = fs.readFileSync(
  path.join(PROMPT_DIR, "prompt_call1b_brief.txt"), "utf8"
);
const SCHEMA_BRIEF = JSON.parse(
  fs.readFileSync(path.join(SCHEMA_DIR, "schemaBrief.json"), "utf8")
) as Record<string, Record<string, unknown>>;

const SCHEMA_KEY = "schemaBrief";

// ─── Budget validation + auto-correction ──────────────────────────────────────

/**
 * Validates that budget sums to N.
 * If off by ±2, redistributes the difference into/from animated_graphic.
 * If off by more, throws so the caller can retry.
 */
function normaliseBudget(budget: TemplateBudget, n: number): TemplateBudget {
  const sum = budget.animated_graphic + budget.stat_callout + budget.fullbleed + budget.text_dominant;
  const diff = n - sum;

  if (diff === 0) return budget;

  if (Math.abs(diff) > 2) {
    throw new Error(
      `Budget sum mismatch: expected ${n}, got ${sum} ` +
      `(animated_graphic=${budget.animated_graphic}, stat_callout=${budget.stat_callout}, ` +
      `fullbleed=${budget.fullbleed}, text_dominant=${budget.text_dominant})`
    );
  }

  // Absorb small rounding errors into animated_graphic
  console.warn(
    `  [call1b] Budget sum is ${sum}, expected ${n} — adjusting animated_graphic by ${diff}`
  );
  return { ...budget, animated_graphic: budget.animated_graphic + diff };
}

/**
 * Validates key_moment sentence indices are in range and not duplicated.
 * Removes any out-of-range or duplicate entries.
 */
function sanitiseKeyMoments(moments: KeyMoment[], n: number): KeyMoment[] {
  const seen = new Set<number>();
  const valid = moments.filter(m => {
    if (m.sentence_index < 1 || m.sentence_index > n) {
      console.warn(`  [call1b] Dropping key_moment with out-of-range index ${m.sentence_index}`);
      return false;
    }
    if (seen.has(m.sentence_index)) {
      console.warn(`  [call1b] Dropping duplicate key_moment for sentence ${m.sentence_index}`);
      return false;
    }
    seen.add(m.sentence_index);
    return true;
  });

  const density = valid.length / n;
  if (density > 0.70) {
    console.warn(
      `  [call1b] key_moment density ${Math.round(density * 100)}% is very high — ` +
      `cinematographer will have little creative space`
    );
  }

  return valid;
}

/**
 * Validates act sentence_ranges cover [1..N] with no gaps or overlaps.
 * Returns acts as-is with a warning if invalid (non-fatal — call2 still uses them as hints).
 */
function validateActs(acts: VisualBrief["acts"], n: number): void {
  let expected = 1;
  for (const act of acts) {
    const [from, to] = act.sentence_range;
    if (from !== expected) {
      console.warn(
        `  [call1b] Act "${act.label}" starts at sentence ${from}, expected ${expected}`
      );
    }
    expected = to + 1;
  }
  if (expected - 1 !== n) {
    console.warn(
      `  [call1b] Acts only cover sentences 1–${expected - 1}, script has ${n} sentences`
    );
  }
}

// ─── Build user message ────────────────────────────────────────────────────────

function buildBriefInput(script: ScriptPackage): string {
  const lines = script.sentences.map(s =>
    `[${s.index}] (${s.beat.toUpperCase()} · ${s.suggested_duration_ms}ms)\n"${s.text}"`
  );

  return (
    `Topic: ${script.topic}\n` +
    `Total sentences: ${script.sentences.length}\n` +
    `Accent color: ${script.accentColor}\n\n` +
    `Script:\n\n${lines.join("\n\n")}\n\n` +
    `REQUIRED: budget must sum to exactly ${script.sentences.length}.`
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runCall1b(
  script: ScriptPackage,
  opts: { temperature?: number } = {}
): Promise<VisualBrief> {
  const n = script.sentences.length;
  console.log(`\n  ── CALL 1b: Visual brief (${n} sentences) ────────────────────`);

  const schema = SCHEMA_BRIEF[SCHEMA_KEY];
  if (!schema) throw new Error(`No schema found for key: ${SCHEMA_KEY}`);

  const userMessage = buildBriefInput(script);

  let raw: unknown;
  try {
    raw = await callLMStudioJSON<unknown>(
      PROMPT_CALL1B,
      userMessage,
      {
        model,
        temperature: opts.temperature ?? 0.2,
        maxTokens:   6000,
        schema,
        schemaName:  SCHEMA_KEY,
      }
    );
  } catch (err) {
    throw new Error(
      `Call 1b failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Call 1b returned a non-object response");
  }

  const r = raw as Record<string, unknown>;

  // Validate and normalise budget
  const rawBudget = r.budget as TemplateBudget;
  let budget: TemplateBudget;
  try {
    budget = normaliseBudget(rawBudget, n);
  } catch (budgetErr) {
    console.warn(`  [call1b] Budget error — rebalancing to defaults: ${budgetErr}`);
    // Safe fallback: ≥35% animated_graphic, ≤25% text_dominant
    const td  = Math.floor(n * 0.20);
    const sc  = Math.min(2, Math.floor(n * 0.15));
    const ag  = Math.ceil(n * 0.40);
    const fb  = n - ag - sc - td;
    budget = { animated_graphic: ag, stat_callout: sc, fullbleed: Math.max(0, fb), text_dominant: td };
  }

  // Sanitise key_moments
  const rawMoments = Array.isArray(r.key_moments)
    ? (r.key_moments as KeyMoment[])
    : [];
  const key_moments = sanitiseKeyMoments(rawMoments, n);

  // Validate acts (warn-only)
  const acts = Array.isArray(r.acts)
    ? (r.acts as VisualBrief["acts"])
    : [];
  validateActs(acts, n);

  const brief: VisualBrief = {
    visual_theme:  typeof r.visual_theme  === "string" ? r.visual_theme  : script.topic,
    acts,
    key_moments,
    budget,
    rhythm_notes:  typeof r.rhythm_notes  === "string" ? r.rhythm_notes  : "",
  };

  console.log(
    `  ✅  Call 1b — ${acts.length} acts, ${key_moments.length} key moments, ` +
    `budget: ag=${budget.animated_graphic} sc=${budget.stat_callout} ` +
    `fb=${budget.fullbleed} td=${budget.text_dominant}`
  );

  return brief;
}
