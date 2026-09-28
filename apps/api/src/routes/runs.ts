// Enqueue runs (execute inline) and paste manual runs.
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { all } from "../lib/db";
import { enqueueRunsForVersion, executeAll, recordManualRun } from "../lib/runner";
import { isCategory } from "../lib/categories";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// POST /runs/enqueue { agent_version_id } — create run rows and execute them in
// the background (ctx.waitUntil), then the caller can recompute the score.
app.post("/enqueue", requireAuth(["admin"]), async (c) => {
  const { agent_version_id } = await c.req.json<{ agent_version_id: string }>();
  if (!agent_version_id) return c.json({ error: "agent_version_id required" }, 400);
  const messages = await enqueueRunsForVersion(c.env, agent_version_id);
  c.executionCtx.waitUntil(executeAll(c.env, messages));
  return c.json({ enqueued: messages.length });
});

// POST /runs/manual — paste a web-app agent's output for a task. Creates the
// agent/version if new and drops a completed run into the review queue.
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
  const result = await recordManualRun(c.env, { ...body, category, submitted_by: session.userId });
  return c.json(result);
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
