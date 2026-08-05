import {
  DbExecutor,
  pool
} from "../db/pool";

export type DbEmailVerificationToken = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

function getExecutor(executor?: DbExecutor): DbExecutor {
  return executor ?? pool;
}

export async function createEmailVerificationToken(
  params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
  },
  executor?: DbExecutor
): Promise<DbEmailVerificationToken> {
  const result =
    await getExecutor(executor).query<DbEmailVerificationToken>(
      `
        INSERT INTO app_auth.email_verification_tokens (
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

  return result.rows[0];
}

export async function findEmailVerificationTokenByHash(
  tokenHash: string,
  executor?: DbExecutor
): Promise<DbEmailVerificationToken | null> {
  const result =
    await getExecutor(executor).query<DbEmailVerificationToken>(
      `
        SELECT
          id,
          user_id,
          token_hash,
          expires_at,
          consumed_at,
          revoked_at,
          created_at
        FROM app_auth.email_verification_tokens
        WHERE token_hash = $1
        LIMIT 1
      `,
      [tokenHash]
    );

  return result.rows[0] ?? null;
}

export async function findEmailVerificationTokenByHashForUpdate(
  tokenHash: string,
  executor: DbExecutor
): Promise<DbEmailVerificationToken | null> {
  const result =
    await executor.query<DbEmailVerificationToken>(
      `
        SELECT
          id,
          user_id,
          token_hash,
          expires_at,
          consumed_at,
          revoked_at,
          created_at
        FROM app_auth.email_verification_tokens
        WHERE token_hash = $1
        LIMIT 1
        FOR UPDATE
      `,
      [tokenHash]
    );

  return result.rows[0] ?? null;
}

export async function findLatestEmailVerificationTokenForUser(
  userId: string,
  executor?: DbExecutor
): Promise<DbEmailVerificationToken | null> {
  const result =
    await getExecutor(executor).query<DbEmailVerificationToken>(
      `
        SELECT
          id,
          user_id,
          token_hash,
          expires_at,
          consumed_at,
          revoked_at,
          created_at
        FROM app_auth.email_verification_tokens
        WHERE user_id = $1
          AND consumed_at IS NULL
          AND revoked_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

  return result.rows[0] ?? null;
}

export async function countEmailVerificationTokensCreatedSince(
  params: {
    userId: string;
    since: string;
  },
  executor?: DbExecutor
): Promise<number> {
  const result = await getExecutor(executor).query<{
    token_count: string;
  }>(
    `
      SELECT COUNT(*)::TEXT AS token_count
      FROM app_auth.email_verification_tokens
      WHERE user_id = $1
        AND created_at >= $2
    `,
    [
      params.userId,
      params.since
    ]
  );

  return Number(result.rows[0]?.token_count ?? "0");
}

export async function revokeActiveEmailVerificationTokens(
  params: {
    userId: string;
    revokedAt: string;
  },
  executor?: DbExecutor
): Promise<number> {
  const result = await getExecutor(executor).query(
    `
      UPDATE app_auth.email_verification_tokens
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

export async function consumeEmailVerificationToken(
  params: {
    tokenId: string;
    consumedAt: string;
  },
  executor?: DbExecutor
): Promise<boolean> {
  const result = await getExecutor(executor).query(
    `
      UPDATE app_auth.email_verification_tokens
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

export async function revokeEmailVerificationToken(
  params: {
    tokenId: string;
    revokedAt: string;
  },
  executor?: DbExecutor
): Promise<boolean> {
  const result = await getExecutor(executor).query(
    `
      UPDATE app_auth.email_verification_tokens
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