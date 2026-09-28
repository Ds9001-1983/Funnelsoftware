-- Rein additive Migration. Bestehende Leads verwenden weiter ihren bisherigen
-- Status; stage_id bleibt NULL, bis ein Nutzer den Status ausdrücklich ändert.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_version integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS funnel_recruiting_configs (
  funnel_id integer PRIMARY KEY REFERENCES funnels(id) ON DELETE CASCADE,
  stages jsonb NOT NULL, version integer NOT NULL DEFAULT 1,
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS recruiting_mail_rules (
  id serial PRIMARY KEY, funnel_id integer NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  rule_key text NOT NULL, trigger text NOT NULL, stage_id text,
  subject text NOT NULL, body text NOT NULL, sender_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false, version integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS recruiting_mail_rules_key_idx ON recruiting_mail_rules(funnel_id, rule_key);
CREATE TABLE IF NOT EXISTS lead_stage_events (
  id serial PRIMARY KEY, lead_id integer NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_id integer REFERENCES users(id) ON DELETE SET NULL,
  from_stage_id text NOT NULL, to_stage_id text NOT NULL, version integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS lead_stage_events_version_idx ON lead_stage_events(lead_id, version);
CREATE TABLE IF NOT EXISTS recruiting_mail_jobs (
  id serial PRIMARY KEY, lead_id integer NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  rule_id integer NOT NULL REFERENCES recruiting_mail_rules(id) ON DELETE CASCADE,
  owner_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage_id text, recipient text NOT NULL, reply_to text NOT NULL, sender_name text NOT NULL,
  subject text NOT NULL, body text NOT NULL, status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamp NOT NULL DEFAULT now(),
  processing_at timestamp, sent_at timestamp, error_code text, message_id text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS recruiting_mail_jobs_once_idx ON recruiting_mail_jobs(lead_id, rule_id);
CREATE INDEX IF NOT EXISTS recruiting_mail_jobs_pending_idx ON recruiting_mail_jobs(status, next_attempt_at);
CREATE TABLE IF NOT EXISTS workspaces (
  id serial PRIMARY KEY, owner_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces(owner_id);
CREATE TABLE IF NOT EXISTS workspace_members (
  id serial PRIMARY KEY, workspace_id integer NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id integer REFERENCES users(id) ON DELETE CASCADE, invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'client', accepted_at timestamp, created_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_email_idx ON workspace_members(workspace_id, invited_email);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_user_idx ON workspace_members(workspace_id, user_id);
CREATE TABLE IF NOT EXISTS workspace_funnels (
  id serial PRIMARY KEY, workspace_id integer NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  funnel_id integer NOT NULL REFERENCES funnels(id) ON DELETE CASCADE, created_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_funnels_funnel_idx ON workspace_funnels(funnel_id);
CREATE INDEX IF NOT EXISTS workspace_funnels_workspace_idx ON workspace_funnels(workspace_id);
