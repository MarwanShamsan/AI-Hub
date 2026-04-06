import { FastifyInstance } from "fastify";
import { commandsRoute } from "./commands.route";
import { dealsRoute } from "./deals.route";
import { EventStore } from "../../event-ledger/repo/EventStore";
import { Catalog, AuthorityMatrix } from "../../../ai-core/events/types";
import { DealRegistryRepo } from "../../event-ledger/repo/DealRegistryRepo";

type Deps = {
  catalog: Catalog;
  matrix: AuthorityMatrix;
  eventStore: EventStore;
  dealRegistry: DealRegistryRepo;
};

export async function registerRoutes(app: FastifyInstance, deps: Deps) {
  app.register(commandsRoute, {
    prefix: "/commands",
    ...deps
  });

  app.register(dealsRoute, {
    prefix: "/deals",
    ...deps
  });
}