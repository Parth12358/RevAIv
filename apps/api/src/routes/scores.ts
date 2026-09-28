// Recompute a trust score for an agent version.
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { recomputeScore } from "../lib/score";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// POST /scores/recompute/:versionId
app.post("/recompute/:versionId", requireAuth(["admin", "reviewer"]), async (c) => {
  const versionId = c.req.param("versionId");
  if (!versionId) return c.json({ error: "versionId required" }, 400);
  const score = await recomputeScore(c.env, versionId);
  return c.json({ score });
});

export default app;
