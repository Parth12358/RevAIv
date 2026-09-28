// Reviewer accuracy accounting: gold checks drive gold_accuracy; <80% pauses.
import type { Env } from "../types";
import { first, run } from "./db";

const PAUSE_THRESHOLD = 0.8;

// Record a gold-check outcome and recompute accuracy. Pauses reviewers <80%.
export async function updateReviewerAccuracy(env: Env, reviewerId: string, passed: boolean): Promise<void> {
  const stats = await first<{ gold_count: number; gold_passed: number }>(
    env,
    `SELECT gold_count, gold_passed FROM reviewer_stats WHERE reviewer_id = ?1`,
    reviewerId,
  );

  const goldCount = (stats?.gold_count ?? 0) + 1;
  const goldPassed = (stats?.gold_passed ?? 0) + (passed ? 1 : 0);
  const accuracy = goldPassed / goldCount;
  const paused = accuracy < PAUSE_THRESHOLD ? 1 : 0;

  await run(
    env,
    `INSERT INTO reviewer_stats (reviewer_id, qualified, gold_accuracy, reviews_count, gold_count, gold_passed, paused)
     VALUES (?1, COALESCE((SELECT qualified FROM reviewer_stats WHERE reviewer_id=?1),0), ?2,
             COALESCE((SELECT reviews_count FROM reviewer_stats WHERE reviewer_id=?1),0)+1, ?3, ?4, ?5)
     ON CONFLICT(reviewer_id) DO UPDATE SET
       gold_accuracy=?2, reviews_count=reviewer_stats.reviews_count+1, gold_count=?3, gold_passed=?4, paused=?5`,
    reviewerId,
    accuracy,
    goldCount,
    goldPassed,
    paused,
  );
}
