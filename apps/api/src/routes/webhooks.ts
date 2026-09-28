// Stripe webhooks: vetting fee enqueues runs; subscription gates membership.
import { Hono } from "hono";
import type { Env } from "../types";
import { first, nowIso, run } from "../lib/db";
import { verifyWebhook } from "../lib/stripe";
import { enqueueRunsForVersion } from "../lib/runner";

const app = new Hono<{ Bindings: Env }>();

// POST /webhooks/stripe — signature-verified.
app.post("/stripe", async (c) => {
  const payload = await c.req.text();
  const sig = c.req.header("stripe-signature");
  const event = await verifyWebhook(c.env, payload, sig);
  if (!event) return c.json({ error: "invalid signature" }, 400);

  const type = event.type as string;
  const obj = (event.data as { object?: Record<string, unknown> })?.object ?? {};
  const metadata = (obj.metadata as Record<string, string>) ?? {};

  if (type === "checkout.session.completed") {
    if (metadata.type === "vetting" && metadata.agent_version_id) {
      // Mark payment paid, enqueue runs.
      if (metadata.agent_id) {
        await run(
          c.env,
          `UPDATE payments SET status='paid', stripe_id=?2 WHERE agent_id=?1 AND type='vetting' AND status='pending'`,
          metadata.agent_id,
          (obj.id as string) ?? null,
        );
      }
      await enqueueRunsForVersion(c.env, metadata.agent_version_id);
    } else if (metadata.type === "membership" && metadata.user_id) {
      await run(c.env, `UPDATE users SET membership_active=1 WHERE id=?1`, metadata.user_id);
    }
  } else if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
    const status = obj.status as string;
    const active = status === "active" || status === "trialing" ? 1 : 0;
    const customerId = obj.customer as string;
    if (customerId) {
      await run(c.env, `UPDATE users SET membership_active=?2 WHERE stripe_customer_id=?1`, customerId, active);
    }
  }

  return c.json({ received: true });
});

export default app;
