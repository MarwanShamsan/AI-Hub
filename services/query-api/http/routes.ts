import { FastifyInstance } from "fastify";
import { Pool } from "pg";
import { DealRegistryRepo } from "../../event-ledger/repo/DealRegistryRepo";
import { dealsRoute } from "./deals.route";

export async function registerRoutes(
  app: FastifyInstance,
  deps: { pool: Pool; registry: DealRegistryRepo }
) {
  app.register(dealsRoute, deps);
}
