const QUERY_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

const DEFAULT_MIN_WORDS = 3;
const DEFAULT_MAX_WORDS = 4;

function extractTokens(input: string): string[] {
  return input.match(/[A-Za-z0-9][A-Za-z0-9'.-]*/g) ?? [];
}

function normalizeToken(token: string): string {
  return token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
}

export function countVisualQueryWords(query: string | null | undefined): number {
  if (!query) return 0;
  return extractTokens(query).length;
}

export function isValidVisualQuery(query: string | null | undefined): boolean {
  const count = countVisualQueryWords(query);
  return count >= DEFAULT_MIN_WORDS && count <= DEFAULT_MAX_WORDS;
}

export function compactVisualQuery(
  input: string | null | undefined,
  options: { minWords?: number; maxWords?: number } = {},
): string | null {
  if (!input) return null;

  const minWords = options.minWords ?? DEFAULT_MIN_WORDS;
  const maxWords = options.maxWords ?? DEFAULT_MAX_WORDS;
  const rawTokens = extractTokens(input);
  if (rawTokens.length === 0) return null;

  const prioritized: string[] = [];
  const fallback: string[] = [];
  const seen = new Set<string>();

  for (const rawToken of rawTokens) {
    const token = normalizeToken(rawToken);
    if (!token) continue;

    const dedupeKey = token.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    if (QUERY_STOPWORDS.has(dedupeKey)) {
      fallback.push(token);
      continue;
    }

    prioritized.push(token);
  }

  const words = [...prioritized];
  for (const token of fallback) {
    if (words.length >= minWords) break;
    words.push(token);
  }

  if (words.length < minWords) return null;
  return words.slice(0, maxWords).join(" ");
}

export function topicToVisualQuery(topic: string): string {
  return compactVisualQuery(topic) ?? "editorial reference image";
}
