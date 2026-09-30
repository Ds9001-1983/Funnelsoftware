CREATE TABLE IF NOT EXISTS brand_styles (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  theme jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  archived_at timestamp
);
CREATE INDEX IF NOT EXISTS brand_styles_user_id_idx ON brand_styles(user_id);
