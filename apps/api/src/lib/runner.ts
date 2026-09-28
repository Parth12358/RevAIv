// Enqueue runs and execute queued runs (the Queue consumer body).
import type { Env, RunMessage, Task } from "../types";
import { all, first, id, nowIso, run } from "./db";
import { runAdapter, type AgentSpec } from "../adapters";
import { decryptSecret } from "./crypto";

// Create run rows (status=queued) for every active, non-gold task in the
// agent's category, and enqueue a message per run. Returns the run count.
export async function enqueueRunsForVersion(env: Env, agentVersionId: string): Promise<number> {
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
    const msg: RunMessage = { run_id: runId, agent_version_id: agentVersionId, task_id: task.id };
    await env.RUN_QUEUE.send(msg);
  }
  return tasks.length;
}

// Execute a single queued run: call the adapter, store output in R2, record the
// run row. Throws on failure so the queue can retry (up to max_retries).
export async function executeRun(env: Env, msg: RunMessage): Promise<void> {
  const runRow = await first<{ id: string; attempts: number; status: string }>(
    env,
    `SELECT id, attempts, status FROM runs WHERE id = ?1`,
    msg.run_id,
  );
  if (!runRow) return; // run was deleted; nothing to do
  if (runRow.status === "done") return; // idempotent

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

    const r2Key = `runs/${msg.run_id}.json`;
    await env.OUTPUTS.put(
      r2Key,
      JSON.stringify({ output: result.output, run_id: msg.run_id, task_id: msg.task_id }),
      { httpMetadata: { contentType: "application/json" } },
    );

    const preview =
      typeof result.output === "string"
        ? result.output.slice(0, 500)
        : JSON.stringify(result.output).slice(0, 500);

    await run(
      env,
      `UPDATE runs SET status='done', output_r2_key=?2, output_preview=?3, cost_usd=?4, duration_ms=?5, finished_at=?6, error=NULL
         WHERE id=?1`,
      msg.run_id,
      r2Key,
      preview,
      result.costUsd,
      result.durationMs,
      nowIso(),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await run(
      env,
      `UPDATE runs SET status='failed', error=?2, finished_at=?3 WHERE id=?1`,
      msg.run_id,
      message,
      nowIso(),
    );
    throw err; // surface for queue retry
  }
}
