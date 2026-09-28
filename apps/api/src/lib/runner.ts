// Create run rows and execute them. Outputs are stored in D1 (no R2); runs
// execute inline via ctx.waitUntil (no Queues) so the app runs free.
import type { Env, RunMessage, Task } from "../types";
import { all, first, id, nowIso, run } from "./db";
import { runAdapter, type AgentSpec } from "../adapters";
import { decryptSecret } from "./crypto";

// Create run rows (status=queued) for every active, non-gold task in the
// agent's category. Returns the RunMessages so the caller can execute them
// (typically via ctx.waitUntil).
export async function enqueueRunsForVersion(env: Env, agentVersionId: string): Promise<RunMessage[]> {
  const agent = await first<{ category: string }>(
    env,
    `SELECT a.category AS category
       FROM agent_versions av JOIN agents a ON a.id = av.agent_id
      WHERE av.id = ?1`,
    agentVersionId,
  );
  if (!agent) throw new Error(`agent_version ${agentVersionId} not found`);

  const tasks = await all<{ id: string }>(
    env,
    `SELECT id FROM tasks WHERE category = ?1 AND active = 1 AND is_gold = 0`,
    agent.category,
  );

  const messages: RunMessage[] = [];
  for (const task of tasks) {
    const runId = id("run");
    await run(
      env,
      `INSERT INTO runs (id, agent_version_id, task_id, status, created_at) VALUES (?1,?2,?3,'queued',?4)`,
      runId,
      agentVersionId,
      task.id,
      nowIso(),
    );
    messages.push({ run_id: runId, agent_version_id: agentVersionId, task_id: task.id });
  }
  return messages;
}

// Execute all messages, swallowing per-run errors (they are recorded on the row).
export async function executeAll(env: Env, messages: RunMessage[]): Promise<void> {
  for (const m of messages) {
    await executeRun(env, m).catch(() => {});
  }
}

// Execute a single queued run: call the adapter, store the output in D1, record
// the run row. Throws on failure (the row is marked failed first).
export async function executeRun(env: Env, msg: RunMessage): Promise<void> {
  const runRow = await first<{ id: string; attempts: number; status: string }>(
    env,
    `SELECT id, attempts, status FROM runs WHERE id = ?1`,
    msg.run_id,
  );
  if (!runRow) return;
  if (runRow.status === "done") return;

  await run(
    env,
    `UPDATE runs SET status='running', attempts=attempts+1, started_at=?2 WHERE id=?1`,
    msg.run_id,
    nowIso(),
  );

  const task = await first<Task>(env, `SELECT * FROM tasks WHERE id = ?1`, msg.task_id);
  const agentRow = await first<{
    adapter_type: AgentSpec["adapter_type"];
    endpoint: string | null;
    api_key_enc: string | null;
    declared_cost_usd: number | null;
  }>(
    env,
    `SELECT a.adapter_type, a.endpoint, a.api_key_enc, a.declared_cost_usd
       FROM agent_versions av JOIN agents a ON a.id = av.agent_id
      WHERE av.id = ?1`,
    msg.agent_version_id,
  );
  if (!task || !agentRow) throw new Error("missing task or agent for run");

  let apiKey: string | null = null;
  if (agentRow.api_key_enc && env.ENCRYPTION_KEY) {
    apiKey = await decryptSecret(agentRow.api_key_enc, env.ENCRYPTION_KEY);
  }

  const spec: AgentSpec = {
    adapter_type: agentRow.adapter_type,
    endpoint: agentRow.endpoint,
    apiKey,
    declaredCostUsd: agentRow.declared_cost_usd,
  };

  try {
    const result = await runAdapter(env, spec, task);
    const full = typeof result.output === "string" ? result.output : JSON.stringify(result.output);
    await run(
      env,
      `UPDATE runs SET status='done', output_full=?2, output_preview=?3, cost_usd=?4, duration_ms=?5, finished_at=?6, error=NULL
         WHERE id=?1`,
      msg.run_id,
      full,
      full.slice(0, 500),
      result.costUsd,
      result.durationMs,
      nowIso(),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await run(env, `UPDATE runs SET status='failed', error=?2, finished_at=?3 WHERE id=?1`, msg.run_id, message, nowIso());
    throw err;
  }
}
