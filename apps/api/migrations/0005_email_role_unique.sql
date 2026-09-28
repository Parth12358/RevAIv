-- NOTE: descoped on the deployed DB. The original users-table rebuild (to make
-- UNIQUE(email, role) so one email could hold both a customer and a reviewer
-- account) fails under D1's foreign-key enforcement on DROP TABLE users, even
-- with defer_foreign_keys. Rather than block the migration chain, this is a
-- no-op. Same-email multi-account can be revisited with a non-destructive
-- approach. Local dev may still carry the rebuilt schema from an earlier version
-- of this file; the app works on both (auth handles single- or multi-account).
CREATE TABLE IF NOT EXISTS _noop_0005 (id INTEGER);
DROP TABLE IF EXISTS _noop_0005;
