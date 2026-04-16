import { FastifyInstance } from "fastify";
import { extractIdentity } from "../authz/identity";
import { RequestRepository } from "../repositories/request.repository";
import { createRequestSchema } from "../validators/create-request.schema";
import { updateRequestSchema } from "../validators/update-request.schema";

type Deps = {
  requestRepo: RequestRepository;
};

export async function requestsRoute(app: FastifyInstance, opts: Deps) {
  app.post("/", async (request, reply) => {
    let identity;
    try {
      identity = await extractIdentity(request);

      if (!identity.tenant_id) {
        return reply.status(401).send({
          status: "REJECTED",
          reason: "TENANT_ID_MISSING",
          message: "Authenticated identity is missing tenant_id"
        });
      }

      if (identity.actor_type !== "USER") {
        return reply.status(403).send({
          status: "REJECTED",
          reason: "REQUEST_CREATION_REQUIRES_USER"
        });
      }
    } catch (e: any) {
      return reply.status(401).send({
        status: "REJECTED",
        reason: "UNAUTHORIZED",
        message: e.message
      });
    }

    const parsed = createRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: "INVALID_REQUEST_PAYLOAD",
        message: parsed.error.issues.map((i) => i.message).join("; ")
      });
    }

    const record = await opts.requestRepo.create({
      tenant_id: identity.tenant_id,
      created_by: identity.actor_id,
      raw_input: parsed.data,
      normalized_input: parsed.data,
      confirmed_input: parsed.data
    });

    return reply.status(201).send({
      status: "ACCEPTED",
      request: record
    });
  });

  app.get("/", async (request, reply) => {
    let identity;
    try {
      identity = await extractIdentity(request);

      if (!identity.tenant_id) {
        return reply.status(401).send({
          status: "REJECTED",
          reason: "TENANT_ID_MISSING",
          message: "Authenticated identity is missing tenant_id"
        });
      }
    } catch (e: any) {
      return reply.status(401).send({
        status: "REJECTED",
        reason: "UNAUTHORIZED",
        message: e.message
      });
    }

    const requests = await opts.requestRepo.listByTenant(identity.tenant_id);

    return reply.status(200).send({
      status: "ACCEPTED",
      count: requests.length,
      requests
    });
  });

  app.get("/:requestId", async (request, reply) => {
    let identity;
    try {
      identity = await extractIdentity(request);

      if (!identity.tenant_id) {
        return reply.status(401).send({
          status: "REJECTED",
          reason: "TENANT_ID_MISSING",
          message: "Authenticated identity is missing tenant_id"
        });
      }
    } catch (e: any) {
      return reply.status(401).send({
        status: "REJECTED",
        reason: "UNAUTHORIZED",
        message: e.message
      });
    }

    const { requestId } = request.params as { requestId: string };
    const record = await opts.requestRepo.getById(requestId, identity.tenant_id);

    if (!record) {
      return reply.status(404).send({
        status: "REJECTED",
        reason: "NOT_FOUND"
      });
    }

    return reply.status(200).send({
      status: "ACCEPTED",
      request: record
    });
  });

  app.put("/:requestId", async (request, reply) => {
    let identity;
    try {
      identity = await extractIdentity(request);

      if (!identity.tenant_id) {
        return reply.status(401).send({
          status: "REJECTED",
          reason: "TENANT_ID_MISSING",
          message: "Authenticated identity is missing tenant_id"
        });
      }

      if (identity.actor_type !== "USER") {
        return reply.status(403).send({
          status: "REJECTED",
          reason: "REQUEST_UPDATE_REQUIRES_USER"
        });
      }
    } catch (e: any) {
      return reply.status(401).send({
        status: "REJECTED",
        reason: "UNAUTHORIZED",
        message: e.message
      });
    }

    const parsed = updateRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: "INVALID_REQUEST_PAYLOAD",
        message: parsed.error.issues.map((i) => i.message).join("; ")
      });
    }

    const { requestId } = request.params as { requestId: string };

    const record = await opts.requestRepo.update(requestId, identity.tenant_id, {
      raw_input: parsed.data,
      normalized_input: parsed.data,
      confirmed_input: parsed.data
    });

    if (!record) {
      return reply.status(404).send({
        status: "REJECTED",
        reason: "NOT_FOUND"
      });
    }

    return reply.status(200).send({
      status: "ACCEPTED",
      request: record
    });
  });
}