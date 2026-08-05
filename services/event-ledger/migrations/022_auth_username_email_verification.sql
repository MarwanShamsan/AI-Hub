ALTER TABLE app_auth.users
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE app_auth.users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

-- Preserve the existing internal administrator bootstrap flow.
-- Public registration remains limited by application validation to:
-- client | supplier
DO $$
DECLARE
  existing_constraint RECORD;
BEGIN
  FOR existing_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'app_auth.user_roles'::REGCLASS
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE FORMAT(
      'ALTER TABLE app_auth.user_roles DROP CONSTRAINT %I',
      existing_constraint.conname
    );
  END LOOP;
END;
$$;

ALTER TABLE app_auth.user_roles
  ADD CONSTRAINT app_auth_user_roles_role_check
  CHECK (
    role IN (
      'client',
      'supplier',
      'agent6',
      'ops',
      'admin'
    )
  );

  
-- Prevent case-insensitive duplicate emails before normalization.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM app_auth.users
    GROUP BY LOWER(BTRIM(email))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot normalize app_auth.users.email because case-insensitive duplicates exist';
  END IF;
END;
$$;


-- Existing registrations already normalize emails in application code.
-- This also normalizes any legacy/manual rows before enforcing the constraint.
UPDATE app_auth.users
SET
  email = LOWER(BTRIM(email)),
  updated_at = NOW()
WHERE email IS DISTINCT FROM LOWER(BTRIM(email));


-- Existing accounts predate email verification.
-- Mark them as verified to avoid locking out current users.
UPDATE app_auth.users
SET
  email_verified_at = COALESCE(email_verified_at, created_at),
  updated_at = NOW()
WHERE email_verified_at IS NULL;


-- Backfill deterministic internal usernames for existing accounts.
-- New public registrations will be required to submit their own username.
UPDATE app_auth.users
SET
  username = 'legacy_' || SUBSTRING(MD5(id::TEXT) FROM 1 FOR 24),
  updated_at = NOW()
WHERE username IS NULL
   OR BTRIM(username) = '';


-- Normalize any username values that may already exist in an environment
-- where this column was introduced manually.
UPDATE app_auth.users
SET
  username = LOWER(BTRIM(username)),
  updated_at = NOW()
WHERE username IS DISTINCT FROM LOWER(BTRIM(username));


-- Fail clearly if an environment already contains conflicting usernames.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM app_auth.users
    GROUP BY LOWER(username)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create username uniqueness constraint because duplicate usernames exist';
  END IF;
END;
$$;


-- Keep the migration backward-compatible with internal scripts or an older
-- application instance during deployment. Public registration validation
-- will still require an explicit username.
ALTER TABLE app_auth.users
  ALTER COLUMN username SET DEFAULT (
    'legacy_' ||
    SUBSTRING(
      MD5(
        RANDOM()::TEXT ||
        CLOCK_TIMESTAMP()::TEXT
      )
      FROM 1 FOR 24
    )
  );

ALTER TABLE app_auth.users
  ALTER COLUMN username SET NOT NULL;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_auth_users_email_normalized_check'
      AND conrelid = 'app_auth.users'::REGCLASS
  ) THEN
    ALTER TABLE app_auth.users
      ADD CONSTRAINT app_auth_users_email_normalized_check
      CHECK (
        email = LOWER(BTRIM(email))
        AND CHAR_LENGTH(email) BETWEEN 3 AND 320
      );
  END IF;
END;
$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_auth_users_username_format_check'
      AND conrelid = 'app_auth.users'::REGCLASS
  ) THEN
    ALTER TABLE app_auth.users
      ADD CONSTRAINT app_auth_users_username_format_check
      CHECK (
        username = LOWER(BTRIM(username))
        AND CHAR_LENGTH(username) BETWEEN 3 AND 32
        AND username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
      );
  END IF;
END;
$$;


CREATE UNIQUE INDEX IF NOT EXISTS
  uq_app_auth_users_email_normalized
ON app_auth.users (
  LOWER(email)
);


CREATE UNIQUE INDEX IF NOT EXISTS
  uq_app_auth_users_username_normalized
ON app_auth.users (
  LOWER(username)
);


CREATE TABLE IF NOT EXISTS app_auth.email_verification_tokens (
  id UUID PRIMARY KEY,

  user_id UUID NOT NULL
    REFERENCES app_auth.users(id)
    ON DELETE CASCADE,

  token_hash TEXT NOT NULL UNIQUE,

  expires_at TIMESTAMPTZ NOT NULL,

  consumed_at TIMESTAMPTZ NULL,

  revoked_at TIMESTAMPTZ NULL,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT app_auth_email_verification_token_hash_format_check
    CHECK (
      token_hash ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT app_auth_email_verification_token_expiry_check
    CHECK (
      expires_at > created_at
    ),

  CONSTRAINT app_auth_email_verification_token_consumed_time_check
    CHECK (
      consumed_at IS NULL
      OR consumed_at >= created_at
    ),

  CONSTRAINT app_auth_email_verification_token_revoked_time_check
    CHECK (
      revoked_at IS NULL
      OR revoked_at >= created_at
    )
);


CREATE INDEX IF NOT EXISTS
  idx_app_auth_email_verification_tokens_user_id
ON app_auth.email_verification_tokens (
  user_id
);


CREATE INDEX IF NOT EXISTS
  idx_app_auth_email_verification_tokens_user_created_at
ON app_auth.email_verification_tokens (
  user_id,
  created_at DESC
);


CREATE INDEX IF NOT EXISTS
  idx_app_auth_email_verification_tokens_expires_at
ON app_auth.email_verification_tokens (
  expires_at
)
WHERE consumed_at IS NULL
  AND revoked_at IS NULL;


-- A user may have only one active verification token.
-- Resend must revoke the previous token before inserting a new one.
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_app_auth_email_verification_tokens_active_user
ON app_auth.email_verification_tokens (
  user_id
)
WHERE consumed_at IS NULL
  AND revoked_at IS NULL;


COMMENT ON COLUMN app_auth.users.username IS
  'Normalized public login identifier. Stored in lowercase.';

COMMENT ON COLUMN app_auth.users.email_verified_at IS
  'UTC timestamp at which the email address was verified. NULL means unverified.';

COMMENT ON TABLE app_auth.email_verification_tokens IS
  'Non-sovereign one-time email verification tokens. Only SHA-256 token hashes are stored.';

COMMENT ON COLUMN app_auth.email_verification_tokens.token_hash IS
  'Lowercase hexadecimal SHA-256 hash of the raw verification token.';

COMMENT ON COLUMN app_auth.email_verification_tokens.revoked_at IS
  'Set when a token is invalidated, including invalidation caused by resend.';
