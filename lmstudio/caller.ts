import OpenAI from "openai";
import { TEXT_CLEAN_PREFIX } from "./constants";
import type { LMCallOptions, PromptRequest, ScriptLLMProvider } from "./types";
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
  // Try fenced code blocks first
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return sanitizeJSON(fenced[1].trim());
  
  // Fall back to finding object bounds
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return sanitizeJSON(raw.slice(start, end + 1));
  
  return sanitizeJSON(raw.trim());
}

/**
 * Sanitize JSON by removing common parse errors:
 * - Trailing commas before ] or }
 * - Unescaped newlines in strings
 * - Comments
 */
function sanitizeJSON(json: string): string {
  // Remove comments (// and /* */)
  json = json.replace(/\/\/.*?$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  
  // Remove trailing commas before ] and }
  json = json.replace(/,\s*([}\]])/g, "$1");
  
  // Fix unescaped newlines in string values by replacing them with \n
  // This is tricky but necessary for model outputs that contain line breaks
  // Match strings and replace internal newlines with escaped versions
  json = json.replace(/"([^"\\]|\\.)*"/g, (match) => {
    return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  });
  
  return json;
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
      const err = parseErr as SyntaxError;
      const pos = err.message.match(/position (\d+)/)?.[1] ?? "unknown";
      const context = raw.slice(
        Math.max(0, parseInt(pos) - 50),
        Math.min(raw.length, parseInt(pos) + 50)
      );
      
      console.warn(
        `  ⚠️  [Attempt ${attempt}/${maxAttempts}] JSON parse failed at position ${pos}:\n` +
        `      ...${context}...\n` +
        `      Error: ${err.message}`
      );
      
      if (attempt === maxAttempts) {
        // Show first 500 chars of malformed JSON for debugging
        const preview = raw.slice(0, 500).replace(/\n/g, "\\n");
        throw new Error(
          `Failed to parse JSON after ${maxAttempts} attempts.\n` +
          `Error at position ${pos}: ${err.message}\n` +
          `First 500 chars:\n${preview}`
        );
      }
    }
  }
  throw new Error("Unexpected retry loop exit");
}

export class LMStudioScriptProvider implements ScriptLLMProvider {
  async generateJSON<T>(input: PromptRequest): Promise<T> {
    return callLMStudioJSON<T>(
      input.systemPrompt,
      input.userMessage,
      {
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        schema: input.schema,
        schemaName: input.schemaName,
      },
    );
  }

  async generateText(input: PromptRequest): Promise<string> {
    return callLMStudioText(
      input.systemPrompt,
      input.userMessage,
      {
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      },
    );
  }
}

export function createScriptLLMProvider(): ScriptLLMProvider {
  return new LMStudioScriptProvider();
}
