-- Bestehende Inhalte unverändert einfrieren; keine Funnels/Leads/Medien umschreiben.
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS document_version integer NOT NULL DEFAULT 1;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS edit_version integer NOT NULL DEFAULT 0;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS editor_protocol boolean NOT NULL DEFAULT false;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published_revision_id integer;
CREATE TABLE IF NOT EXISTS funnel_revisions (
  id serial PRIMARY KEY, funnel_id integer NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  version integer NOT NULL, action text NOT NULL, content jsonb NOT NULL,
  mutation_id text, fingerprint text, actor_id integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS funnel_revisions_version_idx ON funnel_revisions(funnel_id, version);
CREATE UNIQUE INDEX IF NOT EXISTS funnel_revisions_mutation_idx ON funnel_revisions(funnel_id, mutation_id);

-- Ein Transaktions-Lock verhindert Schreibzugriffe zwischen Snapshot und Verweis.
LOCK TABLE funnels IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO funnel_revisions (funnel_id, version, action, content, actor_id, created_at)
SELECT id, edit_version, 'initial', jsonb_build_object(
  'version', document_version, 'name', name, 'description', description,
  'pages', pages, 'theme', theme, 'abTests', ab_tests,
  'impressumUrl', impressum_url, 'datenschutzUrl', datenschutz_url, 'ogImageUrl', og_image_url
), user_id, updated_at FROM funnels
ON CONFLICT (funnel_id, version) DO NOTHING;
UPDATE funnels f SET published_revision_id = r.id
FROM funnel_revisions r
WHERE r.funnel_id = f.id AND r.version = f.edit_version AND f.status = 'published' AND f.published_revision_id IS NULL;

-- Alte laufende Prozesse/Tabs dürfen zwischen Migration und Neustart keine
-- Inhalte am neuen Versionsschutz vorbei speichern. Laufende Lead-/View-Zähler
-- sowie Downgrades und Soft-Delete bleiben uneingeschränkt möglich.
CREATE OR REPLACE FUNCTION guard_funnel_editor_protocol() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('trichterwerk.editor_protocol', true) IS DISTINCT FROM '1' AND (
    (NEW.name, NEW.description, NEW.pages, NEW.theme, NEW.ab_tests, NEW.gtm_id, NEW.meta_pixel_id,
     NEW.impressum_url, NEW.datenschutz_url, NEW.og_image_url)
    IS DISTINCT FROM
    (OLD.name, OLD.description, OLD.pages, OLD.theme, OLD.ab_tests, OLD.gtm_id, OLD.meta_pixel_id,
     OLD.impressum_url, OLD.datenschutz_url, OLD.og_image_url)
    OR (NEW.status = 'published' AND OLD.status <> 'published')
  ) THEN
    RAISE EXCEPTION 'Editor protocol update required' USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS funnel_editor_protocol ON funnels;
CREATE TRIGGER funnel_editor_protocol BEFORE UPDATE ON funnels FOR EACH ROW EXECUTE FUNCTION guard_funnel_editor_protocol();
