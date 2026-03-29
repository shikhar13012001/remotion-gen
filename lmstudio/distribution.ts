import type { SceneIntent, SceneGroup } from "./types.js";

// Minimum thresholds — must match prompt_call1_script.txt targets
const MIN_AG_RATIO = 0.30; // animated_graphic ≥30%
const MIN_TD_RATIO = 0.20; // text_dominant    ≥20%

const ANIMATE_SIGNALS = /\b\d[\d,.]+\b|compar|grew|spread|percent|ratio|timeline|over\s+time|step|caused|process|vs\.|between|from .+ to|reach|peak|rate|million|billion|thousand|killed|died|affected|nations|countries|regions/i;
const YEAR_ONLY       = /\bin\s+\d{4}\b/i;
const SHORT_SENTENCE  = 12;

/**
 * Post-Call-1 reclassification: enforces animated_graphic ≥30%, text_dominant ≥20%.
 * Aggressive because local models default to fullbleed for everything.
 */
export function enforceDistribution(intents: SceneIntent[], body: string[]): SceneIntent[] {
  const total = intents.length;
  const minAG = Math.max(2, Math.ceil(total * MIN_AG_RATIO));
  const minTD = Math.max(1, Math.ceil(total * MIN_TD_RATIO));

  let agCount = intents.filter((i) => i.scene_template === "animated_graphic").length;
  let tdCount = intents.filter((i) => i.scene_template === "text_dominant").length;

  if (agCount >= minAG && tdCount >= minTD) return intents;

  // Pass 1 — content-signal reclassification
  for (const intent of intents) {
    if (intent.scene_template !== "fullbleed") continue;
    const text = body[intent.sentence_index] ?? "";

    if (agCount < minAG && ANIMATE_SIGNALS.test(text) && !YEAR_ONLY.test(text)) {
      intent.scene_template = "animated_graphic";
      agCount++;
      continue;
    }
    if (tdCount < minTD && (text.trim().endsWith("?") || text.split(/\s+/).length < SHORT_SENTENCE)) {
      intent.scene_template = "text_dominant";
      tdCount++;
    }
  }

  // Pass 2 — any numeric sentence → animated_graphic
  for (const intent of intents) {
    if (agCount >= minAG) break;
    if (intent.scene_template !== "fullbleed") continue;
    if (/\b\d[\d,.]+\b/.test(body[intent.sentence_index] ?? "")) {
      intent.scene_template = "animated_graphic";
      agCount++;
    }
  }

  // Pass 3 — force at regular intervals if still below target
  for (let i = 0; i < intents.length && agCount < minAG; i += 2) {
    if (intents[i].scene_template === "fullbleed") {
      intents[i].scene_template = "animated_graphic";
      agCount++;
    }
  }
  for (let i = 1; i < intents.length && tdCount < minTD; i += 3) {
    if (intents[i].scene_template === "fullbleed") {
      intents[i].scene_template = "text_dominant";
      tdCount++;
    }
  }

  return intents;
}

export function groupIntentsByTemplate(scene_intents: SceneIntent[]): SceneGroup {
  const groups: SceneGroup = {
    fullbleed: [], text_dominant: [], stat_callout: [], animated_graphic: [],
  };
  for (const intent of scene_intents) {
    const key = intent.scene_template as keyof SceneGroup;
    if (key in groups) groups[key].push(intent);
    else groups.fullbleed.push(intent);
  }
  return groups;
}
