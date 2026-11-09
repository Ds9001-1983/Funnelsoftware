-- Preserve historical events; only fix the default for future rows.
ALTER TABLE platform_visits ALTER COLUMN timestamp SET DEFAULT (now() AT TIME ZONE 'UTC');
