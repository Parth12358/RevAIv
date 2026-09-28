// Operator ingestion — lets a Brainbase worker (or any operator script) pull the
// task list and post agent outputs into the review queue without a user session.
// Auth: Authorization: Bearer <OPERATOR_TOKEN>.
import { Hono } from "hono";
import type { Env } from "../types";
import { all } from "../lib/db";
import { recordManualRun } from "../lib/runner";
import { isCategory } from "../lib/categories";

const app = new Hono<{ Bindings: Env }>();

function authed(c: { req: { header: (n: string) => string | undefined }; env: Env }): boolean {
  const h = c.req.header("authorization");
  const token = h?.startsWith("Bearer ") ? h.slice(7) : undefined;
  return !!c.env.OPERATOR_TOKEN && token === c.env.OPERATOR_TOKEN;
}

// GET /ingest/tasks?category= — active, non-gold tasks for the operator to run.
app.get("/tasks", async (c) => {
  if (!authed(c)) return c.json({ error: "unauthorized" }, 401);
  const category = c.req.query("category");
  const rows = await all<Record<string, unknown>>(
    c.env,
    `SELECT id, category, prompt FROM tasks
      WHERE active = 1 AND is_gold = 0 ${category ? "AND category = ?1" : ""}
      ORDER BY category`,
    ...(category ? [category] : []),
  );
  return c.json({ tasks: rows });
});

// POST /ingest/run — record an agent's output for a task (enters the review queue).
app.post("/run", async (c) => {
  if (!authed(c)) return c.json({ error: "unauthorized" }, 401);
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
  const result = await recordManualRun(c.env, { ...body, category });
  return c.json(result);
});

export default app;
