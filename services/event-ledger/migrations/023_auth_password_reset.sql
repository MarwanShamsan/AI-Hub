BEGIN;

CREATE TABLE IF NOT EXISTS app_auth.password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL
    REFERENCES app_auth.users(id)
    ON DELETE CASCADE,

  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,

  consumed_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT password_reset_tokens_token_hash_unique
    UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS
  password_reset_tokens_user_created_idx
ON app_auth.password_reset_tokens (
  user_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  password_reset_tokens_active_idx
ON app_auth.password_reset_tokens (
  user_id,
  expires_at
)
WHERE consumed_at IS NULL
  AND revoked_at IS NULL;

COMMIT;