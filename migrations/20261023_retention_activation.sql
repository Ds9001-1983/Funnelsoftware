-- Existing drafts stay disabled; never infer authorization from their existence.
ALTER TABLE funnel_retention_drafts ADD COLUMN IF NOT EXISTS active_version integer;
ALTER TABLE funnel_retention_drafts ADD COLUMN IF NOT EXISTS activated_at timestamp;
