// Task library: public category list + reviewer-authored tasks.
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { all, first, id, nowIso, run } from "../lib/db";
import { CATEGORIES, GENERAL_RUBRIC, isCategory } from "../lib/categories";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// GET /tasks/categories — public field catalog.
app.get("/categories", (c) => c.json({ categories: CATEGORIES }));

// GET /tasks — reviewers see their own; admins see all.
app.get("/", requireAuth(["reviewer", "admin"]), async (c) => {
  const session = c.get("session");
  const rows =
    session.role === "admin"
      ? await all<Record<string, unknown>>(
          c.env,
          `SELECT id, category, prompt, is_gold, status, active, created_by, created_at
             FROM tasks ORDER BY (created_at IS NULL), created_at DESC`,
        )
      : await all<Record<string, unknown>>(
          c.env,
          `SELECT id, category, prompt, is_gold, status, active, created_by, created_at
             FROM tasks WHERE created_by = ?1 ORDER BY created_at DESC`,
          session.userId,
        );
  return c.json({ tasks: rows });
});

// POST /tasks — author a task. Reviewer tasks start pending; admin tasks go live.
app.post("/", requireAuth(["reviewer", "admin"]), async (c) => {
  const session = c.get("session");
  const body = await c.req.json<{
    category: string;
    prompt: string;
    expected_answer?: string;
    great_answer?: string;
    common_mistakes?: string;
    is_gold?: boolean;
  }>();

  if (!body.category || !isCategory(body.category)) return c.json({ error: "valid category required" }, 400);
  if (!body.prompt || body.prompt.trim().length < 20) return c.json({ error: "a substantive prompt is required" }, 400);

  const isAdmin = session.role === "admin";
  const isGold = isAdmin && !!body.is_gold;
  const status = isAdmin ? "active" : "pending";
  const active = isAdmin ? 1 : 0;

  const taskId = id("tsk");
  await run(
    c.env,
    `INSERT INTO tasks (id, category, prompt, rubric_json, is_gold, gold_answer_json, active, status,
                        created_by, expected_answer, great_answer, common_mistakes)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`,
    taskId,
    body.category,
    body.prompt.trim(),
    JSON.stringify(GENERAL_RUBRIC),
    isGold ? 1 : 0,
    isGold && body.expected_answer ? JSON.stringify({ overall: 9, notes: body.expected_answer }) : null,
    active,
    status,
    session.userId,
    body.expected_answer ?? null,
    body.great_answer ?? null,
    body.common_mistakes ?? null,
  );

  return c.json({ task_id: taskId, status });
});

export default app;
