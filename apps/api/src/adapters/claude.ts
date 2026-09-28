// Claude-wrapper adapter: our own comparison agents built on the Claude API.
// Cost is derived from token usage. Uses adaptive thinking (no budget_tokens,
// no temperature) per current Opus/Sonnet API. Raw fetch keeps the Worker
// dependency-free; the Messages API is called directly.
import type { AdapterResult, Task } from "../types";
import type { AgentSpec } from "./index";

// USD per 1M tokens (input, output). Standard rates.
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
};

const DEFAULT_MODEL = "claude-opus-4-8";

const SYSTEM = `You are a lead-research agent. Given a research brief, return a JSON array of leads.
Each lead must have: company (name), contact_name, role, email, linkedin_url, and a one-line rationale for fit.
Return ONLY valid JSON — an array of objects. Do not fabricate contacts; if uncertain, mark fields you are unsure about with a "verified": false flag on that lead.`;

export async function runClaudeWrapper(
  env: { CLAUDE_API_KEY?: string },
  agent: AgentSpec,
  task: Task,
): Promise<AdapterResult> {
  if (!env.CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY is not configured");
  }
  const model = agent.endpoint || DEFAULT_MODEL;

  const started = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [{ role: "user", content: task.prompt }],
    }),
  });

  const durationMs = Date.now() - started;
  const data = (await res.json()) as ClaudeResponse;

  if (!res.ok) {
    const msg = (data as unknown as { error?: { message?: string } })?.error?.message;
    throw new Error(`Claude API ${res.status}: ${msg ?? JSON.stringify(data).slice(0, 200)}`);
  }

  // Extract the text output (ignore thinking blocks).
  const output = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // Cost from token usage.
  const price = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  const usage = data.usage || { input_tokens: 0, output_tokens: 0 };
  const costUsd =
    (usage.input_tokens / 1_000_000) * price.in +
    (usage.output_tokens / 1_000_000) * price.out;

  return { output, costUsd, durationMs };
}

interface ClaudeResponse {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens: number; output_tokens: number };
}
