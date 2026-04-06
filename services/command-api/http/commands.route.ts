import { FastifyInstance } from "fastify";
import { extractIdentity } from "../authz/identity";
import { commandBodySchema } from "../validators/command.schema";
import { validateCommand } from "../../../ai-core/policy/validate";
import { Catalog, AuthorityMatrix, NewCommand } from "../../../ai-core/events/types";
import { EventStore } from "../../event-ledger/repo/EventStore";
import { DealRegistryRepo } from "../../event-ledger/repo/DealRegistryRepo";
import { nowUtcIso } from "../../../shared/time/utc";

type Deps = {
  catalog: Catalog;
  matrix: AuthorityMatrix;
  eventStore: EventStore;
  dealRegistry: DealRegistryRepo;
};

export async function commandsRoute(app: FastifyInstance, opts: Deps) {
  app.post("/", async (request, reply) => {
    // 1) identity
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

    // 2) validate request body shape
    const parsed = commandBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: "INVALID_COMMAND_SHAPE",
        message: parsed.error.issues.map(i => i.message).join("; ")
      });
    }

    const { deal_id, event_type, payload } = parsed.data;

    // 🚫 HARD BLOCK: DEAL_CREATED is forbidden on generic /commands endpoint
    if (event_type === "DEAL_CREATED") {
      return reply.status(403).send({
        status: "REJECTED",
        reason: "DEAL_CREATED_FORBIDDEN",
        message: "Use POST /deals/from-request"
      });
    }

    // 3) load history from ledger (source of truth)
    const history = await opts.eventStore.loadDealEvents(deal_id);

    // 3.5) Deal registry enforcement
    const existing = await opts.dealRegistry.get(deal_id);

    if (!existing) {
      return reply.status(404).send({
        status: "REJECTED",
        reason: "DEAL_NOT_FOUND",
        message: "Deal does not exist"
      });
    }

    if (existing.tenant_id !== identity.tenant_id) {
      return reply.status(403).send({
        status: "REJECTED",
        reason: "TENANT_ACCESS_DENIED"
      });
    }

    // 4) build internal command
    const cmd: NewCommand = {
      deal_id,
      event_type,
      payload,
      actor: {
        actor_type: identity.actor_type,
        actor_id: identity.actor_id,
        agent_id: identity.agent_id ?? null,
        tenant_id: identity.tenant_id
      }
    };

    // 5) policy check (pure)
    const reject = validateCommand(opts.catalog, opts.matrix, cmd, history);
    if (reject) {
      // Dispute path (explainable, append-only):
      // If a user attempts DISPUTE_OPENED but policy rejects it due to:
      // - missing evidence, or
      // - opening after TIMER_EXPIRED (time law),
      // we deterministically record DISPUTE_REJECTED (SYSTEM) instead of writing an invalid DISPUTE_OPENED.
      if (event_type === "DISPUTE_OPENED") {
        let reason_code: "MISSING_EVIDENCE_BUNDLE" | "LATE_AFTER_TIMER_EXPIRED" | null = null;

        if (reject.code === "MISSING_EVIDENCE") reason_code = "MISSING_EVIDENCE_BUNDLE";
        if (reject.code === "DISPUTE_AFTER_EXPIRY") reason_code = "LATE_AFTER_TIMER_EXPIRED";

        if (reason_code) {
          const sysCmd: NewCommand = {
            deal_id,
            event_type: "DISPUTE_REJECTED",
            payload: {
              reason_code,
              reason_message: reject.message,
              rejected_at: nowUtcIso(),
              details: {
                rejected_policy_code: reject.code
              }
            },
            actor: {
              actor_type: "SYSTEM",
              actor_id: "system:dispute_gate",
              agent_id: null,
              tenant_id: identity.tenant_id
            }
          };

          // Validate the derived SYSTEM event against catalog + authority matrix
          const sysReject = validateCommand(opts.catalog, opts.matrix, sysCmd, history);
          if (sysReject) {
            return reply.status(403).send({
              status: "REJECTED",
              reason: sysReject.code,
              message: sysReject.message
            });
          }

          const stored = await opts.eventStore.append(sysCmd);
          return reply.status(201).send({
            status: "REJECTED_RECORDED",
            rejected: { reason: reject.code, message: reject.message },
            event: stored
          });
        }
      }

      return reply.status(403).send({
        status: "REJECTED",
        reason: reject.code,
        message: reject.message
      });
    }

    // 6) append immutable event
    const stored = await opts.eventStore.append(cmd);

    return reply.status(201).send({
      status: "ACCEPTED",
      event: stored
    });
  });
}