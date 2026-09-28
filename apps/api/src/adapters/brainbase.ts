// Brainbase adapter: run a Brainbase-hosted cloud agent via the threads API.
//   POST /v2/threads { agent: {harness, instructions, model}, input } -> thread_id
//   GET  /v2/threads/{id}/messages -> { items: [{role, content}] }
// The agent's `endpoint` field encodes "harness:model" (default claude_code:claude-sonnet-5).
import type { AdapterResult, Task } from "../types";
import type { AgentSpec } from "./index";

const BASE = "https://api.brainbaselabs.com";
const POLL_MS = 3000;
const MAX_WAIT_MS = 120_000;

const INSTRUCTIONS =
  "You are an expert completing a work task for evaluation. Read the task and return the best possible answer, showing any working. Be specific and do not fabricate facts; flag uncertainty where it exists.";

export async function runBrainbase(
  env: { BRAINBASE_API_KEY?: string },
  agent: AgentSpec,
  task: Task,
): Promise<AdapterResult> {
  const key = agent.apiKey || env.BRAINBASE_API_KEY;
  if (!key) throw new Error("BRAINBASE_API_KEY is not configured");

  const [harness, model] = (agent.endpoint || "claude_code:claude-sonnet-5").split(":");
  const started = Date.now();

  const createRes = await fetch(`${BASE}/v2/threads`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      agent: { harness: harness || "claude_code", instructions: INSTRUCTIONS, model: model || "claude-sonnet-5" },
      input: task.prompt,
    }),
  });
  const created = (await createRes.json()) as { thread_id?: string; error?: string };
  if (!createRes.ok || !created.thread_id) {
    throw new Error(`Brainbase create ${createRes.status}: ${created.error ?? JSON.stringify(created).slice(0, 200)}`);
  }

  // Poll for the assistant's reply.
  let output = "";
  while (Date.now() - started < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const msgRes = await fetch(`${BASE}/v2/threads/${created.thread_id}/messages`, {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!msgRes.ok) continue;
    const data = (await msgRes.json()) as { items?: { role: string; content: string }[] };
    const assistant = (data.items ?? []).filter((m) => m.role === "assistant").map((m) => m.content).join("\n").trim();
    if (assistant) {
      output = assistant;
      break;
    }
  }
  if (!output) throw new Error("Brainbase agent did not return output within the timeout");

  return { output, costUsd: agent.declaredCostUsd ?? 0, durationMs: Date.now() - started };
}
