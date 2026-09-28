// Reviewer qualification + public profiles (the face behind the review).
import { Hono } from "hono";
import type { Env, RubricDim } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { all, first, run } from "../lib/db";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// GET /reviewers/me — own stats + profile.
app.get("/me", requireAuth(["reviewer", "admin"]), async (c) => {
  const session = c.get("session");
  const stats = await first<Record<string, unknown>>(
    c.env,
    `SELECT rs.*, u.display_name FROM reviewer_stats rs
       LEFT JOIN users u ON u.id = rs.reviewer_id WHERE rs.reviewer_id = ?1`,
    session.userId,
  );
  if (stats && typeof stats.expertise_json === "string") {
    (stats as any).expertise = JSON.parse(stats.expertise_json as string);
  }
  return c.json({ stats: stats ?? null });
});

// GET /reviewers/public — roster of qualified reviewers with profiles.
app.get("/public", async (c) => {
  const rows = await all<Record<string, unknown>>(
    c.env,
    `SELECT u.id, u.display_name, rs.headline, rs.expertise_json, rs.bio, rs.country,
            rs.gold_accuracy, rs.reviews_count
       FROM reviewer_stats rs JOIN users u ON u.id = rs.reviewer_id
      WHERE rs.qualified = 1
      ORDER BY rs.reviews_count DESC`,
  );
  for (const r of rows) if (typeof r.expertise_json === "string") (r as any).expertise = JSON.parse(r.expertise_json as string);
  return c.json({ reviewers: rows });
});

// GET /reviewers/qualify — fetch a gold qualification task.
app.get("/qualify", requireAuth(["reviewer", "admin"]), async (c) => {
  const gold = await first<{ id: string; prompt: string; rubric_json: string }>(
    c.env,
    `SELECT id, prompt, rubric_json FROM tasks WHERE is_gold = 1 AND active = 1 ORDER BY RANDOM() LIMIT 1`,
  );
  if (!gold) return c.json({ error: "no qualification task available" }, 404);
  return c.json({ task_id: gold.id, prompt: gold.prompt, rubric: JSON.parse(gold.rubric_json) as RubricDim[] });
});

// POST /reviewers/qualify { task_id, scores } — pass if within 1 pt of gold.
app.post("/qualify", requireAuth(["reviewer", "admin"]), async (c) => {
  const session = c.get("session");
  const body = await c.req.json<{ task_id: string; scores: Record<string, number> }>();

  const task = await first<{ gold_answer_json: string | null }>(
    c.env,
    `SELECT gold_answer_json FROM tasks WHERE id = ?1 AND is_gold = 1`,
    body.task_id,
  );
  if (!task?.gold_answer_json) return c.json({ error: "invalid qualification task" }, 400);

  const vals = Object.values(body.scores).filter((n) => typeof n === "number");
  const overall = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const goldOverall = (JSON.parse(task.gold_answer_json) as { overall?: number }).overall ?? 0;
  const delta = Math.abs(overall - goldOverall);
  const qualified = delta <= 1;

  await run(
    c.env,
    `INSERT INTO reviewer_stats (reviewer_id, qualified, gold_accuracy, reviews_count, gold_count, gold_passed, paused)
     VALUES (?1, ?2, ?3, 0, 1, ?4, 0)
     ON CONFLICT(reviewer_id) DO UPDATE SET
       qualified=?2,
       gold_count=reviewer_stats.gold_count+1,
       gold_passed=reviewer_stats.gold_passed+?4,
       gold_accuracy=(reviewer_stats.gold_passed+?4)*1.0/(reviewer_stats.gold_count+1)`,
    session.userId,
    qualified ? 1 : 0,
    qualified ? 1.0 : 0.0,
    qualified ? 1 : 0,
  );

  return c.json({ qualified, delta, your_overall: overall });
});

export default app;
