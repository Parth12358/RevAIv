// MCP adapter: call the agent's tool through a minimal MCP-over-HTTP (Streamable
// HTTP / JSON-RPC) request. This is the thinnest adapter and first on the cut
// list; it implements a single `tools/call` round-trip against the endpoint.
import type { AdapterResult, Task } from "../types";
import type { AgentSpec } from "./index";

const TIMEOUT_MS = 120_000;

export async function runMcp(agent: AgentSpec, task: Task): Promise<AdapterResult> {
  if (!agent.endpoint) throw new Error("mcp adapter requires an endpoint");

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    };
    if (agent.apiKey) headers["authorization"] = `Bearer ${agent.apiKey}`;

    const res = await fetch(agent.endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "research", arguments: { brief: task.prompt } },
      }),
    });

    const text = await res.text();
    const durationMs = Date.now() - started;
    if (!res.ok) throw new Error(`MCP agent returned ${res.status}: ${text.slice(0, 200)}`);

    let output: unknown = text;
    try {
      const json = JSON.parse(text) as { result?: unknown };
      output = json.result ?? json;
    } catch {
      /* leave raw */
    }

    return { output, costUsd: agent.declaredCostUsd ?? 0, durationMs };
  } finally {
    clearTimeout(timer);
  }
}
