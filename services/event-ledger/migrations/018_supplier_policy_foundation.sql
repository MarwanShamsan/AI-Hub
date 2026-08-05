ALTER TABLE request_system.supplier_profiles
ADD COLUMN IF NOT EXISTS supplier_type TEXT CHECK (
  supplier_type IN (
    'manufacturer',
    'trading_company',
    'exporter',
    'distributor',
    'other'
  )
);

ALTER TABLE request_system.supplier_files
ADD COLUMN IF NOT EXISTS document_type TEXT CHECK (
  document_type IN (
    'LEGAL_REGISTRATION',
    'TRADE_LICENSE',
    'TAX_REGISTRATION',
    'MANUFACTURING_LICENSE',
    'EXPORT_LICENSE',
    'DISTRIBUTION_AUTHORIZATION',
    'QUALITY_CERTIFICATE',
    'FACTORY_PROFILE',
    'OTHER'
  )
);

ALTER TABLE request_system.supplier_files
ADD COLUMN IF NOT EXISTS declared_document_number TEXT;

ALTER TABLE request_system.supplier_files
ADD COLUMN IF NOT EXISTS declared_expiry_date DATE;

ALTER TABLE request_system.supplier_files
ADD COLUMN IF NOT EXISTS notes TEXT;