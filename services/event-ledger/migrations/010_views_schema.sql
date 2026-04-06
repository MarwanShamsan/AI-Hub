CREATE SCHEMA IF NOT EXISTS views;

CREATE TABLE IF NOT EXISTS views.deal_projection (
  deal_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,

  deal_title TEXT,
  buyer_id TEXT,
  supplier_id TEXT,
  currency TEXT,

  status TEXT NOT NULL,

  inspection_passed BOOLEAN DEFAULT FALSE,
  shipment_verified BOOLEAN DEFAULT FALSE,

  token_a_issued BOOLEAN DEFAULT FALSE,
  token_b_issued BOOLEAN DEFAULT FALSE,
  token_c_issued BOOLEAN DEFAULT FALSE,

  dispute_open BOOLEAN DEFAULT FALSE,
  deal_closed BOOLEAN DEFAULT FALSE,

  timer_started BOOLEAN DEFAULT FALSE,
  timer_expired BOOLEAN DEFAULT FALSE,

  last_event_type TEXT,
  last_event_at TIMESTAMPTZ,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_views_deal_tenant
ON views.deal_projection (tenant_id);

CREATE TABLE IF NOT EXISTS views.timer_index (
  deal_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  expired_at TIMESTAMPTZ NULL,
  state TEXT NOT NULL DEFAULT 'NONE',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_views_timer_state_expires
ON views.timer_index (state, expires_at);

CREATE INDEX IF NOT EXISTS idx_views_timer_tenant
ON views.timer_index (tenant_id);