import * as fs from "fs";
import * as path from "path";
import { resolveImageAssets } from "../pipelineImages";

function parseFlag(name: string): string | null {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) return null;
  return args[index + 1];
}

function parsePositionalQuery(): string | null {
  const args = process.argv.slice(2);
  const positional = args.filter((value, index) => {
    if (value.startsWith("--")) return false;
    const previous = args[index - 1];
    if (previous === "--query" || previous === "--topic") return false;
    return true;
  });

  if (positional.length === 0) return null;
  return positional.join(" ");
}

async function main(): Promise<void> {
  const query = parseFlag("--query") ?? parsePositionalQuery() ?? "John F Kennedy";
  const topic = parseFlag("--topic") ?? query;
  const outputDir = path.join(process.cwd(), "data", "output");
  const publicDir = path.join(process.cwd(), "public");

  const manifest = await resolveImageAssets({
    spec: {
      topic,
      accentColor: "#c8a96e",
      directives: [],
      sentences: [{
        index: 1,
        text: topic,
        beat: "build",
        word_count: topic.split(/\s+/).length,
        suggested_duration_ms: 3000,
        visualQuery: query,
        needsImage: true,
        highlightWords: [],
        dataValue: null,
      }],
    },
    outputDir,
    publicDir,
  });

  const savedFiles = manifest.entries
    .map((entry) => path.join(publicDir, entry.relativePath))
    .filter((filePath) => fs.existsSync(filePath));

  console.log(JSON.stringify({
    topic: manifest.topic,
    slug: manifest.slug,
    backgroundQuery: manifest.backgroundQuery,
    background: manifest.background,
    entryCount: manifest.entries.length,
    queryAssetSets: manifest.queryAssets.map((set) => ({
      originalQuery: set.originalQuery,
      query: set.query,
      assetCount: set.assets.length,
      files: set.assets.map((asset) => path.join(publicDir, asset.relativePath)),
    })),
    files: savedFiles,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
