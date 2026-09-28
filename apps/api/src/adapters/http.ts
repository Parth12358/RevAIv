// HTTP adapter: POST the task prompt to the agent's endpoint.
import type { AdapterResult, Task } from "../types";
import type { AgentSpec } from "./index";

const TIMEOUT_MS = 120_000;

export async function runHttp(agent: AgentSpec, task: Task): Promise<AdapterResult> {
  if (!agent.endpoint) throw new Error("http adapter requires an endpoint");

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (agent.apiKey) headers["authorization"] = `Bearer ${agent.apiKey}`;

    const res = await fetch(agent.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt: task.prompt, task_id: task.id }),
      signal: controller.signal,
    });

    const text = await res.text();
    const durationMs = Date.now() - started;

    if (!res.ok) {
      throw new Error(`HTTP agent returned ${res.status}: ${text.slice(0, 200)}`);
    }

    let output: unknown = text;
    try {
      output = JSON.parse(text);
    } catch {
      /* leave as raw text */
    }

    // Cost: response metadata `cost_usd` if provided, else owner-declared price.
    let costUsd = agent.declaredCostUsd ?? 0;
    if (output && typeof output === "object" && "cost_usd" in output) {
      const c = (output as Record<string, unknown>).cost_usd;
      if (typeof c === "number") costUsd = c;
    }

    return { output, costUsd, durationMs };
  } finally {
    clearTimeout(timer);
  }
}
