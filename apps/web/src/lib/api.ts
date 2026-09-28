// Typed fetch wrapper. In dev, Vite proxies /api -> the Worker on :8787.
const BASE = "/api";

function token(): string | null {
  return localStorage.getItem("atl_token");
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem("atl_token", t);
  else localStorage.removeItem("atl_token");
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public paywall = false) {
    super(message);
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  const t = token();
  if (t) headers["authorization"] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error ?? `HTTP ${res.status}`,
      res.status,
      (data as { paywall?: boolean }).paywall ?? false,
    );
  }
  return data as T;
}

// ---- Domain types ----
export type Role = "member" | "reviewer" | "admin";
export interface Session {
  userId: string;
  email: string;
  role: Role;
}
export interface DirectoryAgent {
  id: string;
  name: string;
  category: string;
  adapter_type: string;
  owner_url: string | null;
  trust: number | null;
  quality: number | null;
  cost: number | null;
  speed: number | null;
  confidence: string | null;
  flagged_drop: number | null;
}
export interface RubricDim {
  key: string;
  label: string;
  description: string;
}
export interface ReviewTarget {
  kind: "run" | "gold";
  run_id?: string;
  task_id: string;
  prompt: string;
  rubric: RubricDim[];
  output: unknown;
}
export interface Stats {
  agents: number;
  scored: number;
  reviewers: number;
  tasks: number;
  avg_trust: number | null;
}

export const api = {
  // auth
  signup: (email: string, password: string, role?: Role) =>
    req<{ token: string; session: Session; membership_active: number }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),
  login: (email: string, password: string) =>
    req<{ token: string; session: Session; membership_active: number }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => req<{ session: Session; membership_active: number; onboarded: number; display_name: string | null }>("/auth/me"),
  onboard: (body: Record<string, unknown>) =>
    req<{ session: Session; membership_active: number; onboarded: number }>("/auth/onboard", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // billing
  billingStatus: () =>
    req<{ role: Role; membership_active: boolean; stripe_configured: boolean; price_usd: number }>(
      "/billing/status",
    ),
  billingCheckout: () => req<{ checkout_url?: string; dummy?: boolean }>("/billing/checkout", { method: "POST" }),
  dummyActivate: () => req<{ membership_active: boolean; mode: string }>("/billing/dummy-activate", { method: "POST" }),

  // public
  stats: () => req<Stats>("/stats"),

  // directory (gated)
  directory: (sort = "trust", category?: string) =>
    req<{ agents: DirectoryAgent[] }>(`/agents?sort=${sort}${category ? `&category=${category}` : ""}`),
  agent: (id: string) =>
    req<{ agent: any; versions: any[]; scores: any[]; baselines: any[] }>(`/agents/${id}`),
  submitAgent: (body: Record<string, unknown>) =>
    req<{ agent_id: string; agent_version_id: string; checkout_url: string | null }>("/agents", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // reviewer
  reviewsNext: () => req<{ review_target: ReviewTarget | null; message?: string }>("/reviews/next"),
  submitReview: (body: Record<string, unknown>) =>
    req<{ ok: boolean; overall: number; is_gold_check: boolean }>("/reviews", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  qualifyTask: () => req<{ task_id: string; prompt: string; rubric: RubricDim[] }>("/reviewers/qualify"),
  submitQualification: (task_id: string, scores: Record<string, number>) =>
    req<{ qualified: boolean; delta: number; your_overall: number }>("/reviewers/qualify", {
      method: "POST",
      body: JSON.stringify({ task_id, scores }),
    }),
  reviewerStats: () => req<{ stats: any }>("/reviewers/me"),

  reviewersPublic: () => req<{ reviewers: any[] }>("/reviewers/public"),

  // categories + task authoring
  categories: () => req<{ categories: { key: string; label: string }[] }>("/tasks/categories"),
  myTasks: () => req<{ tasks: any[] }>("/tasks"),
  createTask: (body: Record<string, unknown>) =>
    req<{ task_id: string; status: string }>("/tasks", { method: "POST", body: JSON.stringify(body) }),

  // admin / system
  recompute: (versionId: string) => req<{ score: any }>(`/scores/recompute/${versionId}`, { method: "POST" }),
  enqueue: (agent_version_id: string) =>
    req<{ enqueued: number }>("/runs/enqueue", { method: "POST", body: JSON.stringify({ agent_version_id }) }),
  manualRun: (body: Record<string, unknown>) =>
    req<{ run_id: string; agent_id: string; agent_version_id: string }>("/runs/manual", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  adminOverview: () => req<{ overview: any }>("/admin/overview"),
  adminUsers: () => req<{ users: any[] }>("/admin/users"),
  adminAgents: () => req<{ agents: any[] }>("/admin/agents"),
  adminTasks: () => req<{ tasks: any[] }>("/admin/tasks"),
  adminReviews: () => req<{ reviews: any[] }>("/admin/reviews"),
  setTaskStatus: (id: string, status: string) =>
    req<{ ok: boolean }>(`/admin/tasks/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }),
};
