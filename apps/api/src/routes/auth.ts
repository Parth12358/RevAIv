// Credentialed auth routes: signup, login, me, onboarding.
import { Hono } from "hono";
import type { Env, Role } from "../types";
import { signup, authenticate, getSession, bearer, accountStatus, requireAuth, AuthError, type Session } from "../lib/auth";
import { run } from "../lib/db";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

function accountPayload(session: Session, status: Awaited<ReturnType<typeof accountStatus>>) {
  return {
    session,
    membership_active: status.membership_active,
    onboarded: status.onboarded,
    display_name: status.display_name,
  };
}

app.post("/signup", async (c) => {
  try {
    const { email, password, role } = await c.req.json<{ email: string; password: string; role?: Role }>();
    const { token, session } = await signup(c.env, email, password, role ?? "member");
    const status = await accountStatus(c.env, session.userId);
    return c.json({ token, ...accountPayload(session, status) });
  } catch (e) {
    if (e instanceof AuthError) return c.json({ error: e.message }, e.status as 400);
    return c.json({ error: (e as Error).message }, 400);
  }
});

app.post("/login", async (c) => {
  try {
    const { email, password, role } = await c.req.json<{ email: string; password: string; role?: Role }>();
    const { token, session } = await authenticate(c.env, email, password, role);
    const status = await accountStatus(c.env, session.userId);
    return c.json({ token, ...accountPayload(session, status) });
  } catch (e) {
    if (e instanceof AuthError) {
      // Ambiguous: same email+password on both a customer and reviewer account.
      const roles = (e as AuthError & { roles?: Role[] }).roles;
      if (roles) return c.json({ error: "choose_role", roles }, 409);
      return c.json({ error: e.message }, e.status as 401);
    }
    return c.json({ error: (e as Error).message }, 400);
  }
});

app.get("/me", async (c) => {
  const session = await getSession(c.env, bearer(c));
  if (!session) return c.json({ error: "unauthorized" }, 401);
  const status = await accountStatus(c.env, session.userId);
  return c.json(accountPayload(session, status));
});

// POST /auth/onboard — role-specific onboarding.
// Customer: { display_name, company, use_case }
// Reviewer: { display_name, headline, expertise[], bio, country }
app.post("/onboard", requireAuth(), async (c) => {
  const session = c.get("session");
  const body = await c.req.json<{
    display_name?: string;
    company?: string;
    use_case?: string;
    headline?: string;
    expertise?: string[];
    bio?: string;
    country?: string;
    linkedin_url?: string;
  }>();

  await run(
    c.env,
    `UPDATE users SET display_name = ?2, company = ?3, use_case = ?4, onboarded = 1 WHERE id = ?1`,
    session.userId,
    body.display_name ?? null,
    body.company ?? null,
    body.use_case ?? null,
  );

  if (session.role === "reviewer") {
    await run(
      c.env,
      `INSERT INTO reviewer_stats (reviewer_id, qualified, gold_accuracy, headline, expertise_json, bio, country, linkedin_url)
       VALUES (?1, COALESCE((SELECT qualified FROM reviewer_stats WHERE reviewer_id=?1),1),
               COALESCE((SELECT gold_accuracy FROM reviewer_stats WHERE reviewer_id=?1),0.5), ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(reviewer_id) DO UPDATE SET headline=?2, expertise_json=?3, bio=?4, country=?5, linkedin_url=?6`,
      session.userId,
      body.headline ?? null,
      JSON.stringify(body.expertise ?? []),
      body.bio ?? null,
      body.country ?? null,
      body.linkedin_url ?? null,
    );
  }

  const status = await accountStatus(c.env, session.userId);
  return c.json(accountPayload(session, status));
});

export default app;
