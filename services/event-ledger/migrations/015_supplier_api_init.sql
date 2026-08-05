CREATE TABLE IF NOT EXISTS request_system.suppliers (
  supplier_id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL UNIQUE,

  qualification_status TEXT NOT NULL CHECK (
    qualification_status IN (
      'DRAFT',
      'PROFILE_INCOMPLETE',
      'READY_FOR_REVIEW',
      'PENDING_REVIEW',
      'MISSING_REQUIREMENTS',
      'APPROVED_FOR_DISCOVERY',
      'REJECTED_PREDEAL'
    )
  ) DEFAULT 'DRAFT',

  last_decision_reason_code TEXT,
  last_decision_reason_text TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_system.supplier_profiles (
  supplier_id UUID PRIMARY KEY
    REFERENCES request_system.suppliers(supplier_id) ON DELETE CASCADE,

  tenant_id TEXT NOT NULL UNIQUE,

  legal_name TEXT,
  registration_number TEXT,
  registration_country TEXT,
  business_category TEXT,

  product_categories JSONB NOT NULL DEFAULT '[]'::jsonb,

  operational_contact_name TEXT,
  operational_contact_email TEXT,
  operational_contact_phone TEXT,

  declared_license_expiry_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_updated_at
  ON request_system.suppliers (tenant_id, updated_at DESC);