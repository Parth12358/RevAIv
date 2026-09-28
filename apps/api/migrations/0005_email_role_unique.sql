-- Allow the same email to hold separate accounts per role (customer + reviewer).
-- Rebuild users to replace UNIQUE(email) with UNIQUE(email, role).
CREATE TABLE users_new (
  id                 TEXT PRIMARY KEY,
  email              TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT 'member',
  stripe_customer_id TEXT,
  membership_active  INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  password_hash      TEXT,
  display_name       TEXT,
  onboarded          INTEGER NOT NULL DEFAULT 0,
  company            TEXT,
  use_case           TEXT,
  UNIQUE(email, role)
);
INSERT INTO users_new (id, email, role, stripe_customer_id, membership_active, created_at, password_hash, display_name, onboarded, company, use_case)
  SELECT id, email, role, stripe_customer_id, membership_active, created_at, password_hash, display_name, onboarded, company, use_case FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
