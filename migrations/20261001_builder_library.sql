CREATE TABLE IF NOT EXISTS content_templates (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL,
  content jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  archived_at timestamp
);
CREATE INDEX IF NOT EXISTS content_templates_user_id_idx ON content_templates(user_id);
CREATE TABLE IF NOT EXISTS media_folders (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_folders_user_id_idx ON media_folders(user_id);
CREATE TABLE IF NOT EXISTS media_assets (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id integer REFERENCES media_folders(id) ON DELETE SET NULL,
  filename text NOT NULL UNIQUE,
  original_name text NOT NULL,
  name text NOT NULL,
  mime_type text NOT NULL,
  bytes integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  archived_at timestamp
);
CREATE INDEX IF NOT EXISTS media_assets_user_id_idx ON media_assets(user_id);
