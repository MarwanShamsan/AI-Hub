CREATE SCHEMA IF NOT EXISTS request_system;

CREATE TABLE IF NOT EXISTS request_system.requests (
  request_id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'DRAFT',
      'READY_FOR_DISCOVERY',
      'DISCOVERY_IN_PROGRESS',
      'READY_FOR_HANDOFF'
    )
  ),
  raw_input JSONB NOT NULL,
  normalized_input JSONB NOT NULL,
  confirmed_input JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_tenant_updated_at
  ON request_system.requests (tenant_id, updated_at DESC);