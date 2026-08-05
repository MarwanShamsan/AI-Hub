import {
  type DbExecutor,
  pool
} from "../db/pool";

export type DbPasswordResetToken = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

function getExecutor(
  executor?: DbExecutor
): DbExecutor {
  return executor ?? pool;
}

export async function createPasswordResetToken(
  params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
  },
  executor?: DbExecutor
): Promise<DbPasswordResetToken> {
  const result =
    await getExecutor(executor)
      .query<DbPasswordResetToken>(
        `
          INSERT INTO app_auth.password_reset_tokens (
            id,
            user_id,
            token_hash,
            expires_at
          )
          VALUES ($1, $2, $3, $4)
          RETURNING
            id,
            user_id,
            token_hash,
            expires_at,
            consumed_at,
            revoked_at,
            created_at
        `,
        [
          params.id,
          params.userId,
          params.tokenHash,
          params.expiresAt
        ]
      );

  const createdToken =
    result.rows[0];

  if (!createdToken) {
    throw new Error(
      "PASSWORD_RESET_TOKEN_CREATE_FAILED"
    );
  }

  return createdToken;
}

export async function findPasswordResetTokenByHash(
  tokenHash: string,
  executor?: DbExecutor
): Promise<DbPasswordResetToken | null> {
  const result =
    await getExecutor(executor)
      .query<DbPasswordResetToken>(
        `
          SELECT
            id,
            user_id,
            token_hash,
            expires_at,
            consumed_at,
            revoked_at,
            created_at
          FROM app_auth.password_reset_tokens
          WHERE token_hash = $1
          LIMIT 1
        `,
        [
          tokenHash
        ]
      );

  return result.rows[0] ?? null;
}

export async function findPasswordResetTokenByHashForUpdate(
  tokenHash: string,
  executor: DbExecutor
): Promise<DbPasswordResetToken | null> {
  const result =
    await executor
      .query<DbPasswordResetToken>(
        `
          SELECT
            id,
            user_id,
            token_hash,
            expires_at,
            consumed_at,
            revoked_at,
            created_at
          FROM app_auth.password_reset_tokens
          WHERE token_hash = $1
          LIMIT 1
          FOR UPDATE
        `,
        [
          tokenHash
        ]
      );

  return result.rows[0] ?? null;
}

export async function findLatestPasswordResetTokenForUser(
  userId: string,
  executor?: DbExecutor
): Promise<DbPasswordResetToken | null> {
  const result =
    await getExecutor(executor)
      .query<DbPasswordResetToken>(
        `
          SELECT
            id,
            user_id,
            token_hash,
            expires_at,
            consumed_at,
            revoked_at,
            created_at
          FROM app_auth.password_reset_tokens
          WHERE user_id = $1
          ORDER BY
            created_at DESC,
            id DESC
          LIMIT 1
        `,
        [
          userId
        ]
      );

  return result.rows[0] ?? null;
}

export async function countPasswordResetTokensCreatedSince(
  params: {
    userId: string;
    since: string;
  },
  executor?: DbExecutor
): Promise<number> {
  const result =
    await getExecutor(executor)
      .query<{
        count: string;
      }>(
        `
          SELECT
            COUNT(*)::text AS count
          FROM app_auth.password_reset_tokens
          WHERE user_id = $1
            AND created_at >= $2
        `,
        [
          params.userId,
          params.since
        ]
      );

  const countValue =
    result.rows[0]?.count ?? "0";

  const parsed =
    Number.parseInt(
      countValue,
      10
    );

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0;
  }

  return parsed;
}

export async function revokeActivePasswordResetTokens(
  params: {
    userId: string;
    revokedAt: string;
  },
  executor?: DbExecutor
): Promise<number> {
  const result =
    await getExecutor(executor)
      .query(
        `
          UPDATE app_auth.password_reset_tokens
          SET revoked_at = $2
          WHERE user_id = $1
            AND consumed_at IS NULL
            AND revoked_at IS NULL
        `,
        [
          params.userId,
          params.revokedAt
        ]
      );

  return result.rowCount ?? 0;
}

export async function revokePasswordResetToken(
  params: {
    tokenId: string;
    revokedAt: string;
  },
  executor?: DbExecutor
): Promise<boolean> {
  const result =
    await getExecutor(executor)
      .query(
        `
          UPDATE app_auth.password_reset_tokens
          SET revoked_at = $2
          WHERE id = $1
            AND consumed_at IS NULL
            AND revoked_at IS NULL
        `,
        [
          params.tokenId,
          params.revokedAt
        ]
      );

  return result.rowCount === 1;
}

export async function consumePasswordResetToken(
  params: {
    tokenId: string;
    consumedAt: string;
  },
  executor?: DbExecutor
): Promise<boolean> {
  const result =
    await getExecutor(executor)
      .query(
        `
          UPDATE app_auth.password_reset_tokens
          SET consumed_at = $2
          WHERE id = $1
            AND consumed_at IS NULL
            AND revoked_at IS NULL
        `,
        [
          params.tokenId,
          params.consumedAt
        ]
      );

  return result.rowCount === 1;
}