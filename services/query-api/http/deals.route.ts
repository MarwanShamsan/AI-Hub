import { FastifyInstance } from "fastify";
import { Pool } from "pg";
import { extractIdentity } from "../authz/identity";
import { DealRegistryRepo } from "../../event-ledger/repo/DealRegistryRepo";

type Deps = {
  pool: Pool;
  registry: DealRegistryRepo;
};

async function getIdentityOrReject(req: any, reply: any) {
  try {
    const identity = await extractIdentity(req);

    if (!identity.tenant_id) {
      reply.status(401).send({
        status: "REJECTED",
        reason: "TENANT_ID_MISSING",
        message: "Authenticated identity is missing tenant_id"
      });
      return null;
    }

    return identity;
  } catch (e: any) {
    reply.status(401).send({
      status: "REJECTED",
      reason: "UNAUTHORIZED",
      message: e.message
    });
    return null;
  }
}

export async function dealsRoute(app: FastifyInstance, deps: Deps) {
  /**
   * GET /deals/:dealId
   * Rich derived snapshot (projection)
   */
  app.get("/deals/:dealId", async (req, reply) => {
    const identity = await getIdentityOrReject(req, reply);
    if (!identity) return;

    const { dealId } = req.params as { dealId: string };

    try {
      await deps.registry.assertTenantAccess(dealId, identity.tenant_id);
    } catch (e: any) {
      return reply.status(403).send({
        status: "REJECTED",
        reason: e.message
      });
    }

    const res = await deps.pool.query(
      `
      SELECT
        deal_id,
        tenant_id,
        deal_title,
        buyer_id,
        supplier_id,
        currency,

        status,

        inspection_passed,
        shipment_verified,

        token_a_issued,
        token_b_issued,
        token_c_issued,

        dispute_open,
        deal_closed,

        timer_started,
        timer_expired,

        last_event_type,
        last_event_at,
        updated_at
      FROM views.deal_projection
      WHERE deal_id = $1
      `,
      [dealId]
    );

    if ((res.rowCount ?? 0) === 0) {
      return reply.status(404).send({
        status: "REJECTED",
        reason: "NOT_FOUND"
      });
    }

    return reply.send({
      status: "ACCEPTED",
      deal: res.rows[0]
    });
  });

  /**
   * GET /deals/:dealId/timer
   * Timer read model
   */
  app.get("/deals/:dealId/timer", async (req, reply) => {
    const identity = await getIdentityOrReject(req, reply);
    if (!identity) return;

    const { dealId } = req.params as { dealId: string };

    try {
      await deps.registry.assertTenantAccess(dealId, identity.tenant_id);
    } catch (e: any) {
      return reply.status(403).send({
        status: "REJECTED",
        reason: e.message
      });
    }

    const res = await deps.pool.query(
      `
      SELECT
        deal_id,
        tenant_id,
        started_at,
        expires_at,
        expired_at,
        state,
        updated_at
      FROM views.timer_index
      WHERE deal_id = $1
      `,
      [dealId]
    );

    if ((res.rowCount ?? 0) === 0) {
      return reply.status(404).send({
        status: "REJECTED",
        reason: "NOT_FOUND"
      });
    }

    return reply.send({
      status: "ACCEPTED",
      timer: res.rows[0]
    });
  });

  /**
   * GET /deals
   * List deals (projection)
   */
  app.get("/deals", async (req, reply) => {
    const identity = await getIdentityOrReject(req, reply);
    if (!identity) return;

    const { status } = req.query as { status?: string };

    const params: any[] = [identity.tenant_id];

    let sql = `
      SELECT
        deal_id,
        deal_title,
        buyer_id,
        supplier_id,
        currency,
        status,
        token_a_issued,
        token_b_issued,
        token_c_issued,
        dispute_open,
        deal_closed,
        timer_started,
        timer_expired,
        last_event_type,
        updated_at
      FROM views.deal_projection
      WHERE tenant_id = $1
    `;

    if (status) {
      params.push(status);
      sql += ` AND status = $2`;
    }

    sql += `
      ORDER BY updated_at DESC
      LIMIT 100
    `;

    const res = await deps.pool.query(sql, params);

    return reply.send({
      status: "ACCEPTED",
      count: res.rowCount ?? 0,
      deals: res.rows
    });
  });
}