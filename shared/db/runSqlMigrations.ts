import fs from "node:fs/promises";
import path from "node:path";
import { Pool, PoolClient } from "pg";

export type SqlMigrationResult = {
  applied: string[];
  skipped: string[];
};

async function ensureSchemaMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const res = await client.query<{
    filename: string;
  }>(`
    SELECT filename
    FROM schema_migrations
  `);

  return new Set(res.rows.map((r) => r.filename));
}

function isSqlFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".sql");
}

function sortMigrationFiles(files: string[]): string[] {
  return [...files].sort((a, b) => a.localeCompare(b));
}

export async function runSqlMigrations(
  pool: Pool,
  migrationsDir: string
): Promise<SqlMigrationResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await ensureSchemaMigrationsTable(client);

    const dirEntries = await fs.readdir(migrationsDir, { withFileTypes: true });
    const files = sortMigrationFiles(
      dirEntries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter(isSqlFile)
    );

    const appliedSet = await getAppliedMigrations(client);

    const applied: string[] = [];
    const skipped: string[] = [];

    for (const filename of files) {
      if (appliedSet.has(filename)) {
        skipped.push(filename);
        continue;
      }

      const fullPath = path.join(migrationsDir, filename);
      const sql = await fs.readFile(fullPath, "utf8");

      const trimmed = sql.trim();
      if (!trimmed) {
        await client.query(
          `
          INSERT INTO schema_migrations (filename)
          VALUES ($1)
          ON CONFLICT (filename) DO NOTHING
          `,
          [filename]
        );
        applied.push(filename);
        continue;
      }

      await client.query(trimmed);

      await client.query(
        `
        INSERT INTO schema_migrations (filename)
        VALUES ($1)
        ON CONFLICT (filename) DO NOTHING
        `,
        [filename]
      );

      applied.push(filename);
    }

    await client.query("COMMIT");

    return { applied, skipped };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}