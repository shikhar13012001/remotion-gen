/**
 * extract-tokens.ts — standalone design token extractor
 *
 * Reads a design documentation markdown file, makes a single LLM call to
 * extract structured tokens, validates them, and writes a .tokens.json file.
 *
 * Usage:
 *   npx tsx scripts/extract-tokens.ts ./designs/airbnb.md
 *
 * Output:
 *   ./designs/<filename>.tokens.json
 *
 * Env vars (same as the rest of the pipeline):
 *   LM_STUDIO_URL    — base URL of any OpenAI-compat endpoint (default: http://localhost:1234/v1)
 *   LM_STUDIO_MODEL  — model name to use (default: local-model)
 *   OPENAI_API_KEY   — API key (default: "lm-studio" for local servers that don't need one)
 */

import * as fs   from "fs";
import * as path from "path";
import { callLMStudioJSON } from "../lmstudio/caller.js";
import { TokenMapSchema }   from "../lmstudio/index.js";
import type { LMCallOptions } from "../lmstudio/types.js";

try { require("dotenv").config(); } catch {}

const SYSTEM_PROMPT =
  "Extract design tokens. Output only valid JSON, no markdown fences, no commentary.\n" +
  "Schema:\n" +
  "{\n" +
  '  "fontFamily":  string,\n' +
  '  "colors":      Record<string, string>,\n' +
  '  "typography":  Record<string, { "size": string, "weight": number, "lineHeight": number }>,\n' +
  '  "spacing":     Record<string, string>,\n' +
  '  "radii":       Record<string, string>\n' +
  "}\n" +
  "Rules:\n" +
  "- Only extract tokens with explicit hex values in the documentation\n" +
  "- Never infer or guess a value\n" +
  "- Omit sub-brand tokens\n" +
  "- camelCase all keys\n" +
  '- fontFamily must be the exact CSS string from the docs\n' +
  '- colors values must be hex strings only (e.g. "#ff5a5f"), no rgb(), no hsl()\n' +
  "- If a token category has no extractable values, return an empty object for that key";

function parseDesignFilePath(): string {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/extract-tokens.ts <design-file.md>");
    process.exit(1);
  }
  const resolved = path.resolve(arg);
  if (!fs.existsSync(resolved)) {
    console.error(`Design file not found: ${resolved}`);
    process.exit(1);
  }
  return resolved;
}

async function main(): Promise<void> {
  const designPath = parseDesignFilePath();
  const baseName   = path.basename(designPath, path.extname(designPath));
  const outPath    = path.join(path.dirname(designPath), `${baseName}.tokens.json`);

  const designContent = fs.readFileSync(designPath, "utf-8");
  const baseUrl = process.env.LM_STUDIO_URL   ?? "http://localhost:1234/v1";
  const mdlName = process.env.LM_STUDIO_MODEL ?? "local-model";

  console.log(`\nExtracting tokens from: ${designPath}`);
  console.log(`Output:  ${outPath}`);
  console.log(`Endpoint: ${baseUrl}  model: ${mdlName}\n`);

  const opts: LMCallOptions = { model: mdlName, temperature: 0.1, maxTokens: 2048 };

  const tokens = await callLMStudioJSON<unknown>(
    SYSTEM_PROMPT,
    `Extract design tokens from the following documentation:\n\n${designContent}`,
    opts,
  );

  const result = TokenMapSchema.safeParse(tokens);
  if (!result.success) {
    console.error("Token extraction failed Zod validation:");
    console.error(result.error.message);
    process.exit(1);
  }

  const validated = result.data;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(validated, null, 2) + "\n", "utf-8");

  console.log("Extracted tokens:");
  console.log(`  fontFamily:  ${validated.fontFamily}`);
  console.log(`  colors:      ${Object.keys(validated.colors).join(", ")  || "(none)"}`);
  console.log(`  typography:  ${Object.keys(validated.typography).join(", ") || "(none)"}`);
  console.log(`  spacing:     ${Object.keys(validated.spacing).join(", ")  || "(none)"}`);
  console.log(`  radii:       ${Object.keys(validated.radii).join(", ")    || "(none)"}`);
  console.log(`\nWritten → ${outPath}`);
}

main().catch(err => {
  console.error("extract-tokens failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
