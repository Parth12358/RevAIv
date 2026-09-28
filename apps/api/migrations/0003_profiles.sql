-- Onboarding, reviewer public profiles ("a face behind the review"),
-- reviewer-authored tasks, and manual-run provenance.

-- Users: onboarding + customer profile
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN onboarded INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN company TEXT;         -- customer onboarding
ALTER TABLE users ADD COLUMN use_case TEXT;        -- customer onboarding

-- Reviewer public profile (shown next to their reviews)
ALTER TABLE reviewer_stats ADD COLUMN headline TEXT;        -- "B2B SaaS GTM, ex-Outreach"
ALTER TABLE reviewer_stats ADD COLUMN expertise_json TEXT;  -- ["lead_research","recruiting"]
ALTER TABLE reviewer_stats ADD COLUMN bio TEXT;
ALTER TABLE reviewer_stats ADD COLUMN country TEXT;

-- Tasks: authoring provenance + expected-answer guidance
ALTER TABLE tasks ADD COLUMN created_by TEXT;              -- reviewer/admin user id
ALTER TABLE tasks ADD COLUMN expected_answer TEXT;         -- reviewer's reference answer
ALTER TABLE tasks ADD COLUMN great_answer TEXT;            -- what a great answer includes
ALTER TABLE tasks ADD COLUMN common_mistakes TEXT;         -- what a weak answer gets wrong
ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'active'; -- pending | active | rejected

-- Runs: mark manually-pasted (web-app agent) outputs
ALTER TABLE runs ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0;
