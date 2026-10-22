-- No backfill: a legacy status is not evidence of its completion date.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_at timestamp;
CREATE TABLE IF NOT EXISTS funnel_retention_drafts (
  funnel_id integer PRIMARY KEY REFERENCES funnels(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('general_leads', 'closed_applications')),
  days integer NOT NULL CHECK (days BETWEEN 1 AND 36500),
  purpose text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamp NOT NULL DEFAULT now()
);
-- Clearing an exception keeps its version, so a stale edit cannot recreate it.
CREATE TABLE IF NOT EXISTS lead_retention_exceptions (
  lead_id integer PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  reason text,
  review_at timestamp,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamp NOT NULL DEFAULT now(),
  CHECK ((reason IS NULL) = (review_at IS NULL))
);
