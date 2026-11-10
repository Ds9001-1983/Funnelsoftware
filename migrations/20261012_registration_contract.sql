-- Kein Backfill: Für Bestandskonten wird keine Zustimmung erfunden.
-- Der Server schreibt den Nachweis atomar zusammen mit dem neuen Konto.
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_contract jsonb;
