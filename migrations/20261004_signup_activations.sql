-- Only registrations made after instrumentation get a cohort row. Existing
-- accounts are not backfilled with invented first-publication timestamps.
CREATE TABLE IF NOT EXISTS signup_activations (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  first_published_at timestamptz
);
CREATE INDEX IF NOT EXISTS signup_activations_registered_idx ON signup_activations(registered_at);
