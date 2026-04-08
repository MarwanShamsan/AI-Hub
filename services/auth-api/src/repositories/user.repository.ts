import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  status: "ACTIVE" | "DISABLED";
  tenant_id: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type DbUserRole = {
  id: string;
  user_id: string;
  role: "client" | "supplier" | "agent6" | "ops";
  agent_id: number | null;
  created_at: string;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    `
      SELECT *
      FROM app_auth.users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

export async function findUserById(userId: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    `
      SELECT *
      FROM app_auth.users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function findPrimaryRoleByUserId(
  userId: string
): Promise<DbUserRole | null> {
  const result = await pool.query<DbUserRole>(
    `
      SELECT *
      FROM app_auth.user_roles
      WHERE user_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function createUser(params: {
  id: string;
  email: string;
  passwordHash: string;
  status: "ACTIVE" | "DISABLED";
  tenantId: string;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO app_auth.users (
        id, email, password_hash, status, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [params.id, params.email, params.passwordHash, params.status, params.tenantId]
  );
}

export async function createUserRole(params: {
  id: string;
  userId: string;
  role: "client" | "supplier" | "agent6" | "ops";
  agentId: number | null;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO app_auth.user_roles (
        id, user_id, role, agent_id
      )
      VALUES ($1, $2, $3, $4)
    `,
    [params.id, params.userId, params.role, params.agentId]
  );
}

export async function insertRefreshToken(params: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO app_auth.refresh_tokens (
        id, user_id, token_hash, expires_at, user_agent, ip_address
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
  tokenHash: string
): Promise<{
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
} | null> {
  const result = await pool.query(
    `
      SELECT id, user_id, token_hash, expires_at, revoked_at
      FROM app_auth.refresh_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await pool.query(
    `
      UPDATE app_auth.refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
    `,
    [tokenId]
  );
}

export async function updateLastLoginAt(userId: string): Promise<void> {
  await pool.query(
    `
      UPDATE app_auth.users
      SET last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `,
    [userId]
  );
}

export async function insertAuditLog(params: {
  id: string;
  userId: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO app_auth.audit_log (id, user_id, event_type, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [params.id, params.userId, params.eventType, JSON.stringify(params.metadata)]
  );
}