import { randomUUID } from "node:crypto";
import { Pool } from "pg";

export type RequestExtractionSourceType =
  | "PDF_TEXT"
  | "PDF_OCR"
  | "IMAGE_OCR"
  | "MANUAL_MERGE";

export type RequestExtractionReviewStatus =
  | "PENDING_REVIEW"
  | "CONFIRMED"
  | "REJECTED"
  | "SUPERSEDED";

export type RequestExtractionRecord = {
  id: string;
  request_id: string;
  tenant_id: string;
  source_file_id: string | null;
  source_type: RequestExtractionSourceType;
  extracted_text: string | null;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, unknown>;
  missing_fields: unknown[];
  warnings: unknown[];
  review_status: RequestExtractionReviewStatus;
  created_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export class RequestExtractionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    request_id: string;
    tenant_id: string;
    source_file_id: string | null;
    source_type: RequestExtractionSourceType;
    extracted_text: string | null;
    extracted_payload: Record<string, unknown>;
    confidence_payload?: Record<string, unknown>;
    missing_fields?: unknown[];
    warnings?: unknown[];
    created_by: string;
  }): Promise<RequestExtractionRecord> {
    const id = randomUUID();

    const result = await this.pool.query<RequestExtractionRecord>(
      `
      INSERT INTO request_system.request_extractions (
        id,
        request_id,
        tenant_id,
        source_file_id,
        source_type,
        extracted_text,
        extracted_payload,
        confidence_payload,
        missing_fields,
        warnings,
        review_status,
        created_by,
        confirmed_by,
        confirmed_at,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7::jsonb,
        $8::jsonb,
        $9::jsonb,
        $10::jsonb,
        'PENDING_REVIEW',
        $11,
        NULL,
        NULL,
        NOW()
      )
      RETURNING
        id,
        request_id,
        tenant_id,
        source_file_id,
        source_type,
        extracted_text,
        extracted_payload,
        confidence_payload,
        missing_fields,
        warnings,
        review_status,
        created_by,
        confirmed_by,
        confirmed_at,
        created_at
      `,
      [
        id,
        input.request_id,
        input.tenant_id,
        input.source_file_id,
        input.source_type,
        input.extracted_text,
        JSON.stringify(input.extracted_payload),
        JSON.stringify(input.confidence_payload ?? {}),
        JSON.stringify(input.missing_fields ?? []),
        JSON.stringify(input.warnings ?? []),
        input.created_by
      ]
    );

    return result.rows[0];
  }

  async listByRequest(
    request_id: string,
    tenant_id: string
  ): Promise<RequestExtractionRecord[]> {
    const result = await this.pool.query<RequestExtractionRecord>(
      `
      SELECT
        id,
        request_id,
        tenant_id,
        source_file_id,
        source_type,
        extracted_text,
        extracted_payload,
        confidence_payload,
        missing_fields,
        warnings,
        review_status,
        created_by,
        confirmed_by,
        confirmed_at,
        created_at
      FROM request_system.request_extractions
      WHERE request_id = $1
        AND tenant_id = $2
      ORDER BY created_at DESC
      `,
      [request_id, tenant_id]
    );

    return result.rows;
  }

  async getLatestByRequest(
    request_id: string,
    tenant_id: string
  ): Promise<RequestExtractionRecord | null> {
    const result = await this.pool.query<RequestExtractionRecord>(
      `
      SELECT
        id,
        request_id,
        tenant_id,
        source_file_id,
        source_type,
        extracted_text,
        extracted_payload,
        confidence_payload,
        missing_fields,
        warnings,
        review_status,
        created_by,
        confirmed_by,
        confirmed_at,
        created_at
      FROM request_system.request_extractions
      WHERE request_id = $1
        AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [request_id, tenant_id]
    );

    return result.rows[0] ?? null;
  }

  async markConfirmed(
    extraction_id: string,
    tenant_id: string,
    confirmed_by: string
  ): Promise<RequestExtractionRecord | null> {
    const result = await this.pool.query<RequestExtractionRecord>(
      `
      UPDATE request_system.request_extractions
      SET
        review_status = 'CONFIRMED',
        confirmed_by = $3,
        confirmed_at = NOW()
      WHERE id = $1
        AND tenant_id = $2
      RETURNING
        id,
        request_id,
        tenant_id,
        source_file_id,
        source_type,
        extracted_text,
        extracted_payload,
        confidence_payload,
        missing_fields,
        warnings,
        review_status,
        created_by,
        confirmed_by,
        confirmed_at,
        created_at
      `,
      [extraction_id, tenant_id, confirmed_by]
    );

    return result.rows[0] ?? null;
  }

  async markSupersededByRequest(
    request_id: string,
    tenant_id: string
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE request_system.request_extractions
      SET review_status = 'SUPERSEDED'
      WHERE request_id = $1
        AND tenant_id = $2
        AND review_status = 'PENDING_REVIEW'
      `,
      [request_id, tenant_id]
    );
  }
}