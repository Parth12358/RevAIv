// Stripe helpers (test mode). Uses the REST API via fetch (form-encoded) and
// verifies webhook signatures with WebCrypto HMAC-SHA256.
import type { Env } from "../types";

const STRIPE_API = "https://api.stripe.com/v1";

function form(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

async function stripeReq(env: Env, path: string, params: Record<string, string>) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form(params),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg = (data.error as { message?: string })?.message ?? JSON.stringify(data);
    throw new Error(`Stripe ${res.status}: ${msg}`);
  }
  return data;
}

export function stripeConfigured(env: Env): boolean {
  return !!env.STRIPE_SECRET_KEY;
}

// Create (or return) a Stripe customer for this user.
export async function createCustomer(env: Env, email: string, userId: string): Promise<string> {
  const data = await stripeReq(env, "/customers", {
    email,
    "metadata[user_id]": userId,
  });
  return data.id as string;
}

// One-time Checkout for the vetting fee. Metadata carries agent_id so the
// webhook can enqueue runs for the right agent version.
export async function createVettingCheckout(
  env: Env,
  opts: { agentId: string; agentVersionId: string; userId: string; customerEmail?: string },
): Promise<string> {
  const priceCents = env.VETTING_PRICE_CENTS || "40000";
  const data = await stripeReq(env, "/checkout/sessions", {
    mode: "payment",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "Agent vetting fee",
    "line_items[0][price_data][unit_amount]": priceCents,
    "line_items[0][quantity]": "1",
    success_url: `${env.APP_BASE_URL}/agents/${opts.agentId}?paid=1`,
    cancel_url: `${env.APP_BASE_URL}/submit?canceled=1`,
    "metadata[type]": "vetting",
    "metadata[agent_id]": opts.agentId,
    "metadata[agent_version_id]": opts.agentVersionId,
    "metadata[user_id]": opts.userId,
    ...(opts.customerEmail ? { customer_email: opts.customerEmail } : {}),
  });
  return data.url as string;
}

// Subscription Checkout for membership, bound to the user's Stripe customer.
export async function createMembershipCheckout(
  env: Env,
  opts: { userId: string; customerId: string },
): Promise<string> {
  const priceCents = env.MEMBERSHIP_PRICE_CENTS || "20000";
  const data = await stripeReq(env, "/checkout/sessions", {
    mode: "subscription",
    customer: opts.customerId,
    client_reference_id: opts.userId,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": "Agent Trust Ledger membership",
    "line_items[0][price_data][unit_amount]": priceCents,
    "line_items[0][quantity]": "1",
    success_url: `${env.APP_BASE_URL}/account?member=1`,
    cancel_url: `${env.APP_BASE_URL}/account?canceled=1`,
    "metadata[type]": "membership",
    "metadata[user_id]": opts.userId,
    "subscription_data[metadata][type]": "membership",
    "subscription_data[metadata][user_id]": opts.userId,
  });
  return data.url as string;
}

// Verify a Stripe webhook signature (t=...,v1=...). Returns the parsed event or null.
export async function verifyWebhook(
  env: Env,
  payload: string,
  sigHeader: string | undefined,
): Promise<Record<string, unknown> | null> {
  if (!env.STRIPE_WEBHOOK_SECRET || !sigHeader) return null;

  const parts = Object.fromEntries(sigHeader.split(",").map((kv) => kv.split("=") as [string, string]));
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return null;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (expected !== v1) return null;
  return JSON.parse(payload) as Record<string, unknown>;
}
