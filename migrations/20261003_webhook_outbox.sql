-- Additive outbox. No backfill: only newly created eligible leads are queued.
CREATE TABLE IF NOT EXISTS webhook_jobs (
  id serial PRIMARY KEY,
  event_id text NOT NULL,
  lead_id integer NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  funnel_id integer NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  owner_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_url text NOT NULL,
  config_hash text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processing_at timestamptz,
  delivered_at timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_jobs_event_idx ON webhook_jobs(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_jobs_lead_idx ON webhook_jobs(lead_id);
CREATE INDEX IF NOT EXISTS webhook_jobs_pending_idx ON webhook_jobs(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS webhook_jobs_funnel_idx ON webhook_jobs(funnel_id, id);
CREATE TABLE IF NOT EXISTS webhook_attempts (
  id serial PRIMARY KEY,
  job_id integer NOT NULL REFERENCES webhook_jobs(id) ON DELETE CASCADE,
  attempt integer NOT NULL,
  outcome text NOT NULL DEFAULT 'processing',
  status_code integer,
  error_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_attempts_job_idx ON webhook_attempts(job_id, attempt);
