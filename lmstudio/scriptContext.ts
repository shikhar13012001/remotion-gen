import * as path from "path";
import { ACCENT_PALETTE, type AccentKey } from "./constants";
import { defaultDesignSystem, extractDesignSystem } from "./designExtractor";
import type {
  Beat,
  ScriptContextBundle,
  ScriptSpec,
  ThemePolarity,
} from "./types";

const DEFAULT_SPEC: ScriptSpec = {
  sentenceRange: [10, 16],
  wordRange: [150, 220],
  durationRangeMs: [2000, 7000],
  requiredBeats: ["hook", "turn", "reveal", "breathe", "close"],
  visualQueryWords: [3, 4],
};

const DEFAULT_BEAT_RULES: Record<Beat, string> = {
  hook: "Open with the sharpest contradiction or outcome. No setup first.",
  build: "Add one causal step at a time. Each sentence should tighten the mechanism.",
  turn: "Expose the variable that changes the system or reverses the expectation.",
  reveal: "Make the hidden relationship explicit and easy to state back.",
  breathe: "Pause with a short sentence that clarifies pressure rather than stalling.",
  close: "Reframe the opening with the consequence the viewer now understands.",
};

const DEFAULT_IMAGE_POLICY = {
  allowImagesFor: ["places", "institutions", "people", "objects", "evidence", "buildings"],
  discourageImagesFor: ["statistics", "comparisons", "mechanisms", "diagrams", "maps", "ledgers", "dashboards", "abstract concepts"],
};

const MAX_BRAND_KEYWORDS = 6;
const MAX_TONE_ITEMS = 4;
const MAX_VISUAL_PRIORITY_ITEMS = 4;
const MAX_VISUAL_NOUNS = 8;
const MAX_SOURCE_SUMMARY = 4;
const MAX_SOURCE_FACTS = 8;

export interface CompileScriptContextInput {
  topic: string;
  guideContent?: string;
  guidePath?: string;
  designContent?: string;
  designPath?: string;
}

export interface CompiledScriptContext {
  bundle: ScriptContextBundle;
  spec: ScriptSpec;
  contextTokensApprox: number;
}

function approxTokens(value: string): number {
  return Math.max(1, Math.round(value.length / 4));
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function extractSourceDigest(rawTopic: string): { title: string; summary: string[]; keyFacts: string[] } {
  const isDateLine = (line: string): boolean => /^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}$/.test(line);
  const isDecorativeLine = (line: string): boolean => /\billustration\b|\bhero\b|\bcover image\b/i.test(line);
  const lines = rawTopic
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const title = lines.find((line) => !isDateLine(line) && !isDecorativeLine(line)) ?? rawTopic.trim();
  const remainingLines = lines.filter((line) => line !== title && !isDateLine(line) && !isDecorativeLine(line));

  const bulletFacts = remainingLines
    .filter((line) => /^[-*]\s+/.test(line) || /^[A-Z][A-Za-z0-9 .,'-]{8,120}$/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, ""))
    .filter((line) => line.length >= 12 && !isDecorativeLine(line));

  const prose = remainingLines.join(" ");
  const summarySentences = prose
    .split(/(?<=[.!?])\s+/)
    .map(normalizeLine)
    .filter((sentence) => sentence.length >= 30 && sentence !== title);

  const summary = dedupe(summarySentences).slice(0, MAX_SOURCE_SUMMARY);
  const keyFacts = dedupe([...bulletFacts, ...summarySentences]).slice(0, MAX_SOURCE_FACTS);

  return {
    title,
    summary,
    keyFacts,
  };
}

function isLightHex(hex: string): boolean {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return false;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b >= 160;
}

function toThemePolarity(background: string, surface: string): ThemePolarity {
  const bgLight = isLightHex(background);
  const surfaceLight = isLightHex(surface);
  if (bgLight && surfaceLight) return "light";
  if (!bgLight && !surfaceLight) return "dark";
  return "mixed";
}

function parseCategory(guideContent?: string, guidePath?: string): string | null {
  const heading = guideContent?.match(/^#\s*Guide:\s*([^\r\n]+)/im)?.[1]?.trim();
  if (heading) return heading.toLowerCase();

  if (guidePath) {
    const parts = guidePath.replace(/\\/g, "/").split("/");
    const guidesIndex = parts.findIndex((part) => part.toLowerCase() === "guides");
    if (guidesIndex !== -1 && parts[guidesIndex + 1]) {
      return parts[guidesIndex + 1].toLowerCase();
    }
  }

  return null;
}

function parseSentenceRange(guideContent?: string): [number, number] | null {
  if (!guideContent) return null;
  const match = guideContent.match(/(\d+)\s*[-–]\s*(\d+)\s*sentence/i);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null;
  return [min, max];
}

function parseWordRange(guideContent?: string): [number, number] | null {
  if (!guideContent) return null;
  const match = guideContent.match(/(\d+)\s*[-–]\s*(\d+)\s*word/i);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null;
  return [min, max];
}

function parseTone(guideContent?: string): string[] {
  if (!guideContent) return [
    "precise",
    "explanatory",
    "research-backed",
  ];

  const identityMatch = guideContent.match(/##\s*Identity([\s\S]*?)(?:\n##\s|\n---|\Z)/i);
  const block = identityMatch?.[1] ?? guideContent;
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("*"));

  const phrases = dedupe(
    lines
      .flatMap((line) => line.split(/[.;]/))
      .flatMap((phrase) => phrase.split(","))
      .map((phrase) => phrase.replace(/[`"]/g, "").trim())
      .filter((phrase) => phrase.length >= 4),
  );

  return phrases.slice(0, MAX_TONE_ITEMS);
}

function parseVisualPriority(guideContent?: string): string[] {
  if (!guideContent) {
    return [
      "constructed visual system",
      "hybrid image with overlay",
      "text-dominant frame",
      "background treatment as last resort",
    ];
  }

  const section = guideContent.match(/##\s*Visual Priority([\s\S]*?)(?:\n##\s|\n---|\Z)/i);
  if (!section) return [];

  const lines = section[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "").trim());

  return dedupe(lines).slice(0, MAX_VISUAL_PRIORITY_ITEMS);
}

function parseBeatRules(guideContent?: string): Record<Beat, string> {
  if (!guideContent) return { ...DEFAULT_BEAT_RULES };

  const section = guideContent.match(/##\s*Scene Template Mapping([\s\S]*?)(?:\n##\s|\n---|\Z)/i);
  if (!section) return { ...DEFAULT_BEAT_RULES };

  const beatRules = { ...DEFAULT_BEAT_RULES };
  const mappingRegex = /beat\s*=\s*"([^"]+)"\s*->\s*([^\r\n]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = mappingRegex.exec(section[1])) !== null) {
    const beat = match[1].trim().toLowerCase() as Beat;
    if (beat in beatRules) {
      beatRules[beat] = match[2].trim();
    }
  }

  return beatRules;
}

function parsePreferredVisualNouns(guideContent?: string): string[] {
  if (!guideContent) {
    return ["diagram", "timeline", "flow", "ledger", "gauge"];
  }

  const nouns: string[] = [];
  const backtickRegex = /`([^`]{4,50})`/g;
  let match: RegExpExecArray | null;
  while ((match = backtickRegex.exec(guideContent)) !== null) {
    const term = match[1].trim().toLowerCase();
    if (
      !term.includes(".") &&
      !term.includes("design.") &&
      !term.includes("bg-image") &&
      !term.startsWith("#") &&
      !term.includes("->") &&
      !/^\d/.test(term)
    ) {
      nouns.push(term);
    }
  }

  const boldRegex = /\*\*([^*]{4,40})\*\*/g;
  while ((match = boldRegex.exec(guideContent)) !== null) {
    nouns.push(match[1].trim().toLowerCase());
  }

  return dedupe(nouns).slice(0, MAX_VISUAL_NOUNS);
}

function pickAccentFallback(category: string | null): string {
  if (!category) return "#c8a96e";
  const key = category as AccentKey;
  return ACCENT_PALETTE[key] ?? "#c8a96e";
}

function buildBrandKeywords(sourceName: string, brandColors: Record<string, string>): string[] {
  const generic = new Set(["design", "system", "inspired", "brand", "default"]);
  const fromName = sourceName
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= 3 && !generic.has(part));

  const fromColors = Object.keys(brandColors)
    .map((key) => key.toLowerCase())
    .filter((key) => !/gray|grey|neutral|surface|background|border|shadow|ring|text|white|black/.test(key));

  return dedupe([...fromName, ...fromColors]).slice(0, MAX_BRAND_KEYWORDS);
}

function clampRange([min, max]: [number, number], floor: number, ceiling: number): [number, number] {
  const nextMin = Math.max(floor, Math.min(min, ceiling));
  const nextMax = Math.max(nextMin, Math.min(max, ceiling));
  return [nextMin, nextMax];
}

export function compileScriptContextBundle(input: CompileScriptContextInput): CompiledScriptContext {
  const source = extractSourceDigest(input.topic);
  const category = parseCategory(input.guideContent, input.guidePath);
  const accentFallback = pickAccentFallback(category);
  const designSystem = input.designContent
    ? extractDesignSystem(input.designContent, accentFallback)
    : defaultDesignSystem(accentFallback);

  const sentenceRange = clampRange(parseSentenceRange(input.guideContent) ?? DEFAULT_SPEC.sentenceRange, 8, 22);
  const wordRange = clampRange(parseWordRange(input.guideContent) ?? DEFAULT_SPEC.wordRange, 100, 320);

  const bundle: ScriptContextBundle = {
    topic: source.title,
    source,
    design: {
      sourceName: designSystem.tokens.name || (input.designPath ? path.basename(path.dirname(input.designPath)) : "default"),
      accentColor: designSystem.tokens.accent,
      themePolarity: toThemePolarity(designSystem.tokens.background, designSystem.tokens.surface),
      fontDisplay: designSystem.tokens.fontDisplay,
      fontBody: designSystem.tokens.fontBody,
      fontMono: designSystem.tokens.fontMono,
      brandKeywords: buildBrandKeywords(designSystem.tokens.name, designSystem.tokens.brandColors),
    },
    guide: {
      category,
      tone: parseTone(input.guideContent),
      visualPriority: parseVisualPriority(input.guideContent),
      beatRules: parseBeatRules(input.guideContent),
      imagePolicy: { ...DEFAULT_IMAGE_POLICY },
      preferredVisualNouns: parsePreferredVisualNouns(input.guideContent),
      scriptConstraints: {
        targetWords: wordRange,
        targetSentences: sentenceRange,
        requiredBeats: [...DEFAULT_SPEC.requiredBeats],
      },
    },
    generationPolicy: {
      visualQueryWords: [...DEFAULT_SPEC.visualQueryWords],
      accentAuthority: "design-first",
      repairMode: "targeted",
    },
  };

  const spec: ScriptSpec = {
    sentenceRange,
    wordRange,
    durationRangeMs: [...DEFAULT_SPEC.durationRangeMs],
    requiredBeats: [...DEFAULT_SPEC.requiredBeats],
    visualQueryWords: [...DEFAULT_SPEC.visualQueryWords],
  };

  return {
    bundle,
    spec,
    contextTokensApprox: approxTokens(JSON.stringify(bundle)),
  };
}
