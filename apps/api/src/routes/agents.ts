// Agent directory + submission.
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { all, first, id, nowIso, run } from "../lib/db";
import { requireAuth, requireMembership } from "../lib/auth";
import { encryptSecret } from "../lib/crypto";
import { createVettingCheckout } from "../lib/stripe";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// GET /agents?category=&sort=  — directory with latest published score.
// Public for the demo so anyone can browse the ledger.
app.get("/", async (c) => {
  const category = c.req.query("category");
  const sort = c.req.query("sort") ?? "trust"; // trust | cost | speed

  const sortCol = sort === "cost" ? "s.cost" : sort === "speed" ? "s.speed" : "s.trust";

  const rows = await all<Record<string, unknown>>(
    c.env,
    `SELECT a.id, a.name, a.category, a.adapter_type, a.owner_url,
            s.trust, s.quality, s.cost, s.speed, s.confidence, s.flagged_drop, s.computed_at
       FROM agents a
       LEFT JOIN agent_versions av ON av.agent_id = a.id
       LEFT JOIN (
         -- latest published score per version
         SELECT s1.* FROM scores s1
         JOIN (SELECT agent_version_id, MAX(computed_at) mx FROM scores WHERE published=1 GROUP BY agent_version_id) last
           ON last.agent_version_id = s1.agent_version_id AND last.mx = s1.computed_at
       ) s ON s.agent_version_id = av.id
      ${category ? "WHERE a.category = ?1" : ""}
      GROUP BY a.id
      ORDER BY ${sortCol} DESC NULLS LAST`,
    ...(category ? [category] : []),
  );
  return c.json({ agents: rows });
});

// GET /agents/:id — score breakdown + version history (membership-gated).
app.get("/:id", requireMembership(), async (c) => {
  const agentId = c.req.param("id");
  const agent = await first<Record<string, unknown>>(
    c.env,
    `SELECT id, name, category, adapter_type, owner_url, created_at FROM agents WHERE id = ?1`,
    agentId,
  );
  if (!agent) return c.json({ error: "not found" }, 404);

  const versions = await all<Record<string, unknown>>(
    c.env,
    `SELECT id, version_label, config_hash, detected_at FROM agent_versions WHERE agent_id = ?1 ORDER BY detected_at DESC`,
    agentId,
  );

  const scores = await all<Record<string, unknown>>(
    c.env,
    `SELECT s.* FROM scores s
       JOIN agent_versions av ON av.id = s.agent_version_id
      WHERE av.agent_id = ?1
      ORDER BY s.computed_at DESC`,
    agentId,
  );

  // Human baseline (P1) surfaced from tasks in the category.
  const baselines = await all<Record<string, unknown>>(
    c.env,
    `SELECT id, prompt, human_baseline_json FROM tasks
      WHERE category = ?1 AND human_baseline_json IS NOT NULL AND is_gold = 0`,
    (agent.category as string) ?? "lead_research",
  );

  // Reviews with the reviewer's public identity (the face behind the review).
  const reviews = await all<Record<string, unknown>>(
    c.env,
    `SELECT rv.overall, rv.reason, rv.created_at,
            u.display_name AS reviewer_name, rs.headline AS reviewer_headline,
            rs.expertise_json AS reviewer_expertise, rs.gold_accuracy AS reviewer_accuracy
       FROM reviews rv
       JOIN runs r ON r.id = rv.run_id
       JOIN agent_versions av ON av.id = r.agent_version_id
       LEFT JOIN users u ON u.id = rv.reviewer_id
       LEFT JOIN reviewer_stats rs ON rs.reviewer_id = rv.reviewer_id
      WHERE av.agent_id = ?1 AND rv.is_gold_check = 0
      ORDER BY rv.created_at DESC LIMIT 20`,
    agentId,
  );
  for (const r of reviews) {
    if (typeof r.reviewer_expertise === "string") {
      (r as any).reviewer_expertise = JSON.parse(r.reviewer_expertise as string);
    }
  }

  return c.json({ agent, versions, scores, baselines, reviews });
});

// POST /agents — submit an agent; returns Stripe Checkout URL for the vetting fee.
app.post("/", requireAuth(["member", "admin"]), async (c) => {
  const session = c.get("session");
  const body = await c.req.json<{
    name: string;
    owner_url?: string;
    category?: string;
    adapter_type: "http" | "mcp" | "claude_wrapper";
    endpoint?: string;
    api_key?: string;
    declared_cost_usd?: number;
    version_label?: string;
  }>();

  if (!body.name || !body.adapter_type) {
    return c.json({ error: "name and adapter_type are required" }, 400);
  }

  const agentId = id("agt");
  let apiKeyEnc: string | null = null;
  if (body.api_key && c.env.ENCRYPTION_KEY) {
    apiKeyEnc = await encryptSecret(body.api_key, c.env.ENCRYPTION_KEY);
  }

  await run(
    c.env,
    `INSERT INTO agents (id, name, owner_url, category, adapter_type, endpoint, api_key_enc, declared_cost_usd, submitted_by, created_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`,
    agentId,
    body.name,
    body.owner_url ?? null,
    body.category ?? "lead_research",
    body.adapter_type,
    body.endpoint ?? null,
    apiKeyEnc,
    body.declared_cost_usd ?? null,
    session.userId,
    nowIso(),
  );

  const versionId = id("ver");
  const configHash = await hashConfig(body);
  await run(
    c.env,
    `INSERT INTO agent_versions (id, agent_id, version_label, config_hash, detected_at) VALUES (?1,?2,?3,?4,?5)`,
    versionId,
    agentId,
    body.version_label ?? "v1",
    configHash,
    nowIso(),
  );

  // Record a pending vetting payment + create Checkout.
  await run(
    c.env,
    `INSERT INTO payments (id, user_id, type, agent_id, amount_usd, status, created_at)
     VALUES (?1,?2,'vetting',?3,?4,'pending',?5)`,
    id("pay"),
    session.userId,
    agentId,
    Number(c.env.VETTING_PRICE_CENTS ?? "40000") / 100,
    nowIso(),
  );

  let checkoutUrl: string | null = null;
  try {
    checkoutUrl = await createVettingCheckout(c.env, {
      agentId,
      agentVersionId: versionId,
      userId: session.userId,
      customerEmail: session.email,
    });
  } catch (e) {
    // Stripe not configured in this env — return agent anyway so the loop is testable.
    checkoutUrl = null;
  }

  return c.json({ agent_id: agentId, agent_version_id: versionId, checkout_url: checkoutUrl });
});

async function hashConfig(body: Record<string, unknown>): Promise<string> {
  const canonical = JSON.stringify({
    adapter_type: body.adapter_type,
    endpoint: body.endpoint ?? null,
    version_label: body.version_label ?? null,
  });
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

export default app;
