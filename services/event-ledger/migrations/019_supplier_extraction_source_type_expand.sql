ALTER TABLE request_system.supplier_extractions
DROP CONSTRAINT IF EXISTS supplier_extractions_source_type_check;

ALTER TABLE request_system.supplier_extractions
ADD CONSTRAINT supplier_extractions_source_type_check
CHECK (
  source_type IN (
    'PDF_TEXT',
    'PDF_OCR',
    'IMAGE_OCR',
    'MANUAL_MERGE',
    'OCR_SCANNED_PDF',
    'UNREADABLE_PDF'
  )
);