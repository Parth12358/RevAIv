-- Remove all demo/dummy data. Keeps the task library (see tasks.sql), which is
-- platform configuration, not demo content.
DELETE FROM reviews;
DELETE FROM scores;
DELETE FROM runs;
DELETE FROM payments;
DELETE FROM reviewer_stats;
DELETE FROM agent_versions;
DELETE FROM agents;
DELETE FROM users;
