-- No default period, backfill or activation for existing funnels.
-- Timestamp columns store UTC, independent of the database session timezone.
-- Historical events are preserved byte-for-byte.
ALTER TABLE analytics_events ALTER COLUMN timestamp SET DEFAULT (now() AT TIME ZONE 'UTC');
CREATE TABLE IF NOT EXISTS funnel_analytics_retention (
  funnel_id integer PRIMARY KEY REFERENCES funnels(id) ON DELETE CASCADE,
  days integer NOT NULL CHECK (days BETWEEN 1 AND 36500),
  purpose text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  active_version integer,
  activated_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now()
);
