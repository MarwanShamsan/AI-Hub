CREATE TABLE IF NOT EXISTS request_system.supplier_files (
  id UUID PRIMARY KEY,
  supplier_id UUID NOT NULL
    REFERENCES request_system.suppliers(supplier_id) ON DELETE CASCADE,

  tenant_id TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,

  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_data BYTEA NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_files_supplier_created_at
  ON request_system.supplier_files (supplier_id, created_at DESC);