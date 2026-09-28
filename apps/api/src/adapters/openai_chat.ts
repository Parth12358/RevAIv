// OpenAI-compatible chat adapter: works with any provider that speaks the
// /chat/completions API — OpenAI, DeepSeek, Groq, Gemini (OpenAI-compat endpoint),
// Together, Fireworks, local vLLM, etc. This is how most real third-party agents
// are called, so it's the default path for user-submitted agents.
//
// The agent's `endpoint` packs base URL + model as "<baseURL>::<model>" so we can
// carry both without a schema change. If no "::" is present the whole string is
// treated as the base URL and a generic default model is used.
import type { AdapterResult, Task } from "../types";
import type { AgentSpec } from "./index";

const TIMEOUT_MS = 120_000;
const DEFAULT_MODEL = "gpt-4o-mini";

// Rough fallback pricing (USD per 1M tokens) when the provider returns usage but
// we don't know the exact model. Reviewers score cost directly, so this only
// affects the displayed cost estimate.
const GENERIC_PRICE = { in: 0.5, out: 1.5 };

const SYSTEM = `You are an expert practitioner completing a short professional task in your field.
Read the brief and produce the actual deliverable it asks for — not a description of how you would do it.
Format your response as clean, well-structured Markdown. Be concise, specific, and useful.`;

export function parseEndpoint(endpoint: string | null): { baseURL: string; model: string } {
  if (!endpoint) throw new Error("openai_chat adapter requires an endpoint (base URL)");
  const idx = endpoint.indexOf("::");
  if (idx === -1) return { baseURL: endpoint.trim(), model: DEFAULT_MODEL };
  return { baseURL: endpoint.slice(0, idx).trim(), model: endpoint.slice(idx + 2).trim() || DEFAULT_MODEL };
}

export async function runOpenAiChat(agent: AgentSpec, task: Task): Promise<AdapterResult> {
  const { baseURL, model } = parseEndpoint(agent.endpoint);
  if (!agent.apiKey) throw new Error("openai_chat adapter requires an API key");

  const url = `${baseURL.replace(/\/+$/, "")}/chat/completions`;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${agent.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: task.prompt },
        ],
      }),
      signal: controller.signal,
    });

    const text = await res.text();
    const durationMs = Date.now() - started;

    let data: OpenAiResponse;
    try {
      data = JSON.parse(text) as OpenAiResponse;
    } catch {
      throw new Error(`Provider returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      const msg = data?.error?.message ?? text.slice(0, 200);
      throw new Error(`Provider ${res.status}: ${msg}`);
    }

    const output = (data.choices?.[0]?.message?.content ?? "").trim();
    if (!output) throw new Error("Provider returned an empty completion");

    // Cost: owner-declared if given, else a rough estimate from token usage.
    let costUsd = agent.declaredCostUsd ?? 0;
    if (!agent.declaredCostUsd && data.usage) {
      costUsd =
        ((data.usage.prompt_tokens ?? 0) / 1_000_000) * GENERIC_PRICE.in +
        ((data.usage.completion_tokens ?? 0) / 1_000_000) * GENERIC_PRICE.out;
    }

    return { output, costUsd, durationMs };
  } finally {
    clearTimeout(timer);
  }
}

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}
