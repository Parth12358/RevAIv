// Admin: full DB visibility + control over listings and task approvals.
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { all, first, run } from "../lib/db";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

app.use("*", requireAuth(["admin"]));

// GET /admin/overview — headline counts.
app.get("/overview", async (c) => {
  const row = await first<Record<string, number>>(
    c.env,
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role='member') AS customers,
       (SELECT COUNT(*) FROM users WHERE role='reviewer') AS reviewers,
       (SELECT COUNT(*) FROM users WHERE membership_active=1) AS paying,
       (SELECT COUNT(*) FROM agents) AS agents,
       (SELECT COUNT(*) FROM agents WHERE 1=1) AS listed,
       (SELECT COUNT(*) FROM runs WHERE status='done') AS runs_done,
       (SELECT COUNT(*) FROM runs WHERE status='failed') AS runs_failed,
       (SELECT COUNT(*) FROM reviews) AS reviews,
       (SELECT COUNT(*) FROM tasks WHERE status='pending') AS tasks_pending,
       (SELECT COUNT(*) FROM tasks) AS tasks,
       (SELECT COALESCE(SUM(amount_usd),0) FROM payments WHERE status='paid') AS revenue`,
  );
  return c.json({ overview: row });
});

// Data tables
app.get("/users", async (c) =>
  c.json({
    users: await all(
      c.env,
      `SELECT id, email, role, display_name, company, membership_active, onboarded, created_at FROM users ORDER BY created_at DESC`,
    ),
  }),
);

app.get("/agents", async (c) =>
  c.json({
    agents: await all(
      c.env,
      `SELECT a.id, a.name, a.category, a.adapter_type, a.created_at,
              av.id AS version_id,
              (SELECT trust FROM scores s WHERE s.agent_version_id = av.id ORDER BY computed_at DESC LIMIT 1) AS trust
         FROM agents a
         LEFT JOIN agent_versions av ON av.agent_id = a.id
         GROUP BY a.id ORDER BY a.created_at DESC`,
    ),
  }),
);

app.get("/tasks", async (c) =>
  c.json({
    tasks: await all(
      c.env,
      `SELECT t.id, t.category, t.prompt, t.is_gold, t.status, t.active, t.created_by, u.display_name AS author
         FROM tasks t LEFT JOIN users u ON u.id = t.created_by ORDER BY (t.status='pending') DESC, t.id`,
    ),
  }),
);

app.get("/reviews", async (c) =>
  c.json({
    reviews: await all(
      c.env,
      `SELECT rv.id, rv.overall, rv.reason, rv.is_gold_check, rv.created_at, u.display_name AS reviewer, u.email
         FROM reviews rv LEFT JOIN users u ON u.id = rv.reviewer_id ORDER BY rv.created_at DESC LIMIT 100`,
    ),
  }),
);

// Controls
app.post("/tasks/:id/status", async (c) => {
  const taskId = c.req.param("id");
  const { status } = await c.req.json<{ status: "active" | "rejected" | "pending" }>();
  const active = status === "active" ? 1 : 0;
  await run(c.env, `UPDATE tasks SET status = ?2, active = ?3 WHERE id = ?1`, taskId, status, active);
  return c.json({ ok: true, status });
});

export default app;
