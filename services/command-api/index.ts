import dotenv from "dotenv";
import path from "node:path";
import { Pool } from "pg";

import { buildServer } from "./http/server";
import { registerRoutes } from "./http/routes";

import { loadAuthorityMatrix, loadCatalog } from "../config/loadPolicy";
import { EventStore } from "../event-ledger/repo/EventStore";
import { DealRegistryRepo } from "../event-ledger/repo/DealRegistryRepo";

dotenv.config({
  path: path.resolve(process.cwd(), "services/command-api/.env")
});

async function main() {
  const PORT = Number(process.env.PORT ?? process.env.COMMAND_API_PORT ?? 3001);
  const POLICY_DIR = process.env.POLICY_DIR ?? path.resolve(process.cwd(), "policy");
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const catalog = loadCatalog(POLICY_DIR);
  const matrix = loadAuthorityMatrix(POLICY_DIR);

  const pool = new Pool({ connectionString: DATABASE_URL });
  const eventStore = new EventStore(pool);
  const dealRegistry = new DealRegistryRepo(pool);

  const app = await buildServer();

  await registerRoutes(app, {
    catalog,
    matrix,
    eventStore,
    dealRegistry
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Command API listening on 0.0.0.0:${PORT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});