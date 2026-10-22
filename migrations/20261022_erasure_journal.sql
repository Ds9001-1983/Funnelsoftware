-- Stable account identity survives renames, restores and reused numeric IDs.
ALTER TABLE users ADD COLUMN IF NOT EXISTS erasure_key text NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS users_erasure_key_idx ON users(erasure_key);

CREATE TABLE IF NOT EXISTS erasure_journal_identity (
  id integer PRIMARY KEY CHECK (id = 1),
  instance_id text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS erasure_journal_receipts (
  sequence integer PRIMARY KEY,
  hash text NOT NULL
);
