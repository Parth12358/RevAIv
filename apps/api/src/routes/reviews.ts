// Reviewer queue: claim next output (blind; ~10% gold), submit rubric scores.
import { Hono } from "hono";
import type { Env, RubricDim } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { all, first, id, nowIso, run } from "../lib/db";
import { updateReviewerAccuracy } from "../lib/reviewers";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

const GOLD_INJECT_RATE = 0.1; // ~10% of the queue is a hidden gold task

// GET /reviews/next — claim the next unreviewed output for this reviewer.
// The response never reveals which agent produced the output (blind review).
// With ~10% probability, returns a hidden gold task instead of a real run.
app.get("/next", requireAuth(["reviewer", "admin"]), async (c) => {
  const session = c.get("session");

  // Reviewer must be qualified (admins bypass).
  const stats = await first<{ qualified: number; paused: number }>(
    c.env,
    `SELECT qualified, paused FROM reviewer_stats WHERE reviewer_id = ?1`,
    session.userId,
  );
  if (session.role === "reviewer") {
    if (!stats || stats.qualified !== 1) return c.json({ error: "not qualified", needs_qualification: true }, 403);
    if (stats.paused === 1) return c.json({ error: "reviewer paused" }, 403);
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

  // Find a done run this reviewer hasn't reviewed yet.
  const runRow = await first<{ id: string; task_id: string; output_r2_key: string | null; output_preview: string | null }>(
    c.env,
    `SELECT r.id, r.task_id, r.output_r2_key, r.output_preview
       FROM runs r
      WHERE r.status = 'done'
        AND NOT EXISTS (SELECT 1 FROM reviews rv WHERE rv.run_id = r.id AND rv.reviewer_id = ?1)
      ORDER BY r.finished_at ASC
      LIMIT 1`,
    session.userId,
  );
  if (!runRow) return c.json({ review_target: null, message: "queue empty" });

  const task = await first<{ prompt: string; rubric_json: string }>(
    c.env,
    `SELECT prompt, rubric_json FROM tasks WHERE id = ?1`,
    runRow.task_id,
  );

  // Load full output from R2 (fall back to preview).
  let output: unknown = runRow.output_preview;
  if (runRow.output_r2_key) {
    const obj = await c.env.OUTPUTS.get(runRow.output_r2_key);
    if (obj) {
      const parsed = (await obj.json()) as { output?: unknown };
      output = parsed.output ?? output;
    }
  }

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

  return c.json({ ok: true, overall, is_gold_check: isGoldCheck });
});

export default app;
