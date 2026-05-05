/**
 * Regenerates out/prompt/claude.md from existing pipeline outputs without
 * rerunning LLM calls.
 *
 * Usage:
 *   npm run regen-prompt -- --guide guides/finance/general.md
 */
import * as fs from "fs";
import * as path from "path";
import { buildHandoffPrompt, slugFromTopic } from "../lmstudio/handoffPrompt";

const ROOT = process.cwd();
const SCRIPT_JSON = path.join(ROOT, "data", "output", "script.json");
const DESIGN_TOKENS = path.join(ROOT, "data", "output", "design_tokens.json");
const PROMPT_FILE = path.join(ROOT, "out", "prompt", "claude.md");

function parseArgs(args: string[]): { guidePath: string | null } {
  let guidePath: string | null = null;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--guide" && args[i + 1]) {
      guidePath = args[++i];
    } else if (arg === "--design" && args[i + 1]) {
      i++;
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  if (!guidePath) {
    guidePath = positional.find((value) => value.replace(/\\/g, "/").includes("guides/")) ?? null;
  }

  return { guidePath };
}

function requireFile(filePath: string, label: string): string {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing required file: ${filePath}`);
    console.error(`Run npm run pipeline first to generate ${label}.`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, "utf-8");
}

const { guidePath } = parseArgs(process.argv.slice(2));
const script = JSON.parse(requireFile(SCRIPT_JSON, "script.json")) as {
  topic: string;
  accentColor: string;
  sentences: Array<unknown>;
};
const designTokens = fs.existsSync(DESIGN_TOKENS)
  ? JSON.parse(fs.readFileSync(DESIGN_TOKENS, "utf-8")) as { accent?: string }
  : {};

if (guidePath) {
  const guideAbs = path.isAbsolute(guidePath) ? guidePath : path.resolve(ROOT, guidePath);
  if (!fs.existsSync(guideAbs)) {
    console.warn(`Guide not found; path will still be referenced in prompt: ${guidePath}`);
  }
}

const hasAudio =
  fs.existsSync(path.join(ROOT, "public", "voice.mp3")) &&
  fs.existsSync(path.join(ROOT, "public", "timing.json"));

const prompt = buildHandoffPrompt({
  topic: script.topic,
  accentColor: designTokens.accent ?? script.accentColor,
  sentenceCount: script.sentences.length,
  hasAudio,
  guidePath,
  scriptJsonPath: "data/output/script.json",
});

fs.mkdirSync(path.dirname(PROMPT_FILE), { recursive: true });
fs.writeFileSync(PROMPT_FILE, prompt, "utf-8");

console.log(`out/prompt/claude.md regenerated (${prompt.split("\n").length} lines)`);
console.log(`Topic : ${script.topic}`);
console.log(`Slug  : ${slugFromTopic(script.topic)}`);
console.log(`Guide : ${guidePath ?? "none"}`);
