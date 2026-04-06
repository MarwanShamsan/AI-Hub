import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { extractIdentity } from "../authz/identity";
import { EventStore } from "../../event-ledger/repo/EventStore";
import { DealRegistryRepo } from "../../event-ledger/repo/DealRegistryRepo";
import { validateCommand } from "../../../ai-core/policy/validate";
import type { Catalog, AuthorityMatrix } from "../../../ai-core/events/types";
import { createDealFromRequestSchema } from "../validators/create-deal-from-request.schema";

type Deps = {
  eventStore: EventStore;
  dealRegistry: DealRegistryRepo;
  catalog: Catalog;
  matrix: AuthorityMatrix;
};

export async function dealsRoute(app: FastifyInstance, opts: Deps) {
  /**
   * POST /deals/from-request
   * The ONLY lawful bridge from Request System -> Sovereign Deal System
   */
  app.post("/from-request", async (request, reply) => {
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

    const parsed = createDealFromRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: "INVALID_REQUEST_PAYLOAD",
        message: parsed.error.issues.map((i) => i.message).join("; ")
      });
    }

    const request_id = parsed.data.request_id.trim();
    const buyer_id = parsed.data.buyer_id.trim();
    const supplier_id = parsed.data.supplier_id.trim();
    const deal_title = parsed.data.deal_title.trim();
    const currency = parsed.data.currency.trim();

    // Prevent duplicate sovereign handoff for the same request
    const existingByRequest = await opts.dealRegistry.getByRequestId(request_id);

    if (existingByRequest) {
      return reply.status(409).send({
        status: "REJECTED",
        reason: "REQUEST_ALREADY_LINKED",
        message: "This request_id is already linked to a sovereign deal",
        deal_id: existingByRequest.deal_id
      });
    }

    const dealId = randomUUID();

    const command = {
      deal_id: dealId,
      event_type: "DEAL_CREATED" as const,
      actor: {
        actor_type: identity.actor_type,
        actor_id: identity.actor_id,
        agent_id: identity.agent_id ?? null,
        tenant_id: identity.tenant_id
      },
      payload: {
        deal_title,
        buyer_id,
        supplier_id,
        currency
      }
    };

    const validation = validateCommand(
      opts.catalog,
      opts.matrix,
      command,
      []
    );

    if (validation) {
      return reply.status(403).send({
        status: "REJECTED",
        reason: validation.code,
        message: validation.message
      });
    }

    await opts.dealRegistry.createIfAbsent(
      dealId,
      identity.tenant_id,
      identity.actor_id,
      request_id
    );

    await opts.eventStore.append(command);

    return reply.status(201).send({
      status: "ACCEPTED",
      deal_id: dealId,
      request_id
    });
  });

  /**
   * GET /deals/:dealId/events
   */
  app.get("/:dealId/events", async (request, reply) => {
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

    const { dealId } = request.params as { dealId?: string };

    if (!dealId) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: "INVALID_DEAL_ID"
      });
    }

    try {
      await opts.dealRegistry.assertTenantAccess(dealId, identity.tenant_id);
    } catch (e: any) {
      return reply.status(403).send({
        status: "REJECTED",
        reason: e.message
      });
    }

    const events = await opts.eventStore.loadDealEvents(dealId);

    return reply.status(200).send({
      status: "ACCEPTED",
      deal_id: dealId,
      events
    });
  });
}