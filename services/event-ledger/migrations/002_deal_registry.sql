CREATE TABLE IF NOT EXISTS deal_registry (
  deal_id     UUID PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_registry_tenant_idx
  ON deal_registry (tenant_id);
