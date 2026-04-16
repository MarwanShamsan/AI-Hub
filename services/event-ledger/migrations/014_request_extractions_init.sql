CREATE TABLE IF NOT EXISTS request_system.request_extractions (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES request_system.requests(request_id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  source_file_id UUID REFERENCES request_system.request_files(id) ON DELETE SET NULL,

  source_type TEXT NOT NULL CHECK (
    source_type IN ('PDF_TEXT', 'PDF_OCR', 'IMAGE_OCR', 'MANUAL_MERGE')
  ),

  extracted_text TEXT,
  extracted_payload JSONB NOT NULL,
  confidence_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,

  review_status TEXT NOT NULL CHECK (
    review_status IN ('PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'SUPERSEDED')
  ) DEFAULT 'PENDING_REVIEW',

  created_by TEXT NOT NULL,
  confirmed_by TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_extractions_request_created_at
  ON request_system.request_extractions (request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_extractions_source_file
  ON request_system.request_extractions (source_file_id);