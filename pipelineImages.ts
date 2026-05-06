import * as fs from "fs";
import * as path from "path";
import type { ScriptSentence, VideoSpec } from "./lmstudio/types";
import { slugFromTopic } from "./lmstudio/handoffPrompt";
import { compactVisualQuery, topicToVisualQuery } from "./lmstudio/visualQuery";

const MANIFEST_FILENAME = "image_manifest.json";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];
const PINTEREST_IMAGE_PATTERN = /https:\/\/i\.pinimg\.com\/[^"'\\\s<>]+/gi;
const DUCKDUCKGO_RESULT_PATTERN = /result__a" href="([^"]+)"/gi;

export interface ImageManifestEntry {
  kind: "background" | "sentence";
  sentenceIndex: number | null;
  originalQuery: string;
  query: string;
  assetIndex: number;
  relativePath: string;
  provider: string;
  sourceUrl: string;
  mediaUrl: string;
}

export interface ImageManifestQueryAsset {
  assetIndex: number;
  relativePath: string;
  provider: string;
  sourceUrl: string;
  mediaUrl: string;
}

export interface ImageManifestQuerySet {
  originalQuery: string;
  query: string;
  assets: ImageManifestQueryAsset[];
}

export interface ImageManifest {
  topic: string;
  slug: string;
  generatedAt: string;
  background: string | null;
  backgroundQuery: string | null;
  entries: ImageManifestEntry[];
  queryAssets: ImageManifestQuerySet[];
  resolvedImages: (string | null)[];
}

interface PinterestCandidate {
  provider: string;
  sourceUrl: string;
  mediaUrl: string;
}

interface SearchProvider {
  readonly name: string;
  isEnabled(): boolean;
  search(query: string): Promise<PinterestCandidate[]>;
  dispose?(): Promise<void>;
}

interface QueryAssetSet {
  originalQuery: string;
  query: string;
  assets: ImageManifestQueryAsset[];
}

interface RenderedPinCandidate {
  url: string;
  pin_url: string | null;
}

type PlaywrightModule = typeof import("playwright");
type PlaywrightBrowser = Awaited<ReturnType<PlaywrightModule["chromium"]["launch"]>>;

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function buildEmptyManifest(spec: VideoSpec): ImageManifest {
  return {
    topic: spec.topic,
    slug: slugFromTopic(spec.topic),
    generatedAt: new Date().toISOString(),
    background: null,
    backgroundQuery: null,
    entries: [],
    queryAssets: [],
    resolvedImages: spec.sentences.map(() => null),
  };
}

function extensionFromUrl(url: string): string | null {
  const pathname = new URL(url).pathname.toLowerCase();
  for (const ext of [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]) {
    if (pathname.endsWith(ext)) return ext;
  }
  return null;
}

function extensionFromContentType(contentType: string | null): string {
  const normalized = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "video/mp4") return ".mp4";
  if (normalized === "video/webm") return ".webm";
  if (normalized === "video/quicktime") return ".mov";
  return ".jpg";
}

function isVideoAsset(relativePath: string): boolean {
  const ext = path.extname(relativePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

function chooseBestCandidate(urls: string[]): string[] {
  const deduped = Array.from(new Set(urls));
  const score = (url: string): number => {
    if (url.includes("/originals/")) return 5;
    if (url.includes("/1200x/")) return 4;
    if (url.includes("/736x/")) return 3;
    if (url.includes("/564x/")) return 2;
    if (url.includes("/474x/")) return 1;
    return 0;
  };
  return deduped.sort((a, b) => score(b) - score(a));
}

function decodeDuckDuckGoResult(rawHref: string): string | null {
  const absolute = rawHref.startsWith("//") ? `https:${rawHref}` : rawHref;
  try {
    const url = new URL(absolute);
    const encoded = url.searchParams.get("uddg");
    const resolved = encoded ? decodeURIComponent(encoded) : absolute;
    return resolved.includes("pinterest.com") ? resolved : null;
  } catch {
    return null;
  }
}

function extractDuckDuckGoPinterestLinks(html: string): string[] {
  const links = Array.from(html.matchAll(DUCKDUCKGO_RESULT_PATTERN))
    .map((match) => decodeDuckDuckGoResult(match[1]))
    .filter((value): value is string => Boolean(value))
    .filter((value) => value.includes("pinterest.com") && !value.includes("duckduckgo.com/y.js"));

  return Array.from(new Set(links));
}

function extractCandidateUrls(payload: unknown): string[] {
  const matches = new Set<string>();

  const visit = (value: unknown): void => {
    if (!value) return;
    if (typeof value === "string") {
      for (const match of value.matchAll(PINTEREST_IMAGE_PATTERN)) {
        matches.add(match[0].replace(/\\u002F/g, "/"));
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };

  visit(payload);
  return chooseBestCandidate([...matches]);
}

function extractPinterestPageUrls(html: string): string[] {
  const directMatches = Array.from(html.matchAll(PINTEREST_IMAGE_PATTERN)).map((match) => match[0]);
  return chooseBestCandidate(directMatches);
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function buildSearchVariants(query: string): string[] {
  const variants = [query];
  const words = countWords(query);
  if (words <= 3) {
    variants.push(`${query} photo`);
    variants.push(`${query} portrait`);
  }
  return Array.from(new Set(variants.map((value) => value.trim())));
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

async function fetchText(url: string, init: RequestInit): Promise<string> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.text();
}

class PinterestApiProvider implements SearchProvider {
  readonly name = "pinterest-api";

  isEnabled(): boolean {
    return Boolean(process.env.PINTEREST_SEARCH_API_URL);
  }

  async search(query: string): Promise<PinterestCandidate[]> {
    const endpoint = process.env.PINTEREST_SEARCH_API_URL;
    if (!endpoint) return [];

    const token = process.env.PINTEREST_ACCESS_TOKEN?.trim();
    const url = endpoint.includes("{query}")
      ? endpoint.replace("{query}", encodeURIComponent(query))
      : (() => {
          const built = new URL(endpoint);
          if (!built.searchParams.has("q")) built.searchParams.set("q", query);
          return built.toString();
        })();

    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const payload = await fetchJson(url, { headers });
    const urls = extractCandidateUrls(payload);
    return urls.map((mediaUrl) => ({
      provider: this.name,
      sourceUrl: url,
      mediaUrl,
    }));
  }
}

class PinterestScrapeProvider implements SearchProvider {
  readonly name = "pinterest-scrape";

  isEnabled(): boolean {
    return true;
  }

  async search(query: string): Promise<PinterestCandidate[]> {
    const sourceUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${query} site:pinterest.com`)}`;
    const html = await fetchText(sourceUrl, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    const pinterestPages = extractDuckDuckGoPinterestLinks(html).slice(0, 4);
    const results: PinterestCandidate[] = [];

    for (const pageUrl of pinterestPages) {
      try {
        const pageHtml = await fetchText(pageUrl, {
          headers: {
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
        });

        const urls = extractPinterestPageUrls(pageHtml).slice(0, 10);
        for (const mediaUrl of urls) {
          results.push({
            provider: this.name,
            sourceUrl: pageUrl,
            mediaUrl,
          });
        }
      } catch (error) {
        console.warn(`  Pinterest page fetch failed for ${pageUrl}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return results;
  }
}

class PlaywrightPinterestProvider implements SearchProvider {
  readonly name = "pinterest-playwright";
  private browserPromise: Promise<PlaywrightBrowser> | null = null;

  isEnabled(): boolean {
    return true;
  }

  private async getBrowser(): Promise<PlaywrightBrowser> {
    if (!this.browserPromise) {
      this.browserPromise = import("playwright").then(async ({ chromium }) => {
        return chromium.launch({ headless: true });
      });
    }
    return this.browserPromise;
  }

  async dispose(): Promise<void> {
    if (!this.browserPromise) return;
    const browser = await this.browserPromise;
    await browser.close();
    this.browserPromise = null;
  }

  async search(query: string): Promise<PinterestCandidate[]> {
    const browser = await this.getBrowser();
    const variants = buildSearchVariants(query);
    const results: PinterestCandidate[] = [];

    for (const variant of variants) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 2000 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      });
      const page = await context.newPage();
      const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(variant)}&rs=typed`;

      try {
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1400);
        const candidates = await extractPinsFromPage(page, 18);
        await context.close();

        for (const candidate of candidates) {
          results.push({
            provider: this.name,
            sourceUrl: candidate.pin_url ?? searchUrl,
            mediaUrl: candidate.url,
          });
        }

        if (results.length > 0) return results;
      } catch {
        await context.close();
      }
    }

    return results;
  }
}

async function extractPinsFromPage(
  page: Awaited<ReturnType<PlaywrightBrowser["newPage"]>>,
  maxImages: number,
): Promise<RenderedPinCandidate[]> {
  const seen = new Set<string>();
  const results: RenderedPinCandidate[] = [];
  let noNewCount = 0;

  const extractBatch = async (): Promise<RenderedPinCandidate[]> => {
    return page.evaluate(() => {
      const batch: Array<{ url: string; pin_url: string | null }> = [];
      let imgs = document.querySelectorAll('img[elementtiming*="related_pins"], img[elementtiming*="search"]');
      if (imgs.length === 0) {
        imgs = document.querySelectorAll('[data-test-id="pin"] [data-test-id="pinrep-image"], img[src*="pinimg.com"]');
      }

      imgs.forEach((imgNode) => {
        const img = imgNode as HTMLImageElement;
        let src = img.currentSrc || img.src || "";
        if (!src.includes("pinimg.com")) return;
        if (src.includes("/75x75") || src.includes("/30x30")) return;

        const srcset = img.getAttribute("srcset") || "";
        const origMatch = srcset.match(/(https:\/\/i\.pinimg\.com\/originals\/[^\s,]+)/);
        const match736 = srcset.match(/(https:\/\/i\.pinimg\.com\/736x\/[^\s,]+)/);
        if (origMatch?.[1]) src = origMatch[1];
        else if (match736?.[1]) src = match736[1];
        else src = src.replace(/\/[0-9]+x[^/]*\//, "/736x/");

        const pin = img.closest('[data-test-id="pin"]');
        const link = pin?.querySelector('a[href*="/pin/"]') ?? img.closest('a[href*="/pin/"]');
        let pinUrl = link instanceof HTMLAnchorElement ? link.href : null;
        if (pinUrl?.startsWith("/pin/")) pinUrl = `https://www.pinterest.com${pinUrl}`;
        if (pinUrl && !pinUrl.includes("/pin/")) return;

        batch.push({ url: src, pin_url: pinUrl });
      });

      return batch;
    });
  };

  for (let i = 0; i < 8 && results.length < maxImages; i++) {
    const batch = await extractBatch();
    let added = 0;

    for (const candidate of batch) {
      if (seen.has(candidate.url)) continue;
      seen.add(candidate.url);
      results.push(candidate);
      added++;
      if (results.length >= maxImages) break;
    }

    if (added === 0) {
      noNewCount++;
      if (noNewCount >= 3) break;
    } else {
      noNewCount = 0;
    }

    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await page.waitForTimeout(900);
  }

  return chooseBestCandidate(results.map((candidate) => candidate.url))
    .slice(0, maxImages)
    .map((url) => results.find((candidate) => candidate.url === url))
    .filter((candidate): candidate is RenderedPinCandidate => Boolean(candidate));
}

function buildProviderStack(): SearchProvider[] {
  return [
    new PinterestApiProvider(),
    new PinterestScrapeProvider(),
    new PlaywrightPinterestProvider(),
  ].filter((provider) => provider.isEnabled());
}

async function resolveCandidates(query: string, providers: SearchProvider[]): Promise<PinterestCandidate[]> {
  for (const provider of providers) {
    try {
      const candidates = await provider.search(query);
      if (candidates.length > 0) return candidates;
    } catch (error) {
      console.warn(`  Image provider ${provider.name} failed for "${query}": ${error instanceof Error ? error.message : error}`);
    }
  }

  return [];
}

async function downloadCandidate(
  candidate: PinterestCandidate,
  destinationBase: string,
): Promise<string> {
  const response = await fetch(candidate.mediaUrl, {
    headers: {
      Referer: candidate.sourceUrl,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from media download`);
  }

  const ext = extensionFromUrl(candidate.mediaUrl) ?? extensionFromContentType(response.headers.get("content-type"));
  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = `${destinationBase}${ext}`;
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function relativePublicPath(publicDir: string, absolutePath: string): string {
  const relative = path.relative(publicDir, absolutePath).replace(/\\/g, "/");
  return relative;
}

async function saveEntryAsset(opts: {
  originalQuery: string;
  normalizedQuery: string;
  assetsDir: string;
  publicDir: string;
  providers: SearchProvider[];
  maxAssets: number;
}): Promise<QueryAssetSet | null> {
  const candidates = await resolveCandidates(opts.normalizedQuery, opts.providers);
  if (candidates.length === 0) return null;

  const queryDir = path.join(opts.assetsDir, sanitizeSegment(opts.normalizedQuery));
  fs.mkdirSync(queryDir, { recursive: true });

  const assets: ImageManifestQueryAsset[] = [];
  const uniqueUrls = Array.from(new Set(candidates.map((candidate) => candidate.mediaUrl))).slice(0, opts.maxAssets);

  for (let index = 0; index < uniqueUrls.length; index++) {
    const mediaUrl = uniqueUrls[index];
    const candidate = candidates.find((item) => item.mediaUrl === mediaUrl);
    if (!candidate) continue;

    const targetBase = path.join(queryDir, String(index + 1).padStart(2, "0"));
    const absolutePath = await downloadCandidate(candidate, targetBase);
    assets.push({
      assetIndex: index,
      relativePath: relativePublicPath(opts.publicDir, absolutePath),
      provider: candidate.provider,
      sourceUrl: candidate.sourceUrl,
      mediaUrl: candidate.mediaUrl,
    });
  }

  if (assets.length === 0) return null;

  return {
    originalQuery: opts.originalQuery,
    query: opts.normalizedQuery,
    assets,
  };
}

function buildBackgroundQuery(spec: VideoSpec): string {
  const firstSentenceQuery = spec.sentences.find((sentence) => sentence.visualQuery)?.visualQuery;
  return firstSentenceQuery ?? topicToVisualQuery(spec.topic);
}

function selectAssetFromSet(
  querySet: QueryAssetSet,
  requestedIndex: number,
): ImageManifestQueryAsset | null {
  if (querySet.assets.length === 0) return null;
  const normalizedIndex = Math.max(0, requestedIndex) % querySet.assets.length;
  return querySet.assets[normalizedIndex] ?? querySet.assets[0] ?? null;
}

function mergeBackgroundFallback(
  entries: ImageManifestEntry[],
  spec: VideoSpec,
  backgroundRelativePath: string | null,
): (string | null)[] {
  return spec.sentences.map((sentence) => {
    const entry = entries.find((item) => item.sentenceIndex === sentence.index);
    return entry?.relativePath ?? backgroundRelativePath;
  });
}

export function readImageManifest(outputDir: string): ImageManifest | null {
  const manifestPath = path.join(outputDir, MANIFEST_FILENAME);
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as ImageManifest;
}

export async function resolveImageAssets(opts: {
  spec: VideoSpec;
  outputDir: string;
  publicDir: string;
  skipImages?: boolean;
}): Promise<ImageManifest> {
  const manifest = buildEmptyManifest(opts.spec);
  const manifestPath = path.join(opts.outputDir, MANIFEST_FILENAME);

  if (opts.skipImages) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    return manifest;
  }

  const providers = buildProviderStack();
  try {
    const slug = manifest.slug;
    const assetsDir = path.join(opts.publicDir, "assets", slug);
    fs.mkdirSync(assetsDir, { recursive: true });

    const cache = new Map<string, QueryAssetSet | null>();
    const queryUseCounts = new Map<string, number>();
    const entries: ImageManifestEntry[] = [];
    const queryAssets: ImageManifestQuerySet[] = [];

    const backgroundOriginalQuery = buildBackgroundQuery(opts.spec);
    const backgroundQuery = compactVisualQuery(backgroundOriginalQuery) ?? topicToVisualQuery(opts.spec.topic);
    manifest.backgroundQuery = backgroundQuery;

    // Pre-count how many times each normalised query appears in the script so we
    // fetch exactly that many assets — no more. Capped at 3 to avoid over-fetching.
    const queryDemand = new Map<string, number>();
    for (const sentence of opts.spec.sentences) {
      if (!sentence.needsImage || !sentence.visualQuery) continue;
      const nq = compactVisualQuery(sentence.visualQuery);
      if (!nq) continue;
      queryDemand.set(nq, (queryDemand.get(nq) ?? 0) + 1);
    }

    const backgroundSet = await saveEntryAsset({
      originalQuery: backgroundOriginalQuery,
      normalizedQuery: backgroundQuery,
      assetsDir,
      publicDir: opts.publicDir,
      providers,
      maxAssets: 1,
    });

    if (backgroundSet) {
      queryAssets.push(backgroundSet);
      cache.set(backgroundQuery, backgroundSet);
      const backgroundAsset = selectAssetFromSet(backgroundSet, 0);
      if (backgroundAsset) {
        manifest.background = backgroundAsset.relativePath;
        entries.push({
          kind: "background",
          sentenceIndex: null,
          originalQuery: backgroundSet.originalQuery,
          query: backgroundSet.query,
          assetIndex: backgroundAsset.assetIndex,
          relativePath: backgroundAsset.relativePath,
          provider: backgroundAsset.provider,
          sourceUrl: backgroundAsset.sourceUrl,
          mediaUrl: backgroundAsset.mediaUrl,
        });
      }
      const bgImagePath = path.join(opts.publicDir, "bg-image.png");
      if (manifest.background && !isVideoAsset(manifest.background)) {
        fs.copyFileSync(path.join(opts.publicDir, manifest.background), bgImagePath);
      }
    }

    for (const sentence of opts.spec.sentences) {
      if (!sentence.needsImage || !sentence.visualQuery) continue;
      const normalizedQuery = compactVisualQuery(sentence.visualQuery);
      if (!normalizedQuery) continue;

      let querySet = cache.get(normalizedQuery) ?? null;

      if (querySet === null && !cache.has(normalizedQuery)) {
        const demand = Math.min(queryDemand.get(normalizedQuery) ?? 1, 3);
        querySet = await saveEntryAsset({
          originalQuery: sentence.visualQuery,
          normalizedQuery,
          assetsDir,
          publicDir: opts.publicDir,
          providers,
          maxAssets: demand,
        });
        cache.set(normalizedQuery, querySet);
        if (querySet) queryAssets.push(querySet);
      }

      if (!querySet) continue;

      const useCount = queryUseCounts.get(normalizedQuery) ?? 0;
      const preferredIndex = normalizedQuery === backgroundQuery ? useCount + 1 : useCount;
      const asset = selectAssetFromSet(querySet, preferredIndex);
      queryUseCounts.set(normalizedQuery, useCount + 1);
      if (!asset) continue;

      entries.push({
        kind: "sentence",
        sentenceIndex: sentence.index,
        originalQuery: querySet.originalQuery,
        query: querySet.query,
        assetIndex: asset.assetIndex,
        relativePath: asset.relativePath,
        provider: asset.provider,
        sourceUrl: asset.sourceUrl,
        mediaUrl: asset.mediaUrl,
      });
    }

    manifest.entries = entries;
    manifest.queryAssets = queryAssets;
    manifest.resolvedImages = mergeBackgroundFallback(entries, opts.spec, manifest.background);

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    return manifest;
  } finally {
    await Promise.all(providers.map((provider) => provider.dispose?.()));
  }
}

export function imageQuerySummary(sentences: ScriptSentence[]): string[] {
  return sentences
    .filter((sentence) => sentence.visualQuery)
    .map((sentence) => `${sentence.index}. ${sentence.visualQuery}`);
}
