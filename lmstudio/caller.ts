import OpenAI from "openai";
import { TEXT_CLEAN_PREFIX } from "./constants";
import type { LMCallOptions } from "./types";
import * as dotenv from "dotenv";

try { dotenv.config(); } catch {}
const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_URL ?? "http://localhost:1234/v1";
const OPENAI_API_KEY     = process.env.OPENAI_API_KEY ?? "lm-studio";

export const model = process.env.LM_STUDIO_MODEL ?? "local-model";

const client = new OpenAI({ baseURL: LM_STUDIO_BASE_URL, apiKey: OPENAI_API_KEY });

/**
 * Returns the raw text content of a chat completion with no JSON processing.
 * Use for code generation, prose, or any non-JSON output.
 */
export async function callLMStudioText(
  systemPrompt: string,
  userMessage:  string,
  options:      LMCallOptions = {}
): Promise<string> {
  const { model: m = model, temperature = 0.4, maxTokens = 10000 } = options;

  const completion = await client.chat.completions.create({
    model:      m,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage  },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Model returned an empty response.");
  return text;
}

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function callLMStudioRaw(
  systemPrompt: string,
  userMessage: string,
  options: LMCallOptions = {}
): Promise<string> {
  const { model: m = "local-model", temperature = 0.5, maxTokens = 8000, schema, schemaName } = options;

  console.log(`  📡  Connecting to LM Studio at ${LM_STUDIO_BASE_URL}…`);

  const response_format = schema
    ? {
        type:        "json_schema" as const,
        json_schema: { name: schemaName ?? "response", schema },
      }
    : undefined;  // LM Studio only supports json_schema or text — omit when no schema

  try {
    const completion = await client.chat.completions.create({
      model: m,
      temperature,
      max_tokens: maxTokens,
      ...(response_format ? { response_format: response_format as Parameters<typeof client.chat.completions.create>[0]["response_format"] } : {}),
      messages: [
        { role: "system", content: TEXT_CLEAN_PREFIX + "\n\n" + systemPrompt },
        { role: "user",   content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("LM Studio returned an empty response.");
    return extractJSON(raw);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      throw new Error(
        "Cannot reach LM Studio.\n" +
        "  → LM Studio → Local Server tab → Start Server\n" +
        `  → Expected URL: ${LM_STUDIO_BASE_URL}`
      );
    }
    throw err;
  }
}

export async function callLMStudioJSON<T = unknown>(
  systemPrompt: string,
  userMessage: string,
  options: LMCallOptions = {},
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = await callLMStudioRaw(systemPrompt, userMessage, options);
    try {
      return JSON.parse(raw) as T;
    } catch (parseErr) {
      console.warn(`  ⚠️  [Attempt ${attempt}/${maxAttempts}] JSON parse failed:`, parseErr);
      if (attempt === maxAttempts) {
        throw new Error(`Failed to parse valid JSON after ${maxAttempts} attempts.\n${raw}`);
      }
    }
  }
  throw new Error("Unexpected retry loop exit");
}
