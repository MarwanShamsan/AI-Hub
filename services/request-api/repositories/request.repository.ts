import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type {
  CreateRequestPayload,
  RequestRecord,
  UpdateRequestPayload
} from "../types/request.types";

export class RequestRepository {
  constructor(private readonly pool: Pool) {}

  async create(payload: CreateRequestPayload): Promise<RequestRecord> {
    const request_id = randomUUID();

    const result = await this.pool.query<RequestRecord>(
      `
      INSERT INTO request_system.requests (
        request_id,
        tenant_id,
        created_by,
        status,
        raw_input,
        normalized_input,
        confirmed_input,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW(), NOW()
      )
      RETURNING
        request_id,
        tenant_id,
        created_by,
        status,
        raw_input,
        normalized_input,
        confirmed_input,
        created_at,
        updated_at
      `,
      [
        request_id,
        payload.tenant_id,
        payload.created_by,
        "DRAFT",
        JSON.stringify(payload.raw_input),
        JSON.stringify(payload.normalized_input ?? payload.raw_input),
        JSON.stringify(payload.confirmed_input ?? payload.raw_input)
      ]
    );

    return result.rows[0];
  }

  async getById(
    request_id: string,
    tenant_id: string
  ): Promise<RequestRecord | null> {
    const result = await this.pool.query<RequestRecord>(
      `
      SELECT
        request_id,
        tenant_id,
        created_by,
        status,
        raw_input,
        normalized_input,
        confirmed_input,
        created_at,
        updated_at
      FROM request_system.requests
      WHERE request_id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
      [request_id, tenant_id]
    );

    return result.rows[0] ?? null;
  }

  async listByTenant(tenant_id: string): Promise<RequestRecord[]> {
    const result = await this.pool.query<RequestRecord>(
      `
      SELECT
        request_id,
        tenant_id,
        created_by,
        status,
        raw_input,
        normalized_input,
        confirmed_input,
        created_at,
        updated_at
      FROM request_system.requests
      WHERE tenant_id = $1
      ORDER BY updated_at DESC
      LIMIT 100
      `,
      [tenant_id]
    );

    return result.rows;
  }

  async update(
    request_id: string,
    tenant_id: string,
    payload: UpdateRequestPayload
  ): Promise<RequestRecord | null> {
    const result = await this.pool.query<RequestRecord>(
      `
      UPDATE request_system.requests
      SET
        raw_input = $3::jsonb,
        normalized_input = $4::jsonb,
        confirmed_input = $5::jsonb,
        updated_at = NOW()
      WHERE request_id = $1
        AND tenant_id = $2
      RETURNING
        request_id,
        tenant_id,
        created_by,
        status,
        raw_input,
        normalized_input,
        confirmed_input,
        created_at,
        updated_at
      `,
      [
        request_id,
        tenant_id,
        JSON.stringify(payload.raw_input),
        JSON.stringify(payload.normalized_input ?? payload.raw_input),
        JSON.stringify(payload.confirmed_input ?? payload.raw_input)
      ]
    );

    return result.rows[0] ?? null;
  }
}