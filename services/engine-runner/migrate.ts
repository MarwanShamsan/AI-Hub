import "dotenv/config";
import path from "node:path";
import { Pool } from "pg";
import { runSqlMigrations } from "../../shared/db/runSqlMigrations";

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: getDatabaseUrl()
  });

  try {
    const migrationsDir = path.resolve(process.cwd(), "services/event-ledger/migrations");

    const result = await runSqlMigrations(pool, migrationsDir);

    console.log("Migration run completed.");
    console.log("Applied migrations:");
    for (const filename of result.applied) {
      console.log(`  + ${filename}`);
    }

    console.log("Skipped migrations:");
    for (const filename of result.skipped) {
      console.log(`  = ${filename}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration run failed.");
  console.error(error);
  process.exit(1);
});