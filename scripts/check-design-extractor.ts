import * as fs from "fs";
import * as path from "path";
import { extractDesignSystem } from "../lmstudio/designExtractor";

const ROOT = process.cwd();
const DESIGNS_DIR = path.join(ROOT, "designs");

function parseYamlColors(content: string): Record<string, string> {
  const colors: Record<string, string> = {};
  const section = content.match(/^colors:\n((?:[ \t]+[^\n]*\n?)*)/m);
  if (!section) return colors;

  for (const line of section[1].split("\n")) {
    const match = line.match(/^[ \t]+([\w-]+):\s*["']?(#[0-9a-fA-F]{6})["']?/);
    if (match) colors[match[1].trim()] = match[2].trim();
  }

  return colors;
}

function luminance(hex: string): number {
  const match = hex.match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return 0.5;
  const r = parseInt(match[1].slice(0, 2), 16) / 255;
  const g = parseInt(match[1].slice(2, 4), 16) / 255;
  const b = parseInt(match[1].slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function assertEqual(actual: string, expected: string, message: string): void {
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

const failures: string[] = [];
const designFiles = fs
  .readdirSync(DESIGNS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(DESIGNS_DIR, entry.name, "DESIGN.md"))
  .filter((filePath) => fs.existsSync(filePath));

for (const filePath of designFiles) {
  const rel = path.relative(ROOT, filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const colors = parseYamlColors(content);
  const ds = extractDesignSystem(content, "#4fc3f7");

  try {
    if (colors.canvas && !colors["canvas-dark"] && luminance(colors.canvas) >= 0.72) {
      assertEqual(ds.tokens.background, colors.canvas, `${rel} light canvas must remain the video background`);
    }

    if (colors.primary) {
      assertEqual(ds.tokens.accent, colors.primary, `${rel} primary color must be the extracted accent`);
    }

    if (colors.ink && luminance(ds.tokens.background) >= 0.72) {
      assertEqual(ds.tokens.textOn, colors.ink, `${rel} ink must be primary text on a light background`);
    }
  } catch (err) {
    failures.push(err instanceof Error ? err.message : String(err));
  }
}

if (failures.length > 0) {
  console.error("Design extractor regression check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Design extractor regression check passed for ${designFiles.length} design files.`);
