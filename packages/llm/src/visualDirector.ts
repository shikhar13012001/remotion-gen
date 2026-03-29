import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import { validateDirectives } from "@yt-shorts/core";
import type { SentenceVisualDirective } from "@yt-shorts/core";

const client = new OpenAI({
  baseURL: process.env.LM_STUDIO_URL ?? "http://localhost:1234/v1",
  apiKey:  process.env.OPENAI_API_KEY ?? "lm-studio",
});
const model = process.env.LM_STUDIO_MODEL ?? "local-model";

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(path.dirname(new URL(import.meta.url).pathname), "prompts", "visual-director.txt"), "utf8"
);

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
}

function extractArray(raw: string): unknown[] {
  const start = raw.indexOf("[");
  const end   = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found in response");
  return JSON.parse(raw.slice(start, end + 1)) as unknown[];
}

async function callLM(userContent: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens:  4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function generateDirectives(sentences: string[]): Promise<SentenceVisualDirective[]> {
  const userContent = `Generate one SentenceVisualDirective per sentence.\n\nSentences:\n${
    sentences.map((s, i) => `${i + 1}. ${s}`).join("\n")
  }`;

  console.log(`[visualDirector] Sending ${sentences.length} sentences to LM Studio…`);
  let raw = await callLM(userContent);
  raw = stripFences(raw);

  let parsed: unknown[];
  try {
    parsed = extractArray(raw);
  } catch {
    console.warn("[visualDirector] Malformed JSON — retrying with repair prompt…");
    const repairContent = `The previous response was not valid JSON.
Return ONLY the corrected JSON array, nothing else.
Common fixes needed: close unclosed brackets, remove trailing commas,
ensure all strings are quoted, ensure prefix/suffix fields are "" not null.
Previous broken output:
${raw}`;
    const retryRaw = stripFences(await callLM(repairContent));
    parsed = extractArray(retryRaw);
  }

  const directives = validateDirectives(parsed);
  console.log(`[visualDirector] ${directives.length} valid directives returned`);
  return directives;
}
