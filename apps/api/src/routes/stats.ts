// Public aggregate stats for the marketing landing + ticker (no gated data).
import { Hono } from "hono";
import type { Env } from "../types";
import { first } from "../lib/db";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const row = await first<{
    agents: number;
    scored: number;
    reviewers: number;
    tasks: number;
    avg_trust: number | null;
  }>(
    c.env,
    `SELECT
       (SELECT COUNT(*) FROM agents) AS agents,
       (SELECT COUNT(DISTINCT agent_version_id) FROM scores WHERE published = 1) AS scored,
       (SELECT COUNT(*) FROM users WHERE role = 'reviewer') AS reviewers,
       (SELECT COUNT(*) FROM tasks WHERE active = 1) AS tasks,
       (SELECT AVG(trust) FROM scores WHERE published = 1) AS avg_trust`,
  );
  return c.json({
    agents: row?.agents ?? 0,
    scored: row?.scored ?? 0,
    reviewers: row?.reviewers ?? 0,
    tasks: row?.tasks ?? 0,
    avg_trust: row?.avg_trust ? Math.round(row.avg_trust) : null,
  });
});

export default app;
