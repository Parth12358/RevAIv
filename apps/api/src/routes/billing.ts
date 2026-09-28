// Membership billing: real Stripe test-mode Checkout when configured, otherwise
// a guarded "dummy activate" so the paywall works in a demo without keys.
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth, accountStatus } from "../lib/auth";
import { first, id, nowIso, run } from "../lib/db";
import { stripeConfigured, createCustomer, createMembershipCheckout } from "../lib/stripe";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// GET /billing/status
app.get("/status", requireAuth(), async (c) => {
  const session = c.get("session");
  const status = await accountStatus(c.env, session.userId);
  return c.json({
    role: status.role,
    membership_active: status.membership_active === 1,
    stripe_configured: stripeConfigured(c.env),
    price_usd: Number(c.env.MEMBERSHIP_PRICE_CENTS ?? "20000") / 100,
  });
});

// POST /billing/checkout — start a membership subscription.
// Returns { checkout_url } (real Stripe) or { dummy: true } (no keys → demo activate).
app.post("/checkout", requireAuth(["member", "admin"]), async (c) => {
  const session = c.get("session");
  if (!stripeConfigured(c.env)) return c.json({ dummy: true });

  const acct = await accountStatus(c.env, session.userId);
  let customerId = acct.stripe_customer_id;
  if (!customerId) {
    customerId = await createCustomer(c.env, session.email, session.userId);
    await run(c.env, `UPDATE users SET stripe_customer_id = ?2 WHERE id = ?1`, session.userId, customerId);
  }

  const url = await createMembershipCheckout(c.env, { userId: session.userId, customerId });

  await run(
    c.env,
    `INSERT INTO payments (id, user_id, type, amount_usd, status, created_at)
     VALUES (?1,?2,'membership',?3,'pending',?4)`,
    id("pay"),
    session.userId,
    Number(c.env.MEMBERSHIP_PRICE_CENTS ?? "20000") / 100,
    nowIso(),
  );

  return c.json({ checkout_url: url });
});

// POST /billing/dummy-activate — demo-only. Simulates a successful payment.
// Disabled automatically once a real Stripe key is configured (no paywall bypass).
app.post("/dummy-activate", requireAuth(["member", "admin"]), async (c) => {
  if (stripeConfigured(c.env)) {
    return c.json({ error: "Stripe is configured — use real Checkout" }, 400);
  }
  const session = c.get("session");
  await run(c.env, `UPDATE users SET membership_active = 1 WHERE id = ?1`, session.userId);
  await run(
    c.env,
    `INSERT INTO payments (id, user_id, type, amount_usd, status, created_at)
     VALUES (?1,?2,'membership',?3,'paid',?4)`,
    id("pay"),
    session.userId,
    Number(c.env.MEMBERSHIP_PRICE_CENTS ?? "20000") / 100,
    nowIso(),
  );
  return c.json({ membership_active: true, mode: "demo" });
});

export default app;
