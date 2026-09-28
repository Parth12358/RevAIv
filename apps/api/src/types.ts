// Cloudflare bindings + shared domain types.

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;

  // vars
  APP_BASE_URL: string;
  API_BASE_URL: string;
  VETTING_PRICE_CENTS: string;
  MEMBERSHIP_PRICE_CENTS: string;
  ADMIN_EMAIL: string;

  // secrets
  CLAUDE_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  ENCRYPTION_KEY?: string;
}

export type Role = "member" | "reviewer" | "admin";
export type AdapterType = "http" | "mcp" | "claude_wrapper";
export type RunStatus = "queued" | "running" | "done" | "failed";
export type Confidence = "low" | "medium" | "high";

export interface RunMessage {
  run_id: string;
  agent_version_id: string;
  task_id: string;
}

export interface RubricDim {
  key: string;
  label: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  owner_url: string | null;
  category: string;
  adapter_type: AdapterType;
  endpoint: string | null;
  api_key_enc: string | null;
  declared_cost_usd: number | null;
  submitted_by: string | null;
  created_at: string;
}

export interface AgentVersion {
  id: string;
  agent_id: string;
  version_label: string | null;
  config_hash: string;
  detected_at: string;
}

export interface Task {
  id: string;
  category: string;
  prompt: string;
  rubric_json: string;
  is_gold: number;
  gold_answer_json: string | null;
  human_baseline_json: string | null;
  active: number;
}

export interface Run {
  id: string;
  agent_version_id: string;
  task_id: string;
  status: RunStatus;
  output_r2_key: string | null;
  output_preview: string | null;
  cost_usd: number | null;
  duration_ms: number | null;
  attempts: number;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  run_id: string | null;
  task_id: string;
  reviewer_id: string;
  scores_json: string;
  overall: number;
  reason: string;
  is_gold_check: number;
  gold_delta: number | null;
  created_at: string;
}

export interface ReviewerStats {
  reviewer_id: string;
  qualified: number;
  gold_accuracy: number;
  reviews_count: number;
  gold_count: number;
  gold_passed: number;
  paused: number;
}

export interface Score {
  id: string;
  agent_version_id: string;
  quality: number;
  cost: number;
  speed: number;
  trust: number;
  confidence: Confidence;
  reviewed_tasks: number;
  published: number;
  flagged_drop: number;
  computed_at: string;
}

export interface AdapterResult {
  output: unknown;
  costUsd: number;
  durationMs: number;
}
