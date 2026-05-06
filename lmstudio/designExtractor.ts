/**
 * designExtractor.ts
 *
 * Parses a DESIGN.md file → concrete design constants usable in video compositions.
 *
 * Supports two DESIGN.md formats in this project:
 *   1. YAML-frontmatter style  (Claude, Airbnb, Clay, Cohere, …)
 *      colors:\n  key: "#hex"\n  typography:\n  display-xl:\n    fontFamily: "…"
 *
 *   2. Prose-markdown style    (Vercel, Stripe, Wired, …)
 *      **Label** (`#hex`): description text
 *      font references in prose or tables
 *
 * Exports (all pure functions — no side effects, no file I/O):
 *   extractDesignSystem()       — main entry, returns DesignSystem
 *   defaultDesignSystem()       — fallback constants for "no design file" case
 *   buildDesignConstantsBlock() — const DESIGN = {...} TypeScript string for prompts
 *   toTokensSnapshot()          — JSON-serialisable snapshot for Root.tsx
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DesignTypographyScale {
  fontFamily:    string;
  fontSize:      string;  // always "NNpx"
  fontWeight:    number;
  lineHeight:    number;
  letterSpacing: string;
}

export interface DesignTokens {
  name: string;

  // Semantic video surfaces. These are theme-neutral; guides decide whether
  // a scene should read light, dark, editorial, clinical, or photographic.
  background: string;   // base canvas
  surface:    string;   // elevated or alternate canvas
  textOn:     string;   // primary text on the chosen canvas
  textMuted:  string;   // secondary / muted text

  // Accent — the video's identity color (always the caller-supplied accentColor)
  accent:     string;
  accentDim:  string;   // accent @ 60% opacity  rgba(r,g,b,0.6)
  accentGlow: string;   // accent @ 15% opacity  rgba(r,g,b,0.15)

  // Borders
  border: string;

  // Fonts — exact family strings from the design system
  fontDisplay: string;
  fontBody:    string;
  fontMono:    string;

  // Raw brand colors (for reference / brand block in prompts)
  brandColors: Record<string, string>;
}

export interface DesignSystem {
  tokens: DesignTokens;
  scales: {
    display:  DesignTypographyScale;  // ~72px  headlines
    body:     DesignTypographyScale;  // ~38px  narration
    caption:  DesignTypographyScale;  // ~22px  labels
    stat:     DesignTypographyScale;  // ~140px stat numbers
  };
}

/** Serialisable snapshot — written to data/output/design_tokens.json and read by Root.tsx */
export interface TokensSnapshot {
  name:        string;
  background:  string;
  surface:     string;
  textOn:      string;
  textMuted:   string;
  accent:      string;
  border:      string;
  fontDisplay: string;
  fontBody:    string;
  fontMono:    string;
  brandColors: Record<string, string>;
}

// ─── YAML-frontmatter parser ──────────────────────────────────────────────────

function parseYamlColors(content: string): Record<string, string> {
  const colors: Record<string, string> = {};
  // Match the `colors:` block up to the next top-level key or EOF
  const section = content.match(/^colors:\n((?:[ \t]+[^\n]*\n?)*)/m);
  if (!section) return colors;
  for (const line of section[1].split("\n")) {
    const m = line.match(/^[ \t]+([\w-]+):\s*["']?(#[0-9a-fA-F]{3,6}|rgb[^'"]+|hsl[^'"]+)["']?/);
    if (m) colors[m[1].trim()] = m[2].trim();
  }
  return colors;
}

interface RawScale {
  fontFamily?:    string;
  fontSize?:      string;
  fontWeight?:    number;
  lineHeight?:    number;
  letterSpacing?: string;
}

function parseYamlTypography(content: string): Record<string, RawScale> {
  const result: Record<string, RawScale> = {};
  const section = content.match(/^typography:\n((?:[ \t]+[^\n]*\n?)*)/m);
  if (!section) return result;

  const lines = section[1].split("\n");
  let currentKey = "";
  let current: Record<string, string> = {};

  const flush = () => {
    if (!currentKey) return;
    result[currentKey] = {
      fontFamily:    current.fontFamily ? stripQuotes(current.fontFamily) : undefined,
      fontSize:      current.fontSize   ? ensurePx(current.fontSize)      : undefined,
      fontWeight:    current.fontWeight ? parseFloat(current.fontWeight)  : undefined,
      lineHeight:    current.lineHeight ? parseFloat(current.lineHeight)  : undefined,
      letterSpacing: current.letterSpacing ? ensurePx(current.letterSpacing) : undefined,
    };
  };

  for (const line of lines) {
    // Top-level key (2-space indent): `  display-xl:`
    const topKey = line.match(/^  ([\w-]+):\s*$/);
    if (topKey) { flush(); currentKey = topKey[1]; current = {}; continue; }
    // Nested property (4-space indent): `    fontFamily: "…"`
    const prop = line.match(/^    (\w+):\s*(.+)$/);
    if (prop && currentKey) current[prop[1]] = prop[2].trim();
  }
  flush();
  return result;
}

// ─── Markdown-prose parser ────────────────────────────────────────────────────

function parseMarkdownColors(content: string): Record<string, string> {
  const colors: Record<string, string> = {};

  // Pattern: **Label** (`#hex`) or **Label** (#hex)
  const boldBacktick = /\*\*([^*]+)\*\*\s*\([`']?(#[0-9a-fA-F]{3,6})[`']?\)/g;
  let m: RegExpExecArray | null;
  while ((m = boldBacktick.exec(content)) !== null) {
    const key = labelToKey(m[1]);
    if (key && !colors[key]) colors[key] = m[2];
  }

  // Pattern: `#hex` anywhere — paired with the nearest preceding bold label on same line
  const lineWithHex = /^.*\*\*([^*]+)\*\*.*[`(](#[0-9a-fA-F]{3,6})[`)]/gm;
  while ((m = lineWithHex.exec(content)) !== null) {
    const key = labelToKey(m[1]);
    if (key && !colors[key]) colors[key] = m[2];
  }

  return colors;
}

function parseMarkdownFonts(content: string): { display?: string; body?: string; mono?: string } {
  const result: { display?: string; body?: string; mono?: string } = {};

  const invalid = /^(liga|swap|auto|normal|inherit|initial|block|optional|fallback|tight|relaxed)$/i;
  const isValidFont = (value: string): boolean => {
    return !invalid.test(value) &&
      /^[A-Za-z0-9][A-Za-z0-9 -]{1,40}$/.test(value) &&
      !/[.:]/.test(value);
  };

  const assignIfValid = (slot: "display" | "body" | "mono", value: string | undefined): void => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed || !isValidFont(trimmed)) return;
    if (!result[slot]) result[slot] = trimmed;
  };

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const inlineMatch = line.match(/[`'"]([A-Za-z0-9][A-Za-z0-9 -]{1,40})[`'"]/);
    const tableParts = line.startsWith("|") ? line.split("|").map((part) => part.trim()) : [];
    const tableFont = tableParts.length > 2 ? tableParts[2] : undefined;

    if (/Primary|Display|Heading|Font Family/i.test(line)) {
      assignIfValid("display", inlineMatch?.[1] ?? tableFont);
    }
    if (/(?:^|\b)(Body|Sans|Regular)(?:\b|$)/i.test(line) && !/Mono|Monospace|Code/i.test(line)) {
      assignIfValid("body", inlineMatch?.[1] ?? tableFont);
    }
    if (/Mono|Code|Monospace/i.test(line)) {
      assignIfValid("mono", inlineMatch?.[1] ?? tableFont);
    }
  }

  return result;
}

// ─── Colour utilities ─────────────────────────────────────────────────────────

function luminance(hex: string): number {
  const m = hex.match(/^#([0-9a-f]{3,6})/i);
  if (!m) return 0.5;
  const full = m[1].length === 3
    ? m[1].split("").map(c => c + c).join("")
    : m[1];
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-fA-F]{6})/);
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Find the color value whose key best matches one of the candidate key-substrings. */
function findByKey(
  colors: Record<string, string>,
  candidates: string[],
): string | undefined {
  for (const c of candidates) {
    const exact = Object.keys(colors).find(k => k === c);
    if (exact) return colors[exact];
    const hit = Object.keys(colors).find(k => k.includes(c));
    if (hit) return colors[hit];
  }
  return undefined;
}

/** Find the darkest hex in the color map. */
function darkest(colors: Record<string, string>): string {
  const entries = Object.entries(colors).filter(([, v]) => v.startsWith("#"));
  if (!entries.length) return "#0d0d0d";
  return entries.sort(([, a], [, b]) => luminance(a) - luminance(b))[0][1];
}

/** Find the lightest hex in the color map. */
function lightest(colors: Record<string, string>): string {
  const entries = Object.entries(colors).filter(([, v]) => v.startsWith("#"));
  if (!entries.length) return "#f0f0f0";
  return entries.sort(([, a], [, b]) => luminance(b) - luminance(a))[0][1];
}

// ─── Semantic color resolution ────────────────────────────────────────────────

function isLightColor(color: string | undefined): boolean {
  return Boolean(color?.startsWith("#")) && luminance(color!) >= 0.72;
}

function isDarkColor(color: string | undefined): boolean {
  return Boolean(color?.startsWith("#")) && luminance(color!) <= 0.28;
}

function resolveAccent(colors: Record<string, string>, fallbackAccent: string): string {
  return (
    findByKey(colors, ["primary", "brand", "accent"]) ??
    fallbackAccent
  );
}

function resolveBackground(colors: Record<string, string>): string {
  const explicitDark = findByKey(colors, ["dark-bg", "bg-dark", "canvas-dark", "background-dark"]);
  if (explicitDark) return explicitDark;

  const explicitCanvas =
    findByKey(colors, ["pure-white", "white", "canvas", "page-bg", "surface-light", "page-background"]) ??
    findByKey(colors, ["surface-card", "surface-soft"]);
  if (isLightColor(explicitCanvas)) return explicitCanvas!;

  return (
    findByKey(colors, ["gray-900", "gray-950", "neutral-900", "slate-900"]) ??
    findByKey(colors, ["ink", "black-1", "true-black"]) ??
    darkest(colors)
  );
}

function resolveSurface(colors: Record<string, string>, background: string): string {
  if (isLightColor(background)) {
    return (
      findByKey(colors, ["surface-card", "surface-soft", "surface-strong", "canvas"]) ??
      "#ffffff"
    );
  }

  return (
    findByKey(colors, ["surface-dark-elevated", "elevated", "surface-dark-soft", "surface-raised"]) ??
    findByKey(colors, ["gray-800", "neutral-800", "slate-800"]) ??
    findByKey(colors, ["surface-dark"]) ??
    "#1a1a1a"
  );
}

function resolveTextOn(colors: Record<string, string>, background: string): string {
  if (isLightColor(background)) {
    return (
      findByKey(colors, ["gray-900", "neutral-900", "slate-900", "vercel-black", "ink", "black-1"]) ??
      findByKey(colors, ["body", "text"]) ??
      darkest(colors)
    );
  }

  return (
    findByKey(colors, ["on-dark", "text-on-dark", "on-primary-dark", "on-canvas"]) ??
    findByKey(colors, ["canvas", "white", "pure-white", "text-white"]) ??
    lightest(colors)
  );
}

function resolveTextMuted(colors: Record<string, string>, background: string): string {
  if (isLightColor(background)) {
    return (
      findByKey(colors, ["gray-600", "gray-500", "muted", "body", "muted-soft"]) ??
      "#6a6a6a"
    );
  }

  return (
    findByKey(colors, ["on-dark-soft", "muted-dark", "text-muted-dark", "dim"]) ??
    findByKey(colors, ["muted-soft", "muted", "body"]) ??
    "rgba(255,255,255,0.55)"
  );
}

function resolveBorder(colors: Record<string, string>, background: string): string {
  if (isLightColor(background)) {
    return (
      findByKey(colors, ["gray-100", "border", "divider", "ring-border"]) ??
      "rgba(0,0,0,0.08)"
    );
  }

  const hit = findByKey(colors, ["hairline", "hairline-soft", "border", "divider"]);
  if (hit && isDarkColor(background) && luminance(hit) > 0.5) {
    // The design's border is light - reinterpret as low-opacity for dark video
    return hexToRgba(hit, 0.12);
  }
  return hit ?? "rgba(255,255,255,0.08)";
}

// ─── Font resolution ──────────────────────────────────────────────────────────

function resolveDisplayFont(typo: Record<string, RawScale>, mdFonts: { display?: string }): string {
  // YAML: look for display-xl, display-lg, heading-xl, h1
  const keys = ["display-xl", "display-lg", "display-md", "heading-xl", "h1"];
  for (const k of keys) {
    if (typo[k]?.fontFamily) return typo[k].fontFamily!;
  }
  if (mdFonts.display) return mdFonts.display;
  // Use first available font family in the typo map
  const first = Object.values(typo).find(t => t.fontFamily);
  return first?.fontFamily ?? "Georgia, 'Times New Roman', serif";
}

function resolveBodyFont(typo: Record<string, RawScale>, mdFonts: { body?: string; display?: string }): string {
  const keys = ["body-md", "body", "body-lg", "text-md", "text", "title-lg", "label"];
  for (const k of keys) {
    if (typo[k]?.fontFamily) return typo[k].fontFamily!;
  }
  if (mdFonts.body) return mdFonts.body;
  if (mdFonts.display) return mdFonts.display;
  return "'Helvetica Neue', Arial, sans-serif";
}

function resolveMonoFont(typo: Record<string, RawScale>, mdFonts: { mono?: string }): string {
  const keys = ["mono", "code", "mono-sm", "caption-uppercase"];
  for (const k of keys) {
    if (typo[k]?.fontFamily) return typo[k].fontFamily!;
  }
  if (mdFonts.mono) return `'${mdFonts.mono}', monospace`;
  return "'JetBrains Mono', 'Courier New', monospace";
}

// ─── Typography scale resolution ─────────────────────────────────────────────

/**
 * Resolve a typographic scale from the design, adapted to video dimensions.
 * videoTargetPx: the ideal px size for 1080×1920 video.
 * Uses the design's proportions (weight, lineHeight, letterSpacing) but
 * remaps the size to the video target range.
 */
function resolveVideoScale(
  typo: Record<string, RawScale>,
  preferredKeys: string[],
  fontFamily: string,
  videoTargetPx: number,
  fallbackWeight: number,
): DesignTypographyScale {
  let found: RawScale | undefined;
  for (const k of preferredKeys) {
    if (typo[k]) { found = typo[k]; break; }
  }
  return {
    fontFamily,
    fontSize:      `${videoTargetPx}px`,
    fontWeight:    found?.fontWeight ?? fallbackWeight,
    lineHeight:    found?.lineHeight ?? (videoTargetPx >= 60 ? 1.05 : 1.45),
    letterSpacing: found?.letterSpacing ?? (videoTargetPx >= 60 ? "-0.025em" : "0"),
  };
}

// ─── String utilities ─────────────────────────────────────────────────────────

function stripQuotes(s: string): string {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function ensurePx(v: string): string {
  v = v.trim();
  if (/^-?[\d.]+$/.test(v)) return `${v}px`;
  return v;
}

function labelToKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 50);
}

function extractName(content: string): string {
  const frontmatter = content.match(/^name:\s*(.+)/m);
  if (frontmatter) return frontmatter[1].trim();
  const heading = content.match(/^#\s+(?:Design System.*?for\s+|)([^\n]+)/m);
  if (heading) return heading[1].replace(/^Design System.*?for\s+/i, "").trim();
  return "Brand";
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parse a DESIGN.md file and return a fully-resolved DesignSystem.
 * accentColor: the video's chosen accent (always overrides the design's primary).
 */
export function extractDesignSystem(content: string, accentColor: string): DesignSystem {
  const isYaml = /^colors:\n/m.test(content);

  const colors: Record<string, string> = isYaml
    ? parseYamlColors(content)
    : parseMarkdownColors(content);

  const typo: Record<string, RawScale> = isYaml
    ? parseYamlTypography(content)
    : {};

  const mdFonts = isYaml ? {} : parseMarkdownFonts(content);

  const name        = extractName(content);
  const background  = resolveBackground(colors);
  const surface     = resolveSurface(colors, background);
  const textOn      = resolveTextOn(colors, background);
  const textMuted   = resolveTextMuted(colors, background);
  const border      = resolveBorder(colors, background);
  const accent      = resolveAccent(colors, accentColor);
  const fontDisplay = resolveDisplayFont(typo, mdFonts);
  const fontBody    = resolveBodyFont(typo, mdFonts);
  const fontMono    = resolveMonoFont(typo, mdFonts);

  const tokens: DesignTokens = {
    name,
    background,
    surface,
    textOn,
    textMuted,
    accent,
    accentDim:  hexToRgba(accent, 0.6),
    accentGlow: hexToRgba(accent, 0.15),
    border,
    fontDisplay,
    fontBody,
    fontMono,
    brandColors: colors,
  };

  const scales = {
    display: resolveVideoScale(typo, ["display-xl", "display-lg", "heading-xl", "h1"], fontDisplay, 72, 700),
    body:    resolveVideoScale(typo, ["body-md", "body", "body-lg", "text-md"], fontBody, 38, 400),
    caption: resolveVideoScale(typo, ["caption", "label", "caption-uppercase", "body-sm"], fontBody, 22, 400),
    stat:    { fontFamily: fontDisplay, fontSize: "140px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em" },
  };

  return { tokens, scales };
}

/** Fallback when no DESIGN.md is provided. */
export function defaultDesignSystem(accentColor: string): DesignSystem {
  return {
    tokens: {
      name:        "Default",
      background:  "#0d0d0d",
      surface:     "#1a1a1a",
      textOn:      "#f0f0f0",
      textMuted:   "rgba(255,255,255,0.55)",
      accent:      accentColor,
      accentDim:   hexToRgba(accentColor, 0.6),
      accentGlow:  hexToRgba(accentColor, 0.15),
      border:      "rgba(255,255,255,0.08)",
      fontDisplay: "Georgia, 'Times New Roman', serif",
      fontBody:    "'Helvetica Neue', Arial, sans-serif",
      fontMono:    "'Courier New', monospace",
      brandColors: {},
    },
    scales: {
      display: { fontFamily: "Georgia, serif",           fontSize: "72px",  fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.025em" },
      body:    { fontFamily: "'Helvetica Neue', sans-serif", fontSize: "38px",  fontWeight: 400, lineHeight: 1.45, letterSpacing: "0" },
      caption: { fontFamily: "'Helvetica Neue', sans-serif", fontSize: "22px",  fontWeight: 400, lineHeight: 1.4,  letterSpacing: "0.02em" },
      stat:    { fontFamily: "Georgia, serif",           fontSize: "140px", fontWeight: 700, lineHeight: 1,    letterSpacing: "-0.04em" },
    },
  };
}

// ─── Handoff prompt helpers ───────────────────────────────────────────────────

/**
 * Generate a const DESIGN = {...} TypeScript block for inlining into the handoff prompt.
 * Agents must use DESIGN.* verbatim — no guessing, no hex literals.
 */
export function buildDesignConstantsBlock(ds: DesignSystem): string {
  const { tokens: t, scales: s } = ds;

  // Emit top-8 brand colors for agent reference (not for direct use in code)
  const brandSample = Object.entries(t.brandColors)
    .filter(([k]) => k.length < 40 && !k.includes("shadow") && !k.includes("ring"))
    .slice(0, 10)
    .map(([k, v]) => `    "${k}": "${v}",`)
    .join("\n");

  return `\`\`\`typescript
// ── DESIGN CONSTANTS ── extracted from ${t.name} design system ──────────────────
// Use DESIGN.* for ALL colors, fonts, and sizes. Never hardcode hex values or px strings.
const DESIGN = {
  // Surfaces (theme-neutral video canvas)
  bg:         "${t.background}",
  surface:    "${t.surface}",
  scrim:      "rgba(0,0,0,0.55)",     // text scrim over images

  // Text
  textOn:     "${t.textOn}",          // primary text
  textMuted:  "${t.textMuted}",       // secondary / muted text

  // Accent — the video's single identity color
  accent:     "${t.accent}",
  accentDim:  "${t.accentDim}",       // accent @ 60% — secondary labels, axis lines
  accentGlow: "${t.accentGlow}",      // accent @ 15% — radial glow effect

  // Borders / grid
  border:     "${t.border}",
  grid:       "rgba(255,255,255,0.06)",  // data visualization grid lines; adjust with DESIGN.* if using a light canvas

  // Fonts — load exactly these, do not substitute
  fontDisplay: "${t.fontDisplay}",
  fontBody:    "${t.fontBody}",
  fontMono:    "${t.fontMono}",

  // Typography scales — adapted for 1080×1920 video
  display: { fontSize: "${s.display.fontSize}", fontWeight: ${s.display.fontWeight}, lineHeight: ${s.display.lineHeight}, letterSpacing: "${s.display.letterSpacing}" },
  body:    { fontSize: "${s.body.fontSize}",    fontWeight: ${s.body.fontWeight},    lineHeight: ${s.body.lineHeight},    letterSpacing: "${s.body.letterSpacing}" },
  caption: { fontSize: "${s.caption.fontSize}", fontWeight: ${s.caption.fontWeight}, lineHeight: ${s.caption.lineHeight}, letterSpacing: "${s.caption.letterSpacing ?? "0"}" },
  stat:    { fontSize: "${s.stat.fontSize}",    fontWeight: ${s.stat.fontWeight},    lineHeight: ${s.stat.lineHeight},    letterSpacing: "${s.stat.letterSpacing}" },

  // Brand color reference (use semantic keys above in code, not these directly)
  brand: {
${brandSample}
  },
} as const;
\`\`\``;
}

/**
 * Serialisable snapshot for Root.tsx — written to data/output/design_tokens.json.
 */
export function toTokensSnapshot(ds: DesignSystem): TokensSnapshot {
  const t = ds.tokens;
  return {
    name:        t.name,
    background:  t.background,
    surface:     t.surface,
    textOn:      t.textOn,
    textMuted:   t.textMuted,
    accent:      t.accent,
    border:      t.border,
    fontDisplay: t.fontDisplay,
    fontBody:    t.fontBody,
    fontMono:    t.fontMono,
    brandColors: t.brandColors,
  };
}
