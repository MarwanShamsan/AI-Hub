CREATE SCHEMA IF NOT EXISTS app_auth;

CREATE TABLE IF NOT EXISTS app_auth.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS app_auth.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'supplier', 'agent6', 'ops')),
  agent_id SMALLINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_auth.refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  user_agent TEXT NULL,
  ip_address TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_auth.audit_log (
  id UUID PRIMARY KEY,
  user_id UUID NULL REFERENCES app_auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_auth_user_roles_user_id
  ON app_auth.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_app_auth_refresh_tokens_user_id
  ON app_auth.refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_app_auth_refresh_tokens_token_hash
  ON app_auth.refresh_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_app_auth_audit_log_user_id
  ON app_auth.audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_app_auth_audit_log_event_type
  ON app_auth.audit_log(event_type);