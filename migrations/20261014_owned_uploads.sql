CREATE TABLE IF NOT EXISTS owned_uploads (
  filename text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area text NOT NULL CHECK (area IN ('public', 'support')),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS owned_uploads_user_id_idx ON owned_uploads(user_id);

-- Nur belegte Eigentümer übernehmen. Eine URL in einem Funnel beweist nicht,
-- wer die Datei hochgeladen hat; ältere unzugeordnete Dateien separat prüfen.
INSERT INTO owned_uploads (filename, user_id, area, created_at)
SELECT filename, user_id, 'public', created_at FROM media_assets
ON CONFLICT (filename) DO NOTHING;

-- Sehr alte Installationen/Restore-Prüfungen können ohne Bug-Report-Tabelle
-- beginnen; die Laufzeit-Löschung berücksichtigt deren Pfade zusätzlich.
DO $$ BEGIN
  IF to_regclass('bug_reports') IS NOT NULL THEN
    INSERT INTO owned_uploads (filename, user_id, area, created_at)
    SELECT filename, user_id, 'support', created_at
    FROM bug_reports CROSS JOIN LATERAL
      (VALUES (screenshot_path), (attachment_path)) AS files(filename)
    WHERE filename IS NOT NULL
    ON CONFLICT (filename) DO NOTHING;
  END IF;
END $$;
