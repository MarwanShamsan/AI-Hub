import { FastifyInstance } from "fastify";
import { requestsRoute } from "./requests.route";
import { requestFilesRoute } from "./request-files.route";
import { requestExtractionsRoute } from "./request-extractions.route";
import { RequestRepository } from "../repositories/request.repository";
import { RequestFileRepository } from "../repositories/request-file.repository";
import { RequestExtractionRepository } from "../repositories/request-extraction.repository";

type Deps = {
  requestRepo: RequestRepository;
  requestFileRepo: RequestFileRepository;
  requestExtractionRepo: RequestExtractionRepository;
};

export async function registerRoutes(app: FastifyInstance, deps: Deps) {
  app.register(requestsRoute, {
    prefix: "/requests",
    requestRepo: deps.requestRepo
  });

  app.register(requestFilesRoute, {
    prefix: "/requests",
    requestRepo: deps.requestRepo,
    requestFileRepo: deps.requestFileRepo
  });

  app.register(requestExtractionsRoute, {
    prefix: "/requests",
    requestRepo: deps.requestRepo,
    requestFileRepo: deps.requestFileRepo,
    requestExtractionRepo: deps.requestExtractionRepo
  });
}