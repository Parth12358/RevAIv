// Enqueue runs for an agent version (System/Cron/admin).
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { all, first, id, nowIso, run } from "../lib/db";
import { enqueueRunsForVersion } from "../lib/runner";
import { isCategory } from "../lib/categories";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// POST /runs/enqueue { agent_version_id }
app.post("/enqueue", requireAuth(["admin"]), async (c) => {
  const { agent_version_id } = await c.req.json<{ agent_version_id: string }>();
  if (!agent_version_id) return c.json({ error: "agent_version_id required" }, 400);
  const count = await enqueueRunsForVersion(c.env, agent_version_id);
  return c.json({ enqueued: count });
});

// POST /runs/manual — paste a web-app agent's output for a task. Creates the
// agent/version if new and drops a completed run into the review queue so it is
// indistinguishable from an API run to reviewers.
app.post("/manual", requireAuth(["admin"]), async (c) => {
  const session = c.get("session");
  const body = await c.req.json<{
    agent_name: string;
    category: string;
    task_id: string;
    output: string;
    cost_usd?: number;
    duration_ms?: number;
    owner_url?: string;
  }>();

  if (!body.agent_name || !body.task_id || !body.output) {
    return c.json({ error: "agent_name, task_id and output are required" }, 400);
  }
  const category = isCategory(body.category) ? body.category : "lead_research";

  // Find-or-create the agent by name.
  let agent = await first<{ id: string }>(c.env, `SELECT id FROM agents WHERE name = ?1`, body.agent_name);
  let agentId = agent?.id;
  if (!agentId) {
    agentId = id("agt");
    await run(
      c.env,
      `INSERT INTO agents (id, name, owner_url, category, adapter_type, submitted_by, created_at)
       VALUES (?1,?2,?3,?4,'http',?5,?6)`,
      agentId,
      body.agent_name,
      body.owner_url ?? null,
      category,
      session.userId,
      nowIso(),
    );
  }
  let version = await first<{ id: string }>(
    c.env,
    `SELECT id FROM agent_versions WHERE agent_id = ?1 ORDER BY detected_at DESC LIMIT 1`,
    agentId,
  );
  let versionId = version?.id;
  if (!versionId) {
    versionId = id("ver");
    await run(
      c.env,
      `INSERT INTO agent_versions (id, agent_id, version_label, config_hash, detected_at) VALUES (?1,?2,'manual','manual',?3)`,
      versionId,
      agentId,
      nowIso(),
    );
  }

  const runId = id("run");
  const r2Key = `runs/${runId}.json`;
  await c.env.OUTPUTS.put(r2Key, JSON.stringify({ output: body.output, run_id: runId, task_id: body.task_id }), {
    httpMetadata: { contentType: "application/json" },
  });
  await run(
    c.env,
    `INSERT INTO runs (id, agent_version_id, task_id, status, output_r2_key, output_preview, cost_usd, duration_ms, is_manual, started_at, finished_at, created_at)
     VALUES (?1,?2,?3,'done',?4,?5,?6,?7,1,?8,?8,?8)`,
    runId,
    versionId,
    body.task_id,
    r2Key,
    body.output.slice(0, 500),
    body.cost_usd ?? null,
    body.duration_ms ?? null,
    nowIso(),
  );

  return c.json({ run_id: runId, agent_id: agentId, agent_version_id: versionId });
});

// GET /runs?agent_version_id= — inspect run status (admin/demo).
app.get("/", requireAuth(["admin", "reviewer"]), async (c) => {
  const versionId = c.req.query("agent_version_id");
  const rows = await all<Record<string, unknown>>(
    c.env,
    `SELECT id, task_id, status, cost_usd, duration_ms, output_preview, error
       FROM runs ${versionId ? "WHERE agent_version_id = ?1" : ""} ORDER BY created_at DESC LIMIT 100`,
    ...(versionId ? [versionId] : []),
  );
  return c.json({ runs: rows });
});

export default app;
