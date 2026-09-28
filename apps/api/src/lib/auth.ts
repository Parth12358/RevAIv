// Credentialed auth: email + password signup/login, KV session tokens,
// role-based + membership-gated middleware.
import type { Context } from "hono";
import type { Env, Role } from "../types";
import { all, first, id, nowIso, run } from "./db";
import { hashPassword, verifyPassword } from "./password";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  userId: string;
  email: string;
  role: Role;
}

export class AuthError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
  }
}

// Create an account. Role: ADMIN_EMAIL -> admin; otherwise the requested
// member|reviewer (defaults to member). Reviewers get a pre-qualified stats row
// (the qualification exam is skipped — see onboarding).
export async function signup(
  env: Env,
  email: string,
  password: string,
  requestedRole: Role = "member",
): Promise<{ token: string; session: Session }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password || password.length < 8) {
    throw new AuthError("A valid email and a password of at least 8 characters are required");
  }
  let role: Role = requestedRole === "reviewer" ? "reviewer" : "member";
  if (env.ADMIN_EMAIL && normalized === env.ADMIN_EMAIL.trim().toLowerCase()) role = "admin";

  // Same email may hold separate customer + reviewer accounts, but only one per role.
  const existing = await first<{ id: string }>(
    env,
    `SELECT id FROM users WHERE email = ?1 AND role = ?2`,
    normalized,
    role,
  );
  if (existing) throw new AuthError(`You already have a ${role} account with that email`, 409);

  const uid = id("usr");
  const passwordHash = await hashPassword(password);
  await run(
    env,
    `INSERT INTO users (id, email, role, password_hash, membership_active, created_at) VALUES (?1,?2,?3,?4,0,?5)`,
    uid,
    normalized,
    role,
    passwordHash,
    nowIso(),
  );
  if (role === "reviewer") {
    await run(
      env,
      `INSERT OR IGNORE INTO reviewer_stats (reviewer_id, qualified, gold_accuracy) VALUES (?1, 1, 0.5)`,
      uid,
    );
  }
  return mintSession(env, { userId: uid, email: normalized, role });
}

export async function authenticate(
  env: Env,
  email: string,
  password: string,
  role?: Role,
): Promise<{ token: string; session: Session }> {
  const normalized = email.trim().toLowerCase();
  const users = await all<{ id: string; email: string; role: Role; password_hash: string | null }>(
    env,
    `SELECT id, email, role, password_hash FROM users WHERE email = ?1`,
    normalized,
  );

  // Accounts whose password matches (usually one, since roles have their own).
  const matches: { id: string; email: string; role: Role }[] = [];
  for (const u of users) {
    if (await verifyPassword(password, u.password_hash)) matches.push({ id: u.id, email: u.email, role: u.role });
  }
  if (matches.length === 0) throw new AuthError("Invalid email or password", 401);

  let chosen = matches[0];
  if (matches.length > 1) {
    const byRole = role ? matches.find((m) => m.role === role) : undefined;
    if (!byRole) {
      const err = new AuthError("choose_role", 409);
      (err as AuthError & { roles?: Role[] }).roles = matches.map((m) => m.role);
      throw err;
    }
    chosen = byRole;
  }
  return mintSession(env, { userId: chosen.id, email: chosen.email, role: chosen.role });
}

async function mintSession(env: Env, session: Session): Promise<{ token: string; session: Session }> {
  const token = await issueSession(env, session);
  return { token, session };
}

// Issue a session token for an arbitrary user (used by admin impersonation).
export async function issueSession(env: Env, session: Session): Promise<string> {
  const token = id("sess");
  await env.SESSIONS.put(`session:${token}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return token;
}

export async function getSession(env: Env, token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const raw = await env.SESSIONS.get(`session:${token}`);
  return raw ? (JSON.parse(raw) as Session) : null;
}

// Live membership/role from the DB (session snapshot may be stale after payment).
export async function accountStatus(
  env: Env,
  userId: string,
): Promise<{
  role: Role;
  membership_active: number;
  stripe_customer_id: string | null;
  onboarded: number;
  display_name: string | null;
}> {
  const row = await first<{
    role: Role;
    membership_active: number;
    stripe_customer_id: string | null;
    onboarded: number;
    display_name: string | null;
  }>(
    env,
    `SELECT role, membership_active, stripe_customer_id, onboarded, display_name FROM users WHERE id = ?1`,
    userId,
  );
  return row ?? { role: "member", membership_active: 0, stripe_customer_id: null, onboarded: 0, display_name: null };
}

export function bearer(c: Context): string | undefined {
  const h = c.req.header("authorization");
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return undefined;
}

// Require a valid session, optionally with one of `roles`.
export function requireAuth(roles?: Role[]) {
  return async (c: Context<{ Bindings: Env; Variables: { session: Session } }>, next: () => Promise<void>) => {
    const session = await getSession(c.env, bearer(c));
    if (!session) return c.json({ error: "unauthorized" }, 401);
    if (roles && !roles.includes(session.role)) return c.json({ error: "forbidden" }, 403);
    c.set("session", session);
    await next();
  };
}

// Require an active membership. Reviewers and admins bypass the paywall.
export function requireMembership() {
  return async (c: Context<{ Bindings: Env; Variables: { session: Session } }>, next: () => Promise<void>) => {
    const session = await getSession(c.env, bearer(c));
    if (!session) return c.json({ error: "unauthorized" }, 401);
    c.set("session", session);
    if (session.role === "admin" || session.role === "reviewer") return next();
    const status = await accountStatus(c.env, session.userId);
    if (status.membership_active !== 1) {
      return c.json({ error: "membership required", paywall: true }, 402);
    }
    await next();
  };
}
