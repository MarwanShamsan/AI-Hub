import { FastifyInstance } from "fastify";
import { extractIdentity } from "../authz/identity";
import { SupplierRepository } from "../repositories/supplier.repository";

type Deps = {
  supplierRepo: SupplierRepository;
};

async function requireInternalReviewIdentity(request: any, reply: any) {
  try {
    const identity = await extractIdentity(request);

    if (!identity.tenant_id) {
      reply.status(401).send({
        status: "REJECTED",
        reason: "TENANT_ID_MISSING"
      });
      return null;
    }

    if (identity.actor_type !== "USER") {
      reply.status(403).send({
        status: "REJECTED",
        reason: "ADMIN_ROUTE_REQUIRES_USER"
      });
      return null;
    }

    if (identity.role === "supplier") {
      reply.status(403).send({
        status: "REJECTED",
        reason: "INTERNAL_REVIEW_ROLE_REQUIRED"
      });
      return null;
    }

    return identity;
  } catch (error: any) {
    reply.status(401).send({
      status: "REJECTED",
      reason: "UNAUTHORIZED",
      message: error?.message ?? "UNKNOWN_AUTH_ERROR"
    });
    return null;
  }
}

export async function adminSuppliersRoute(
  app: FastifyInstance,
  opts: Deps
) {
  app.get("/suppliers", async (request, reply) => {
    const identity = await requireInternalReviewIdentity(
      request,
      reply
    );

    if (!identity) {
      return;
    }

    try {
      const suppliers =
        await opts.supplierRepo.listForAdmin();

      return reply.status(200).send({
        status: "ACCEPTED",
        count: suppliers.length,
        suppliers
      });
    } catch (error) {
      request.log.error(
        error,
        "admin supplier list failed"
      );

      return reply.status(500).send({
        status: "REJECTED",
        reason: "REQUEST_FAILED"
      });
    }
  });
}