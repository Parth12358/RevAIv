-- Agent Trust Layer — initial schema (9 tables per PRD §Data model)
-- Every score and run points to a specific agent version.

-- One table, role-based access.
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  email              TEXT NOT NULL UNIQUE,
  role               TEXT NOT NULL DEFAULT 'member',   -- member | reviewer | admin
  stripe_customer_id TEXT,
  membership_active  INTEGER NOT NULL DEFAULT 0,        -- gated by subscription webhook
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Listed or submitted agents.
CREATE TABLE IF NOT EXISTS agents (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  owner_url    TEXT,
  category     TEXT NOT NULL DEFAULT 'lead_research',
  adapter_type TEXT NOT NULL,                            -- http | mcp | claude_wrapper
  endpoint     TEXT,                                     -- URL or model id
  api_key_enc  TEXT,                                     -- encrypted at rest (nullable)
  declared_cost_usd REAL,                                -- owner-declared per-task price (http)
  submitted_by TEXT REFERENCES users(id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- New row on each detected change.
CREATE TABLE IF NOT EXISTS agent_versions (
  id            TEXT PRIMARY KEY,
  agent_id      TEXT NOT NULL REFERENCES agents(id),
  version_label TEXT,                                    -- owner-declared version / model name
  config_hash   TEXT NOT NULL,                           -- hash of declared config
  detected_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_versions_agent ON agent_versions(agent_id);

-- Gold tasks are hidden from reviewers.
CREATE TABLE IF NOT EXISTS tasks (
  id               TEXT PRIMARY KEY,
  category         TEXT NOT NULL DEFAULT 'lead_research',
  prompt           TEXT NOT NULL,
  rubric_json      TEXT NOT NULL,                        -- [{key,label,description}]
  is_gold          INTEGER NOT NULL DEFAULT 0,
  gold_answer_json TEXT,                                 -- never sent to clients
  human_baseline_json TEXT,                              -- {cost_usd, duration_ms} (P1)
  active           INTEGER NOT NULL DEFAULT 1
);

-- One per agent version x task.
CREATE TABLE IF NOT EXISTS runs (
  id               TEXT PRIMARY KEY,
  agent_version_id TEXT NOT NULL REFERENCES agent_versions(id),
  task_id          TEXT NOT NULL REFERENCES tasks(id),
  status           TEXT NOT NULL DEFAULT 'queued',       -- queued | running | done | failed
  output_r2_key    TEXT,
  output_preview   TEXT,                                 -- short snippet for quick display
  cost_usd         REAL,
  duration_ms      INTEGER,
  attempts         INTEGER NOT NULL DEFAULT 0,
  error            TEXT,
  started_at       TEXT,
  finished_at      TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_runs_version ON runs(agent_version_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);

-- Reason is required.
CREATE TABLE IF NOT EXISTS reviews (
  id            TEXT PRIMARY KEY,
  run_id        TEXT REFERENCES runs(id),                -- null for pure gold-qualification
  task_id       TEXT NOT NULL REFERENCES tasks(id),
  reviewer_id   TEXT NOT NULL REFERENCES users(id),
  scores_json   TEXT NOT NULL,                           -- {accuracy, deliverability, fit, completeness}
  overall       REAL NOT NULL,                           -- mean of rubric dims (0-10)
  reason        TEXT NOT NULL,
  is_gold_check INTEGER NOT NULL DEFAULT 0,
  gold_delta    REAL,                                    -- |overall - gold overall| for gold checks
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_run ON reviews(run_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);

-- Drives review weighting.
CREATE TABLE IF NOT EXISTS reviewer_stats (
  reviewer_id   TEXT PRIMARY KEY REFERENCES users(id),
  qualified     INTEGER NOT NULL DEFAULT 0,
  gold_accuracy REAL NOT NULL DEFAULT 0.5,               -- 0..1, weights quality reviews
  reviews_count INTEGER NOT NULL DEFAULT 0,
  gold_count    INTEGER NOT NULL DEFAULT 0,
  gold_passed   INTEGER NOT NULL DEFAULT 0,
  paused        INTEGER NOT NULL DEFAULT 0
);

-- Published only at Medium confidence or above.
CREATE TABLE IF NOT EXISTS scores (
  id               TEXT PRIMARY KEY,
  agent_version_id TEXT NOT NULL REFERENCES agent_versions(id),
  quality          REAL NOT NULL,                        -- Q 0-10
  cost             REAL NOT NULL,                        -- C 0-10
  speed            REAL NOT NULL,                        -- S 0-10
  trust            REAL NOT NULL,                        -- 0-100
  confidence       TEXT NOT NULL,                        -- low | medium | high
  reviewed_tasks   INTEGER NOT NULL DEFAULT 0,
  published        INTEGER NOT NULL DEFAULT 0,
  flagged_drop     INTEGER NOT NULL DEFAULT 0,           -- 10+ point drop vs previous
  computed_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scores_version ON scores(agent_version_id);

-- Mirrors Stripe webhooks.
CREATE TABLE IF NOT EXISTS payments (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id),
  type       TEXT NOT NULL,                              -- membership | vetting | payout
  stripe_id  TEXT,
  agent_id   TEXT REFERENCES agents(id),                 -- for vetting fee
  amount_usd REAL NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
