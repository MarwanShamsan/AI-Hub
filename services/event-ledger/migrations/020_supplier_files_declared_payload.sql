ALTER TABLE request_system.supplier_files
ADD COLUMN IF NOT EXISTS declared_payload jsonb NOT NULL DEFAULT '{}'::jsonb;