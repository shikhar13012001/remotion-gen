// mcpUtils.ts — video-local helpers for the MCP composition

export interface TextToken {
  word: string;
  highlighted: boolean;
}

/**
 * Splits a sentence into word tokens, tagging each word that appears in
 * highlightWords. Multi-word phrases ("Model Context Protocol") are handled by
 * matching individual words after stripping punctuation.
 */
export function tokenise(text: string, highlightWords: string[]): TextToken[] {
  const highlightSet = new Set(
    highlightWords
      .flatMap((h) => h.split(/[\s\-]+/))
      .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
      .filter(Boolean),
  );

  return text.split(/\s+/).map((word) => ({
    word,
    highlighted: highlightSet.has(word.toLowerCase().replace(/[^a-z0-9]/g, "")),
  }));
}

/** Responsive font size based on word count, tuned for 1080×1920 */
export function mcpFontSize(wordCount: number): number {
  if (wordCount <= 3) return 88;
  if (wordCount <= 5) return 76;
  if (wordCount <= 8) return 64;
  if (wordCount <= 11) return 56;
  return 48;
}
