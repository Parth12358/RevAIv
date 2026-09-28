// Adapter registry: maps adapter_type -> runner.
import type { AdapterResult, AdapterType, Env, Task } from "../types";
import { runHttp } from "./http";
import { runClaudeWrapper } from "./claude";
import { runMcp } from "./mcp";
import { runBrainbase } from "./brainbase";
import { runOpenAiChat } from "./openai_chat";

export interface AgentSpec {
  adapter_type: AdapterType;
  endpoint: string | null;      // URL (http/mcp) or model id (claude_wrapper)
  apiKey?: string | null;       // decrypted, if any
  declaredCostUsd?: number | null;
}

export async function runAdapter(
  env: Env,
  agent: AgentSpec,
  task: Task,
): Promise<AdapterResult> {
  switch (agent.adapter_type) {
    case "http":
      return runHttp(agent, task);
    case "openai_chat":
      return runOpenAiChat(agent, task);
    case "claude_wrapper":
      return runClaudeWrapper(env, agent, task);
    case "brainbase":
      return runBrainbase(env, agent, task);
    case "mcp":
      return runMcp(agent, task);
    default:
      throw new Error(`Unknown adapter_type: ${agent.adapter_type}`);
  }
}
