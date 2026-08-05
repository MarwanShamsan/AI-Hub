BEGIN;

ALTER TABLE request_system.supplier_files
  ADD COLUMN IF NOT EXISTS file_sha256 text;

ALTER TABLE request_system.supplier_files
  ADD COLUMN IF NOT EXISTS issuing_country text;

ALTER TABLE request_system.supplier_files
  ADD COLUMN IF NOT EXISTS supersedes_file_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'supplier_files_supersedes_file_fk'
  ) THEN
    ALTER TABLE request_system.supplier_files
      ADD CONSTRAINT supplier_files_supersedes_file_fk
      FOREIGN KEY (supersedes_file_id)
      REFERENCES request_system.supplier_files(id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'supplier_files_file_sha256_format_check'
  ) THEN
    ALTER TABLE request_system.supplier_files
      ADD CONSTRAINT supplier_files_file_sha256_format_check
      CHECK (
        file_sha256 IS NULL
        OR file_sha256 ~ '^[0-9a-f]{64}$'
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS
  idx_supplier_files_supplier_document_created
ON request_system.supplier_files (
  supplier_id,
  tenant_id,
  document_type,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_supplier_files_sha256
ON request_system.supplier_files (
  supplier_id,
  tenant_id,
  file_sha256
)
WHERE file_sha256 IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_supplier_files_supersedes
ON request_system.supplier_files (
  supersedes_file_id
)
WHERE supersedes_file_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS
  request_system.supplier_document_declarations (
    id uuid PRIMARY KEY,

    supplier_id uuid NOT NULL,
    tenant_id text NOT NULL,

    source_file_id uuid NOT NULL,
    extraction_id uuid NOT NULL,

    declaration_type text NOT NULL,

    declared_fields jsonb NOT NULL
      DEFAULT '[]'::jsonb,

    correction_reason text NULL,

    submitted_by text NOT NULL,

    created_at timestamptz NOT NULL
      DEFAULT NOW(),

    CONSTRAINT supplier_document_declarations_type_check
      CHECK (
        declaration_type IN (
          'CONFIRMED_AS_EXTRACTED',
          'CORRECTION_SUBMITTED'
        )
      ),

    CONSTRAINT supplier_document_declarations_fields_array_check
      CHECK (
        jsonb_typeof(declared_fields) = 'array'
      ),

    CONSTRAINT supplier_document_declarations_file_fk
      FOREIGN KEY (source_file_id)
      REFERENCES request_system.supplier_files(id)
      ON DELETE RESTRICT,

    CONSTRAINT supplier_document_declarations_extraction_fk
      FOREIGN KEY (extraction_id)
      REFERENCES request_system.supplier_extractions(id)
      ON DELETE RESTRICT
  );

CREATE INDEX IF NOT EXISTS
  idx_supplier_document_declarations_supplier
ON request_system.supplier_document_declarations (
  supplier_id,
  tenant_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_supplier_document_declarations_file
ON request_system.supplier_document_declarations (
  source_file_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_supplier_document_declarations_extraction
ON request_system.supplier_document_declarations (
  extraction_id,
  created_at DESC
);

CREATE OR REPLACE FUNCTION
  request_system.prevent_supplier_document_declaration_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'supplier_document_declarations is append-only';
END;
$$;

DROP TRIGGER IF EXISTS
  supplier_document_declarations_no_update
ON request_system.supplier_document_declarations;

CREATE TRIGGER
  supplier_document_declarations_no_update
BEFORE UPDATE
ON request_system.supplier_document_declarations
FOR EACH ROW
EXECUTE FUNCTION
  request_system.prevent_supplier_document_declaration_mutation();

DROP TRIGGER IF EXISTS
  supplier_document_declarations_no_delete
ON request_system.supplier_document_declarations;

CREATE TRIGGER
  supplier_document_declarations_no_delete
BEFORE DELETE
ON request_system.supplier_document_declarations
FOR EACH ROW
EXECUTE FUNCTION
  request_system.prevent_supplier_document_declaration_mutation();

COMMIT;