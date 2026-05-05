// ─── Validation helpers for Call 2 output ─────────────────────────────────────

import type { ScriptPackage, SentenceVisualDirective, TemplateData } from "./types";
import { isValidVisualQuery } from "./visualQuery";

const STOPWORDS = new Set([
  "the", "a", "an", "is", "was", "were", "in", "on", "at", "to",
  "of", "and", "but", "or", "for", "nor", "so", "yet", "both",
  "it", "its", "this", "that", "these", "those", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "than", "then",
  "he", "she", "they", "we", "you", "his", "her", "their", "our",
]);

/** Filter accent words to only those verbatim in the sentence. Auto-selects fallback. */
export function validateAccentWords(words: string[], sentenceText: string): string[] {
  const lower = sentenceText.toLowerCase();
  const valid = words.filter(w => w && lower.includes(w.toLowerCase()));
  if (valid.length > 0) return valid.slice(0, 3);

  // Auto-select: longest non-stopword in sentence
  const tokens = sentenceText.match(/\b[a-zA-Z]+\b/g) ?? [];
  const best   = tokens
    .filter(t => !STOPWORDS.has(t.toLowerCase()) && t.length > 3)
    .sort((a, b) => b.length - a.length);
  return best.length > 0 ? [best[0]] : [tokens[0] ?? ""];
}

/** Returns false if image_query is not a compact 3-4 word visual search query. */
export function validateImageQuery(query: string | undefined): boolean {
  return isValidVisualQuery(query);
}

/** Build a safe text_dominant directive when a sentence fails Zod validation. */
export function buildTextDominantFallback(
  sentenceIndex: number,
  sentenceText:  string,
): SentenceVisualDirective {
  // Split sentence into visual lines (max 6 words per line)
  const words  = sentenceText.split(" ");
  const lines: string[] = [];
  let chunk: string[] = [];
  for (const w of words) {
    chunk.push(w);
    if (chunk.length >= 6) { lines.push(chunk.join(" ")); chunk = []; }
  }
  if (chunk.length > 0) lines.push(chunk.join(" "));

  const templateData: TemplateData = { type: "text_dominant", lines: lines.slice(0, 3) };

  return {
    sentence_index: sentenceIndex,
    sentence:       sentenceText,
    // timing comes from ElevenLabs only — see computeSentenceDurations
    scene_template: "text_dominant",
    text_treatment: {
      accent_words: validateAccentWords([], sentenceText),
      animation:    "word_by_word",
    },
    template_data:  templateData,
    transition_out: "hard_cut",
  };
}

/** Log distribution bar chart to console. Warns if text_dominant > 35%. */
export function logDistribution(
  directives: SentenceVisualDirective[],
  label = "Template Distribution"
): void {
  const total = directives.length;
  if (total === 0) return;

  const counts: Record<string, number> = {};
  for (const d of directives) {
    counts[d.scene_template] = (counts[d.scene_template] ?? 0) + 1;
  }

  console.log(`\n[VISUAL DIRECTOR] ${label}:`);
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  for (const [template, count] of sorted) {
    const pct  = Math.round((count / total) * 100);
    const bar  = "█".repeat(Math.floor(pct / 5));
    const warn =
      template === "text_dominant" && pct > 35 ? " ⚠️  TOO HIGH" : "";
    console.log(
      `  ${template.padEnd(22)} ${bar.padEnd(20)} ${count}/${total} (${pct}%)${warn}`
    );
  }
  console.log("");
}

/** Validate and clean a single directive. Returns corrected directive or fallback. */
export function sanitizeDirective(
  raw: unknown,
  script: ScriptPackage,
  idx: number
): SentenceVisualDirective {
  const sentence = script.sentences[idx];
  if (!sentence) {
    return buildTextDominantFallback(idx + 1, "");
  }

  if (!raw || typeof raw !== "object") {
    console.warn(`  [validate] Sentence ${idx + 1}: not an object — using text_dominant fallback`);
    return buildTextDominantFallback(sentence.index, sentence.text);
  }

  const d = raw as Record<string, unknown>;

  // Ensure sentence text matches
  if (typeof d.sentence !== "string" || d.sentence !== sentence.text) {
    d.sentence = sentence.text;
  }

  // Clean accent words
  const rawWords = Array.isArray(d.text_treatment)
    ? []
    : Array.isArray((d.text_treatment as Record<string, unknown>)?.accent_words)
      ? ((d.text_treatment as Record<string, unknown>).accent_words as string[])
      : [];
  const cleanWords = validateAccentWords(rawWords, sentence.text);

  if (!d.text_treatment || typeof d.text_treatment !== "object") {
    d.text_treatment = { accent_words: cleanWords, animation: "word_by_word" };
  } else {
    (d.text_treatment as Record<string, unknown>).accent_words = cleanWords;
  }

  // Validate image queries on image-dependent templates
  const td = d.template_data as Record<string, unknown> | undefined;
  const isFullbleed = (typeof d.scene_template === "string" ? d.scene_template : "") === "fullbleed";
  if (isFullbleed) {
    const query = td?.image_query as string | undefined;
    // "bg-image.png" is the canonical sentinel for the local background asset — always valid
    const isLocalAsset = query === "bg-image.png" || (typeof query === "string" && query.startsWith("local:"));
    if (!isLocalAsset && !validateImageQuery(query)) {
      console.warn(`  [validate] Sentence ${idx + 1}: fullbleed image_query invalid — using bg-image.png`);
      // Patch rather than downgrade: keep fullbleed, use local asset
      if (td) td.image_query = "bg-image.png";
    }
  }

  // Ensure transition_out has a value
  if (d.transition_out !== "hard_cut" && d.transition_out !== "crossfade") {
    d.transition_out = "hard_cut";
  }

  // timing comes from ElevenLabs only — see computeSentenceDurations
  delete (d as Record<string, unknown>)["duration_ms"];

  return d as unknown as SentenceVisualDirective;
}

/** Validate and clean all directives. Length-aligns to script.sentences. */
export function validateDirectivesArray(
  raw: unknown[],
  script: ScriptPackage
): SentenceVisualDirective[] {
  const result: SentenceVisualDirective[] = [];

  for (let i = 0; i < script.sentences.length; i++) {
    const rawItem = raw[i];
    try {
      result.push(sanitizeDirective(rawItem, script, i));
    } catch (err) {
      console.warn(`  [validate] Sentence ${i + 1}: exception — using fallback`, err);
      result.push(buildTextDominantFallback(
        script.sentences[i].index,
        script.sentences[i].text,
      ));
    }
  }

  return result;
}
