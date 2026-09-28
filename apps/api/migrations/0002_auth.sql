-- Real credentialed auth: add a password hash to users.
ALTER TABLE users ADD COLUMN password_hash TEXT;
