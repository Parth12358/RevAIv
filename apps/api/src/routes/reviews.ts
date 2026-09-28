// Reviewer queue: claim next output (blind; ~10% gold), submit rubric scores.
import { Hono } from "hono";
import type { Env, RubricDim } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { all, first, id, nowIso, run } from "../lib/db";
import { updateReviewerAccuracy } from "../lib/reviewers";
import { recomputeScore } from "../lib/score";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

const GOLD_INJECT_RATE = 0.1; // ~10% of the queue is a hidden gold task

// GET /reviews/next — claim the next unreviewed output for this reviewer.
// The response never reveals which agent produced the output (blind review).
// With ~10% probability, returns a hidden gold task instead of a real run.
app.get("/next", requireAuth(["reviewer", "admin"]), async (c) => {
  const session = c.get("session");

  // Reviewer must be qualified (admins bypass).
  const stats = await first<{ qualified: number; paused: number; expertise_json: string | null }>(
    c.env,
    `SELECT qualified, paused, expertise_json FROM reviewer_stats WHERE reviewer_id = ?1`,
    session.userId,
  );
  if (session.role === "reviewer") {
    if (!stats || stats.qualified !== 1) return c.json({ error: "not qualified", needs_qualification: true }, 403);
    if (stats.paused === 1) return c.json({ error: "reviewer paused" }, 403);
  }

  // The reviewer's chosen fields — we serve outputs in these first.
  let expertise: string[] = [];
  try {
    expertise = stats?.expertise_json ? (JSON.parse(stats.expertise_json) as string[]) : [];
  } catch {
    expertise = [];
  }

  // Deterministic-ish gold injection based on a random draw.
  const injectGold = crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff < GOLD_INJECT_RATE;

  if (injectGold) {
    const gold = await first<{ id: string; prompt: string; rubric_json: string }>(
      c.env,
      `SELECT id, prompt, rubric_json FROM tasks WHERE is_gold = 1 AND active = 1 ORDER BY RANDOM() LIMIT 1`,
    );
    if (gold) {
      return c.json({
        review_target: {
          kind: "gold", // client is NOT told this is gold in production; kept here for demo transparency
          task_id: gold.id,
          prompt: gold.prompt,
          rubric: JSON.parse(gold.rubric_json) as RubricDim[],
          // synthetic "output" for the reviewer to grade — the gold prompt is self-contained
          output: "(Reviewer: assess an answer to the brief above using the rubric.)",
        },
      });
    }
  }

  // Runs the reviewer chose to skip this session (client-supplied).
  const exclude = (c.req.query("exclude") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const exSql = (start: number) => (exclude.length ? ` AND r.id NOT IN (${exclude.map((_, i) => `?${start + i}`).join(",")})` : "");

  // Find a done run this reviewer hasn't reviewed yet. Prefer the reviewer's
  // chosen fields; fall back to any field if none are left in their fields.
  type RunRow = { id: string; task_id: string; output_full: string | null; output_preview: string | null };
  let runRow: RunRow | null = null;

  if (expertise.length) {
    const placeholders = expertise.map((_, i) => `?${i + 2}`).join(",");
    runRow = await first<RunRow>(
      c.env,
      `SELECT r.id, r.task_id, r.output_full, r.output_preview
         FROM runs r JOIN tasks t ON t.id = r.task_id
        WHERE r.status = 'done'
          AND t.category IN (${placeholders})
          AND NOT EXISTS (SELECT 1 FROM reviews rv WHERE rv.run_id = r.id AND rv.reviewer_id = ?1)${exSql(2 + expertise.length)}
        ORDER BY r.finished_at ASC
        LIMIT 1`,
      session.userId,
      ...expertise,
      ...exclude,
    );
  }

  if (!runRow) {
    runRow = await first<RunRow>(
      c.env,
      `SELECT r.id, r.task_id, r.output_full, r.output_preview
         FROM runs r
        WHERE r.status = 'done'
          AND NOT EXISTS (SELECT 1 FROM reviews rv WHERE rv.run_id = r.id AND rv.reviewer_id = ?1)${exSql(2)}
        ORDER BY r.finished_at ASC
        LIMIT 1`,
      session.userId,
      ...exclude,
    );
  }
  if (!runRow) return c.json({ review_target: null, message: "queue empty" });

  const task = await first<{ prompt: string; rubric_json: string }>(
    c.env,
    `SELECT prompt, rubric_json FROM tasks WHERE id = ?1`,
    runRow.task_id,
  );

  const output: unknown = runRow.output_full ?? runRow.output_preview;

  return c.json({
    review_target: {
      kind: "run",
      run_id: runRow.id,
      task_id: runRow.task_id,
      prompt: task?.prompt,
      rubric: task ? (JSON.parse(task.rubric_json) as RubricDim[]) : [],
      output, // agent identity is deliberately omitted
    },
  });
});

// POST /reviews — submit rubric scores + reason.
app.post("/", requireAuth(["reviewer", "admin"]), async (c) => {
  const session = c.get("session");
  const body = await c.req.json<{
    run_id?: string;
    task_id: string;
    scores: Record<string, number>; // {accuracy, deliverability, fit, completeness}
    reason: string;
  }>();

  if (!body.task_id || !body.scores || !body.reason || body.reason.trim().length < 10) {
    return c.json({ error: "task_id, scores, and a substantive reason (>=10 chars) are required" }, 400);
  }

  const vals = Object.values(body.scores).filter((n) => typeof n === "number");
  const overall = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

  // Is this a gold check? (task marked is_gold and no real run attached)
  const task = await first<{ is_gold: number; gold_answer_json: string | null }>(
    c.env,
    `SELECT is_gold, gold_answer_json FROM tasks WHERE id = ?1`,
    body.task_id,
  );
  const isGoldCheck = task?.is_gold === 1 && !body.run_id;

  let goldDelta: number | null = null;
  if (isGoldCheck && task?.gold_answer_json) {
    const goldOverall = (JSON.parse(task.gold_answer_json) as { overall?: number }).overall ?? 0;
    goldDelta = Math.abs(overall - goldOverall);
  }

  await run(
    c.env,
    `INSERT INTO reviews (id, run_id, task_id, reviewer_id, scores_json, overall, reason, is_gold_check, gold_delta, created_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`,
    id("rev"),
    body.run_id ?? null,
    body.task_id,
    session.userId,
    JSON.stringify(body.scores),
    overall,
    body.reason.trim(),
    isGoldCheck ? 1 : 0,
    goldDelta,
    nowIso(),
  );

  // Gold check feeds reviewer accuracy (within 1 point = pass).
  if (isGoldCheck && goldDelta !== null) {
    await updateReviewerAccuracy(c.env, session.userId, goldDelta <= 1);
  }

  // Bump the reviewer's review count so earnings/stats reflect real reviews.
  await run(c.env, `UPDATE reviewer_stats SET reviews_count = reviews_count + 1 WHERE reviewer_id = ?1`, session.userId);

  // Auto-recompute the reviewed agent's score so it updates live in the directory.
  if (body.run_id && !isGoldCheck) {
    const av = await first<{ agent_version_id: string }>(
      c.env,
      `SELECT agent_version_id FROM runs WHERE id = ?1`,
      body.run_id,
    );
    if (av) c.executionCtx.waitUntil(recomputeScore(c.env, av.agent_version_id).then(() => {}).catch(() => {}));
  }

  return c.json({ ok: true, overall, is_gold_check: isGoldCheck });
});

export default app;
