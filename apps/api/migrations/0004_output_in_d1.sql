-- Store full agent output in D1 (R2 removed for free-plan deploy).
ALTER TABLE runs ADD COLUMN output_full TEXT;
