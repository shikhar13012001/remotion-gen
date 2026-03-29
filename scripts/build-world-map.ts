/**
 * Pre-processes the world-atlas topojson into a simple per-country SVG path map.
 *
 * Input:  node_modules/world-atlas/countries-110m.json  (topojson)
 * Output: src/animations/data/world-countries.json       (Record<iso-numeric-string, svg-path>)
 *
 * The SVG paths use a simple equirectangular projection scaled to fit a 920×500 viewport.
 * Run once: npx tsx scripts/build-world-map.ts
 */

import * as fs   from "fs";
import * as path from "path";
import { geometryToPath, NUMERIC_TO_ALPHA3 } from "./worldMapHelpers";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const topojson = require("topojson-client") as typeof import("topojson-client");

// ── Load world atlas ──────────────────────────────────────────────────────────

const atlasPath = path.resolve(__dirname, "../node_modules/world-atlas/countries-110m.json");
if (!fs.existsSync(atlasPath)) {
  console.error("world-atlas not found. Run: npm install world-atlas");
  process.exit(1);
}

const topo = JSON.parse(fs.readFileSync(atlasPath, "utf-8")) as TopoJSON.Topology;

// ── Convert topojson → per-country SVG paths ──────────────────────────────────

// world-atlas uses ISO 3166-1 numeric codes as feature IDs.
// We key the output by the numeric string (e.g. "840" = United States).
// Callers can pass ISO alpha-3 codes; the LLM also produces numeric codes sometimes,
// so we store both: numeric key AND alpha-3 alias map built from a lookup table.

type FeatureProperties = { name?: string };
const countries = topojson.feature(
  topo,
  topo.objects.countries as TopoJSON.GeometryCollection<FeatureProperties>
);

const result: Record<string, string> = {};

for (const feature of countries.features) {
  const numId  = String(feature.id ?? "");
  const alpha3 = NUMERIC_TO_ALPHA3[numId];
  const d      = geometryToPath(feature.geometry);
  if (!d) continue;

  // Store by numeric ID
  result[numId] = d;
  // Also store by alpha-3 if available (LLM uses alpha-3)
  if (alpha3) result[alpha3] = d;
}

// ── Write output ─────────────────────────────────────────────────────────────

const outDir  = path.resolve(__dirname, "../src/animations/data");
const outFile = path.join(outDir, "world-countries.json");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(result), "utf-8");

const countryCount = Object.keys(NUMERIC_TO_ALPHA3).length;
const savedCount   = Object.keys(result).length;
console.log(`✓ World map built: ${savedCount} entries (${countryCount} alpha-3 aliases) → ${outFile}`);
