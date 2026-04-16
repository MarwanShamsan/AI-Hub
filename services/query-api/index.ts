import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";
import { buildServer } from "./http/server";
import { registerRoutes } from "./http/routes";
import { DealRegistryRepo } from "../event-ledger/repo/DealRegistryRepo";
import { runMaterializerLoop } from "./materializers/runMaterializer";

dotenv.config({
  path: path.resolve(process.cwd(), "services/query-api/.env")
});

async function main() {
  const PORT = Number(process.env.PORT ?? process.env.QUERY_API_PORT ?? 3002);
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const registry = new DealRegistryRepo(pool);

  const app = await buildServer();

  app.get("/health", async () => {
    return { status: "ok" };
  });

  runMaterializerLoop(pool).catch((e) => {
    console.error("Materializer crashed", e);
    process.exit(1);
  });

  await registerRoutes(app, { pool, registry });

  app.printRoutes();

  const address = await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Query API listening at ${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});