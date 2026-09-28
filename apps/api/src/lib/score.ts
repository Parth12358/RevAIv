// Trust score engine.
//   Trust = 10 * (0.6*Q + 0.2*C + 0.2*S)   -> 0..100
//   Q = mean rubric overall across tasks, each review weighted by reviewer gold_accuracy
//   C = 10 * min(1, categoryMedianCost / agentCostPerTask)
//   S = 10 * min(1, categoryMedianTime / agentTimePerTask)
//   Confidence: <5 tasks Low (unpublished), 5-9 Medium, 10+ High.
import type { Confidence, Env } from "../types";
import { all, first, id, run } from "./db";

export interface ComputedScore {
  quality: number;
  cost: number;
  speed: number;
  trust: number;
  confidence: Confidence;
  reviewedTasks: number;
  published: boolean;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function confidenceFor(reviewedTasks: number): Confidence {
  if (reviewedTasks >= 10) return "high";
  if (reviewedTasks >= 5) return "medium";
  return "low";
}

// Weighted mean of review `overall`, weight = reviewer gold_accuracy (min 0.1
// so an unqualified reviewer still counts a little). Only non-gold reviews of
// real runs feed quality.
async function computeQuality(env: Env, agentVersionId: string): Promise<{ q: number; tasks: number }> {
  const rows = await all<{ overall: number; weight: number; task_id: string }>(
    env,
    `SELECT rv.overall AS overall,
            MAX(rs.gold_accuracy, 0.1) AS weight,
            r.task_id AS task_id
       FROM reviews rv
       JOIN runs r ON r.id = rv.run_id
       LEFT JOIN reviewer_stats rs ON rs.reviewer_id = rv.reviewer_id
      WHERE r.agent_version_id = ?1
        AND rv.is_gold_check = 0`,
    agentVersionId,
  );
  if (rows.length === 0) return { q: 0, tasks: 0 };

  let wsum = 0;
  let w = 0;
  const tasks = new Set<string>();
  for (const row of rows) {
    wsum += row.overall * row.weight;
    w += row.weight;
    tasks.add(row.task_id);
  }
  const q = w > 0 ? wsum / w : 0; // already on 0..10 scale
  return { q, tasks: tasks.size };
}

// Agent's mean cost/time per task, and the category medians across all agents.
async function computeCostSpeed(
  env: Env,
  agentVersionId: string,
  category: string,
): Promise<{ c: number; s: number }> {
  const agentAgg = await first<{ cost: number | null; dur: number | null }>(
    env,
    `SELECT AVG(cost_usd) AS cost, AVG(duration_ms) AS dur
       FROM runs
      WHERE agent_version_id = ?1 AND status = 'done'`,
    agentVersionId,
  );

  // Per-agent-version means within the category, for medians.
  const perVersion = await all<{ cost: number; dur: number }>(
    env,
    `SELECT AVG(r.cost_usd) AS cost, AVG(r.duration_ms) AS dur
       FROM runs r
       JOIN agent_versions av ON av.id = r.agent_version_id
       JOIN agents a ON a.id = av.agent_id
      WHERE a.category = ?1 AND r.status = 'done'
      GROUP BY r.agent_version_id`,
    category,
  );

  const medCost = median(perVersion.map((v) => v.cost).filter((n) => n > 0));
  const medDur = median(perVersion.map((v) => v.dur).filter((n) => n > 0));

  const agentCost = agentAgg?.cost ?? 0;
  const agentDur = agentAgg?.dur ?? 0;

  const c = agentCost > 0 && medCost > 0 ? 10 * Math.min(1, medCost / agentCost) : 10;
  const s = agentDur > 0 && medDur > 0 ? 10 * Math.min(1, medDur / agentDur) : 10;
  return { c, s };
}

export async function recomputeScore(env: Env, agentVersionId: string): Promise<ComputedScore> {
  // Resolve category via the agent.
  const meta = await first<{ category: string }>(
    env,
    `SELECT a.category AS category
       FROM agent_versions av JOIN agents a ON a.id = av.agent_id
      WHERE av.id = ?1`,
    agentVersionId,
  );
  const category = meta?.category ?? "lead_research";

  const { q, tasks } = await computeQuality(env, agentVersionId);
  const { c, s } = await computeCostSpeed(env, agentVersionId, category);

  const trust = 10 * (0.6 * q + 0.2 * c + 0.2 * s);
  const confidence = confidenceFor(tasks);
  // Publish as soon as there is at least one reviewed task so scores appear
  // live in the directory; low confidence is shown honestly until 5+ tasks.
  const published = tasks >= 1;

  // Score-drop flag: compare with the previous published score for this version.
  const prev = await first<{ trust: number }>(
    env,
    `SELECT trust FROM scores WHERE agent_version_id = ?1 ORDER BY computed_at DESC LIMIT 1`,
    agentVersionId,
  );
  const flaggedDrop = prev && prev.trust - trust >= 10 ? 1 : 0;

  await run(
    env,
    `INSERT INTO scores (id, agent_version_id, quality, cost, speed, trust, confidence, reviewed_tasks, published, flagged_drop)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`,
    id("scr"),
    agentVersionId,
    round(q),
    round(c),
    round(s),
    round(trust),
    confidence,
    tasks,
    published ? 1 : 0,
    flaggedDrop,
  );

  return {
    quality: round(q),
    cost: round(c),
    speed: round(s),
    trust: round(trust),
    confidence,
    reviewedTasks: tasks,
    published,
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
