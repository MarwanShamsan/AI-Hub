import { randomUUID } from "node:crypto";
import { Pool } from "pg";

export type RequestFileRecord = {
  id: string;
  request_id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  created_at: string;
};

export type RequestFileBlobRecord = RequestFileRecord & {
  file_data: Buffer;
};

export class RequestFileRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    request_id: string;
    tenant_id: string;
    uploaded_by: string;
    file_name: string;
    content_type: string;
    file_size_bytes: number;
    file_data: Buffer;
  }): Promise<RequestFileRecord> {
    const id = randomUUID();

    const result = await this.pool.query<RequestFileRecord>(
      `
      INSERT INTO request_system.request_files (
        id,
        request_id,
        tenant_id,
        uploaded_by,
        file_name,
        content_type,
        file_size_bytes,
        file_data,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING
        id,
        request_id,
        tenant_id,
        uploaded_by,
        file_name,
        content_type,
        file_size_bytes,
        created_at
      `,
      [
        id,
        input.request_id,
        input.tenant_id,
        input.uploaded_by,
        input.file_name,
        input.content_type,
        input.file_size_bytes,
        input.file_data
      ]
    );

    return result.rows[0];
  }

  async listByRequest(
    request_id: string,
    tenant_id: string
  ): Promise<RequestFileRecord[]> {
    const result = await this.pool.query<RequestFileRecord>(
      `
      SELECT
        id,
        request_id,
        tenant_id,
        uploaded_by,
        file_name,
        content_type,
        file_size_bytes,
        created_at
      FROM request_system.request_files
      WHERE request_id = $1
        AND tenant_id = $2
      ORDER BY created_at DESC
      `,
      [request_id, tenant_id]
    );

    return result.rows;
  }

  async getByIdWithData(
    id: string,
    tenant_id: string
  ): Promise<RequestFileBlobRecord | null> {
    const result = await this.pool.query<RequestFileBlobRecord>(
      `
      SELECT
        id,
        request_id,
        tenant_id,
        uploaded_by,
        file_name,
        content_type,
        file_size_bytes,
        file_data,
        created_at
      FROM request_system.request_files
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
      [id, tenant_id]
    );

    return result.rows[0] ?? null;
  }
}