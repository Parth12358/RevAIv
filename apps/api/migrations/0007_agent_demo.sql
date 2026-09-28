-- Mark agents whose outputs are demo/sample data (not a real connected API),
-- so the directory can show a distinct "Demo" tag while keeping them reviewable.
ALTER TABLE agents ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
