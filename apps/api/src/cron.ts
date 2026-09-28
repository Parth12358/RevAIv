// Cron re-testing: re-run agents on a monthly cadence or on detected version
// change, then recompute scores (which flag 10+ point drops). Invoked daily;
// the monthly gate lives here.
import type { Env } from "./types";
import { all } from "./lib/db";
import { enqueueRunsForVersion, executeAll } from "./lib/runner";
import { recomputeScore } from "./lib/score";

const RETEST_AFTER_DAYS = 30;

export async function runScheduled(env: Env): Promise<void> {
  // Versions whose newest score is older than RETEST_AFTER_DAYS (or never scored).
  const due = await all<{ id: string }>(
    env,
    `SELECT av.id AS id
       FROM agent_versions av
       LEFT JOIN (SELECT agent_version_id, MAX(computed_at) mx FROM scores GROUP BY agent_version_id) s
         ON s.agent_version_id = av.id
      WHERE s.mx IS NULL
         OR julianday('now') - julianday(s.mx) >= ?1`,
    RETEST_AFTER_DAYS,
  );

  for (const v of due) {
    const messages = await enqueueRunsForVersion(env, v.id);
    await executeAll(env, messages);
  }

  // Recompute scores for all versions that already have reviews (drop-flagging
  // happens inside recomputeScore).
  const scored = await all<{ id: string }>(
    env,
    `SELECT DISTINCT av.id AS id
       FROM agent_versions av
       JOIN runs r ON r.agent_version_id = av.id
       JOIN reviews rv ON rv.run_id = r.id`,
  );
  for (const v of scored) {
    await recomputeScore(env, v.id);
  }
}
