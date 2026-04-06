import { Pool } from "pg";

export type DealRegistryEntry = {
  deal_id: string;
  tenant_id: string;
  created_by: string;
  created_at: string;
  request_id: string | null;
};

export class DealRegistryRepo {
  constructor(private pool: Pool) {}

  /**
   * Get registry entry by deal_id
   */
  async get(dealId: string): Promise<DealRegistryEntry | null> {
    const res = await this.pool.query(
      `
      SELECT deal_id, tenant_id, created_by, created_at, request_id
      FROM deal_registry
      WHERE deal_id = $1
      `,
      [dealId]
    );

    if (res.rowCount === 0) return null;

    const r = res.rows[0];
    return {
      deal_id: r.deal_id,
      tenant_id: r.tenant_id,
      created_by: r.created_by,
      created_at: new Date(r.created_at).toISOString(),
      request_id: r.request_id ?? null
    };
  }

  /**
   * Get registry entry by request_id
   */
  async getByRequestId(requestId: string): Promise<DealRegistryEntry | null> {
    const res = await this.pool.query(
      `
      SELECT deal_id, tenant_id, created_by, created_at, request_id
      FROM deal_registry
      WHERE request_id = $1
      `,
      [requestId]
    );

    if (res.rowCount === 0) return null;

    const r = res.rows[0];
    return {
      deal_id: r.deal_id,
      tenant_id: r.tenant_id,
      created_by: r.created_by,
      created_at: new Date(r.created_at).toISOString(),
      request_id: r.request_id ?? null
    };
  }

  /**
   * Create deal registry entry (idempotent)
   * This is NOT source of truth.
   * Safe to call before first event append.
   */
  async createIfAbsent(
    dealId: string,
    tenantId: string,
    createdBy: string,
    requestId?: string | null
  ): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO deal_registry (deal_id, tenant_id, created_by, request_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (deal_id) DO NOTHING
      `,
      [dealId, tenantId, createdBy, requestId ?? null]
    );
  }

  /**
   * Strict tenant isolation check
   */
  async assertTenantAccess(
    dealId: string,
    tenantId: string
  ): Promise<void> {
    const res = await this.pool.query(
      `
      SELECT tenant_id
      FROM deal_registry
      WHERE deal_id = $1
      `,
      [dealId]
    );

    if (res.rowCount === 0) {
      throw new Error("DEAL_NOT_REGISTERED");
    }

    if (res.rows[0].tenant_id !== tenantId) {
      throw new Error("TENANT_ACCESS_DENIED");
    }
  }

  /**
   * Ensure deal exists (utility helper)
   */
  async ensureExists(dealId: string): Promise<void> {
    const entry = await this.get(dealId);
    if (!entry) {
      throw new Error("DEAL_NOT_REGISTERED");
    }
  }
}