-- Create a separate schema for derived read models
CREATE SCHEMA IF NOT EXISTS views;

-- 1) Current deal snapshot (derived)
CREATE TABLE IF NOT EXISTS views.deal_projection (
  deal_id         UUID PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  status          TEXT NOT NULL,
  last_seq        BIGINT NOT NULL DEFAULT 0,
  last_stream_seq BIGINT NOT NULL DEFAULT 0,
  last_event_type TEXT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_projection_tenant_idx
  ON views.deal_projection(tenant_id);

-- 2) Timer index (derived)
CREATE TABLE IF NOT EXISTS views.timer_index (
  deal_id     UUID PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  started_at  TIMESTAMPTZ NULL,
  expires_at  TIMESTAMPTZ NULL,
  expired_at  TIMESTAMPTZ NULL,
  state       TEXT NOT NULL DEFAULT 'NONE', -- NONE|RUNNING|EXPIRED
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timer_index_tenant_idx
  ON views.timer_index(tenant_id);

-- 3) Materializer checkpoint (allowed to update)
-- You already have engine_checkpoints in public schema.
-- We'll reuse it with a dedicated engine_name.
