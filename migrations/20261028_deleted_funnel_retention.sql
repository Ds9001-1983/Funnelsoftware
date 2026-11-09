-- An empty table means no owner has authorized automatic removal.
CREATE TABLE IF NOT EXISTS deleted_funnel_retention (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  days integer NOT NULL CHECK (days BETWEEN 1 AND 36500),
  purpose text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  active_version integer,
  activated_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now()
);
