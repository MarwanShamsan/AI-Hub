import {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow
} from "pg";
import { env } from "../config/env";

export type DbExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<T>>;
};

export const pool = new Pool({
  connectionString: env.databaseUrl
});

pool.on("error", (error) => {
  console.error("AUTH_DATABASE_POOL_ERROR", {
    name: error.name,
    message: error.message
  });
});

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await operation(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("AUTH_DATABASE_ROLLBACK_ERROR", {
        message:
          rollbackError instanceof Error
            ? rollbackError.message
            : "Unknown rollback error"
      });
    }

    throw error;
  } finally {
    client.release();
  }
}

export function isPostgresError(
  error: unknown
): error is {
  code: string;
  constraint?: string;
  detail?: string;
} {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error)
  ) {
    return false;
  }

  return typeof error.code === "string";
}

export function isUniqueViolation(error: unknown): boolean {
  return isPostgresError(error) && error.code === "23505";
}