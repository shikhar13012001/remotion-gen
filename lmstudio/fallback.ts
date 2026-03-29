import type { SceneIntent } from "./types.js";

const IMAGE_MOTIONS = ["slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right"] as const;

function fallbackFullbleed(text: string, words: string[], idx: number): unknown {
  return {
    sentence_index: (JSON.parse(JSON.stringify({ n: idx }))).n, // placeholder — caller sets correct idx
    visual_query:   `${words.slice(0, 6).join(" ")} archival documentary photograph dramatic lighting`,
    image_motion:   IMAGE_MOTIONS[idx % IMAGE_MOTIONS.length],
    shot_type:      idx % 3 === 0 ? "wide" : idx % 3 === 1 ? "close_up" : "establishing",
    lighting:       "chiaroscuro",
    _text: text,
  };
}

function fallbackStatCallout(text: string): unknown {
  const numMatch = text.match(/\b([\d,]+(?:\.\d+)?)\b/);
  const val      = parseFloat(numMatch?.[1]?.replace(/,/g, "") ?? "0");
  const suffix   = /million/i.test(text) ? " million" : /billion/i.test(text) ? " billion"
    : /percent|%/i.test(text) ? "%" : /dead|died|killed/i.test(text) ? " dead" : "";
  return { stat_value: val, stat_prefix: /\$/.test(text) ? "$" : "", stat_suffix: suffix,
    entry_animation: "slam", duration_ms: 5000 };
}

function fallbackAnimatedGraphic(text: string, words: string[]): unknown {
  if (/timeline|chronolog|sequence|year|decade|century/i.test(text)) {
    const years  = text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/g) ?? [];
    const events = years.length >= 2
      ? years.map((y, i) => ({ date: y, label: words.slice(i * 2, i * 2 + 3).join(" ") || "Event" }))
      : [
          { date: "Phase 1", label: words.slice(0, 3).join(" ")  || "Start"        },
          { date: "Phase 2", label: words.slice(3, 6).join(" ")  || "Escalation"   },
          { date: "Phase 3", label: words.slice(6, 9).join(" ")  || "Turning Point" },
          { date: "Phase 4", label: words.slice(9, 12).join(" ") || "Resolution"   },
        ];
    return { animation_type: "timeline", entry_animation: "build_in", duration_ms: 6000,
      animation_data: { events, direction: "horizontal" } };
  }

  if (/spread|countr|nation|region|world|global|continent/i.test(text)) {
    return { animation_type: "map_spread", entry_animation: "build_in", duration_ms: 5000,
      animation_data: { highlight_countries: ["USA","GBR","FRA","DEU","RUS","CHN"], spread_order: true } };
  }

  if (/percent|%|rate|survival|mortality|share|proportion/i.test(text)) {
    const m   = text.match(/\b(\d{1,3}(?:\.\d+)?)\b/);
    const val = m ? parseFloat(m[1]) : 50;
    return { animation_type: "percentage_fill", entry_animation: "build_in", duration_ms: 5000,
      animation_data: { value: Math.min(val, 100), label: words.slice(0, 5).join(" "), style: "circle" } };
  }

  if (/\b\d[\d,.]+\b/.test(text) && !/\bin\s+\d{4}\b/i.test(text)) {
    const m   = text.match(/\b([\d,]+)\b/);
    const val = parseFloat(m?.[1]?.replace(/,/g, "") ?? "1000");
    return { animation_type: "counter", entry_animation: "slam", duration_ms: 4000,
      animation_data: { value: val, suffix: /dead|died|killed/i.test(text) ? " dead" : "" } };
  }

  const nodes = text.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 3).slice(0, 5);
  if (nodes.length < 3) nodes.push("Impact", "Consequence", "Legacy");
  return { animation_type: "flow_diagram", entry_animation: "build_in", duration_ms: 6000,
    animation_data: { nodes, style: "arrow_chain" } };
}

/**
 * Rich fallback directives when Call 2 returns empty results.
 * Content-aware — picks animation type and populates data from sentence signals.
 */
export function generateFallbackDirectives(
  group: string, intents: SceneIntent[], body: string[]
): { directives: unknown[] } {
  const directives = intents.map((intent, idx) => {
    const text  = body[intent.sentence_index] ?? "";
    const words = text.split(/\s+/);
    const base  = { sentence_index: intent.sentence_index };

    if (group === "fullbleed") {
      return Object.assign({}, base, fallbackFullbleed(text, words, idx) as object);
    }
    if (group === "stat_callout") {
      return Object.assign({}, base, fallbackStatCallout(text) as object);
    }
    if (group === "animated_graphic") {
      return Object.assign({}, base, fallbackAnimatedGraphic(text, words) as object);
    }
    return base;
  });

  return { directives };
}
