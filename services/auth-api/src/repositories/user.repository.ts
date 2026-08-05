import type { AuthRole } from "../types/auth";
import {
  DbExecutor,
  pool
} from "../db/pool";

export type DbUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  status: "ACTIVE" | "DISABLED";
  tenant_id: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type DbUserRoleName = AuthRole;

export type DbUserRole = {
  id: string;
  user_id: string;
  role: DbUserRoleName;
  agent_id: number | null;
  created_at: string;
};

export type DbRefreshToken = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

function getExecutor(executor?: DbExecutor): DbExecutor {
  return executor ?? pool;
}

function buildLegacyUsername(userId: string): string {
  return `legacy_${userId.replace(/-/g, "").slice(0, 24).toLowerCase()}`;
}

export async function findUserByEmail(
  email: string,
  executor?: DbExecutor
): Promise<DbUser | null> {
  const result = await getExecutor(executor).query<DbUser>(
    `
      SELECT
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at,
        created_at,
        updated_at,
        last_login_at
      FROM app_auth.users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email.trim()]
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmailForUpdate(
  email: string,
  executor: DbExecutor
): Promise<DbUser | null> {
  const result = await executor.query<DbUser>(
    `
      SELECT
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at,
        created_at,
        updated_at,
        last_login_at
      FROM app_auth.users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      FOR UPDATE
    `,
    [email.trim()]
  );

  return result.rows[0] ?? null;
}

export async function findUserByUsername(
  username: string,
  executor?: DbExecutor
): Promise<DbUser | null> {
  const result = await getExecutor(executor).query<DbUser>(
    `
      SELECT
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at,
        created_at,
        updated_at,
        last_login_at
      FROM app_auth.users
      WHERE LOWER(username) = LOWER($1)
      LIMIT 1
    `,
    [username.trim()]
  );

  return result.rows[0] ?? null;
}

export async function findUserByIdentifier(
  identifier: string,
  executor?: DbExecutor
): Promise<DbUser | null> {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const result = await getExecutor(executor).query<DbUser>(
    `
      SELECT
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at,
        created_at,
        updated_at,
        last_login_at
      FROM app_auth.users
      WHERE email = $1
         OR username = $1
      LIMIT 1
    `,
    [normalizedIdentifier]
  );

  return result.rows[0] ?? null;
}

export async function findUserByIdForUpdate(
  userId: string,
  executor: DbExecutor
): Promise<DbUser | null> {
  const result =
    await executor.query<DbUser>(
      `
        SELECT
          id,
          username,
          email,
          password_hash,
          status,
          tenant_id,
          email_verified_at,
          created_at,
          updated_at,
          last_login_at
        FROM app_auth.users
        WHERE id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

  return result.rows[0] ?? null;
}

export async function findUserById(
  userId: string,
  executor?: DbExecutor
): Promise<DbUser | null> {
  const result = await getExecutor(executor).query<DbUser>(
    `
      SELECT
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at,
        created_at,
        updated_at,
        last_login_at
      FROM app_auth.users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function findPrimaryRoleByUserId(
  userId: string,
  executor?: DbExecutor
): Promise<DbUserRole | null> {
  const result = await getExecutor(executor).query<DbUserRole>(
    `
      SELECT
        id,
        user_id,
        role,
        agent_id,
        created_at
      FROM app_auth.user_roles
      WHERE user_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function createUser(
  params: {
    id: string;
    username?: string;
    email: string;
    passwordHash: string;
    status: "ACTIVE" | "DISABLED";
    tenantId: string;

    /**
     * undefined:
     *   Compatibility mode for old internal callers. The account starts
     *   verified.
     *
     * null:
     *   Public account starts unverified.
     *
     * string:
     *   Explicit verification timestamp.
     */
    emailVerifiedAt?: string | null;
  },
  executor?: DbExecutor
): Promise<DbUser> {
  const username =
    params.username?.trim().toLowerCase() ||
    buildLegacyUsername(params.id);

  const normalizedEmail = params.email.trim().toLowerCase();

  const emailVerifiedAt =
    params.emailVerifiedAt === undefined
      ? new Date().toISOString()
      : params.emailVerifiedAt;

  const result = await getExecutor(executor).query<DbUser>(
    `
      INSERT INTO app_auth.users (
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at,
        created_at,
        updated_at,
        last_login_at
    `,
    [
      params.id,
      username,
      normalizedEmail,
      params.passwordHash,
      params.status,
      params.tenantId,
      emailVerifiedAt
    ]
  );

  return result.rows[0];
}

export async function createUserRole(
  params: {
    id: string;
    userId: string;
    role: DbUserRoleName;
    agentId: number | null;
  },
  executor?: DbExecutor
): Promise<DbUserRole> {
  const result = await getExecutor(executor).query<DbUserRole>(
    `
      INSERT INTO app_auth.user_roles (
        id,
        user_id,
        role,
        agent_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id,
        role,
        agent_id,
        created_at
    `,
    [
      params.id,
      params.userId,
      params.role,
      params.agentId
    ]
  );

  return result.rows[0];
}

export async function insertRefreshToken(
  params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    userAgent: string | null;
    ipAddress: string | null;
  },
  executor?: DbExecutor
): Promise<void> {
  await getExecutor(executor).query(
    `
      INSERT INTO app_auth.refresh_tokens (
        id,
        user_id,
        token_hash,
        expires_at,
        user_agent,
        ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      params.id,
      params.userId,
      params.tokenHash,
      params.expiresAt,
      params.userAgent,
      params.ipAddress
    ]
  );
}

export async function findRefreshTokenByHash(
  tokenHash: string,
  executor?: DbExecutor
): Promise<DbRefreshToken | null> {
  const result = await getExecutor(executor).query<DbRefreshToken>(
    `
      SELECT
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at
      FROM app_auth.refresh_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

export async function findRefreshTokenByHashForUpdate(
  tokenHash: string,
  executor: DbExecutor
): Promise<DbRefreshToken | null> {
  const result = await executor.query<DbRefreshToken>(
    `
      SELECT
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at
      FROM app_auth.refresh_tokens
      WHERE token_hash = $1
      LIMIT 1
      FOR UPDATE
    `,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

export async function revokeRefreshToken(
  tokenId: string,
  executor?: DbExecutor
): Promise<boolean> {
  const result = await getExecutor(executor).query(
    `
      UPDATE app_auth.refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL
    `,
    [tokenId]
  );

  return result.rowCount === 1;
}

export async function updateLastLoginAt(
  userId: string,
  executor?: DbExecutor
): Promise<void> {
  await getExecutor(executor).query(
    `
      UPDATE app_auth.users
      SET
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [userId]
  );
}

export async function markEmailVerified(
  params: {
    userId: string;
    verifiedAt: string;
  },
  executor?: DbExecutor
): Promise<DbUser | null> {
  const result = await getExecutor(executor).query<DbUser>(
    `
      UPDATE app_auth.users
      SET
        email_verified_at = COALESCE(email_verified_at, $2),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        username,
        email,
        password_hash,
        status,
        tenant_id,
        email_verified_at,
        created_at,
        updated_at,
        last_login_at
    `,
    [
      params.userId,
      params.verifiedAt
    ]
  );

  return result.rows[0] ?? null;
}

export async function insertAuditLog(
  params: {
    id: string;
    userId: string | null;
    eventType: string;
    metadata: Record<string, unknown>;
  },
  executor?: DbExecutor
): Promise<void> {
  await getExecutor(executor).query(
    `
      INSERT INTO app_auth.audit_log (
        id,
        user_id,
        event_type,
        metadata
      )
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [
      params.id,
      params.userId,
      params.eventType,
      JSON.stringify(params.metadata)
    ]
  );
}

export async function updatePasswordHash(
  params: {
    userId: string;
    passwordHash: string;
  },
  executor?: DbExecutor
): Promise<boolean> {
  const result =
    await getExecutor(executor).query(
      `
        UPDATE app_auth.users
        SET
          password_hash = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'ACTIVE'
      `,
      [
        params.userId,
        params.passwordHash
      ]
    );

  return result.rowCount === 1;
}

export async function revokeAllRefreshTokens(
  params: {
    userId: string;
    revokedAt: string;
  },
  executor?: DbExecutor
): Promise<number> {
  const result =
    await getExecutor(executor).query(
      `
        UPDATE app_auth.refresh_tokens
        SET revoked_at = $2
        WHERE user_id = $1
          AND revoked_at IS NULL
      `,
      [
        params.userId,
        params.revokedAt
      ]
    );

  return result.rowCount ?? 0;
}