import dotenv from "dotenv";
import path from "node:path";
import { Pool } from "pg";

import { buildServer } from "./http/server";
import { registerRoutes } from "./http/routes";
import { RequestRepository } from "./repositories/request.repository";
import { RequestFileRepository } from "./repositories/request-file.repository";
import { RequestExtractionRepository } from "./repositories/request-extraction.repository";

dotenv.config({
  path: path.resolve(process.cwd(), "services/request-api/.env")
});

async function main() {
  const PORT = Number(process.env.PORT ?? process.env.REQUEST_API_PORT ?? 3003);
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const requestRepo = new RequestRepository(pool);
  const requestFileRepo = new RequestFileRepository(pool);
  const requestExtractionRepo = new RequestExtractionRepository(pool);

  const app = await buildServer();

  app.get("/health", async () => {
    return { status: "ok" };
  });

  await registerRoutes(app, {
    requestRepo,
    requestFileRepo,
    requestExtractionRepo
  });

  const address = await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Request API listening at ${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});