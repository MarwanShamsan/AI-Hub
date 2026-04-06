ALTER TABLE deal_registry
ADD COLUMN IF NOT EXISTS request_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS deal_registry_request_id_uidx
ON deal_registry (request_id)
WHERE request_id IS NOT NULL;