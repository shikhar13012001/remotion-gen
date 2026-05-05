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

export function resolveImagesForSentenceCount(
  sentenceCount: number,
  manifest: ImageManifest | null | undefined,
): (string | null)[] {
  if (!manifest) return Array.from({ length: sentenceCount }, () => null);
  if (manifest.resolvedImages.length === sentenceCount) return manifest.resolvedImages;

  return Array.from({ length: sentenceCount }, (_, index) => {
    const sentenceEntry = manifest.entries.find((entry) => entry.sentenceIndex === index + 1);
    return sentenceEntry?.relativePath ?? manifest.background ?? null;
  });
}
