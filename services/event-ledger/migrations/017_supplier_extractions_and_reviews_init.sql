CREATE TABLE IF NOT EXISTS request_system.supplier_extractions (
  id UUID PRIMARY KEY,

  supplier_id UUID NOT NULL
    REFERENCES request_system.suppliers(supplier_id) ON DELETE CASCADE,

  tenant_id TEXT NOT NULL,

  source_file_id UUID
    REFERENCES request_system.supplier_files(id) ON DELETE SET NULL,

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

CREATE INDEX IF NOT EXISTS idx_supplier_extractions_supplier_created_at
  ON request_system.supplier_extractions (supplier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_extractions_source_file
  ON request_system.supplier_extractions (source_file_id);

CREATE TABLE IF NOT EXISTS request_system.supplier_qualification_reviews (
  id UUID PRIMARY KEY,

  supplier_id UUID NOT NULL
    REFERENCES request_system.suppliers(supplier_id) ON DELETE CASCADE,

  tenant_id TEXT NOT NULL,

  extraction_id UUID
    REFERENCES request_system.supplier_extractions(id) ON DELETE SET NULL,

  decision_status TEXT NOT NULL CHECK (
    decision_status IN (
      'MISSING_REQUIREMENTS',
      'APPROVED_FOR_DISCOVERY',
      'REJECTED_PREDEAL'
    )
  ),

  reason_code TEXT NOT NULL,
  reason_text TEXT NOT NULL,

  blocking_issues JSONB NOT NULL DEFAULT '[]'::jsonb,

  decided_by_type TEXT NOT NULL CHECK (
    decided_by_type IN ('SYSTEM', 'USER')
  ),
  decided_by_id TEXT NOT NULL,

  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_qualification_reviews_supplier_created_at
  ON request_system.supplier_qualification_reviews (supplier_id, created_at DESC);