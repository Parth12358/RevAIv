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

// Record a manually-produced (or operator-ingested) agent output as a completed
// run. Creates the agent/version if new. Shared by the admin form and the
// Brainbase/operator ingestion endpoint.
export async function recordManualRun(
  env: Env,
  p: {
    agent_name: string;
    category: string;
    task_id: string;
    output: string;
    cost_usd?: number;
    duration_ms?: number;
    owner_url?: string;
    submitted_by?: string;
  },
): Promise<{ run_id: string; agent_id: string; agent_version_id: string }> {
  let agent = await first<{ id: string }>(env, `SELECT id FROM agents WHERE name = ?1`, p.agent_name);
  let agentId = agent?.id;
  if (!agentId) {
    agentId = id("agt");
    await run(
      env,
      `INSERT INTO agents (id, name, owner_url, category, adapter_type, submitted_by, created_at)
       VALUES (?1,?2,?3,?4,'http',?5,?6)`,
      agentId,
      p.agent_name,
      p.owner_url ?? null,
      p.category,
      p.submitted_by ?? null,
      nowIso(),
    );
  }
  let version = await first<{ id: string }>(
    env,
    `SELECT id FROM agent_versions WHERE agent_id = ?1 ORDER BY detected_at DESC LIMIT 1`,
    agentId,
  );
  let versionId = version?.id;
  if (!versionId) {
    versionId = id("ver");
    await run(
      env,
      `INSERT INTO agent_versions (id, agent_id, version_label, config_hash, detected_at) VALUES (?1,?2,'manual','manual',?3)`,
      versionId,
      agentId,
      nowIso(),
    );
  }

  const runId = id("run");
  await run(
    env,
    `INSERT INTO runs (id, agent_version_id, task_id, status, output_full, output_preview, cost_usd, duration_ms, is_manual, started_at, finished_at, created_at)
     VALUES (?1,?2,?3,'done',?4,?5,?6,?7,1,?8,?8,?8)`,
    runId,
    versionId,
    p.task_id,
    p.output,
    p.output.slice(0, 500),
    p.cost_usd ?? null,
    p.duration_ms ?? null,
    nowIso(),
  );
  return { run_id: runId, agent_id: agentId, agent_version_id: versionId };
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
