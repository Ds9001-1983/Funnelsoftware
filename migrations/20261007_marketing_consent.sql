CREATE TABLE IF NOT EXISTS marketing_consents (
  id serial PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  policy_version text NOT NULL,
  granted_at timestamp NOT NULL DEFAULT now(),
  expires_at timestamp NOT NULL,
  revoked_at timestamp
);
CREATE INDEX IF NOT EXISTS marketing_consents_user_id_idx ON marketing_consents(user_id);
-- Alte Booleans sind kein versionierter Nachweis und werden nicht übernommen.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_version text;
