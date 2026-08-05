import { randomUUID } from "node:crypto";
import { Pool } from "pg";

export type SupplierExtractionSourceType =
  | "PDF_TEXT"
  | "PDF_OCR"
  | "IMAGE_OCR"
  | "MANUAL_MERGE"
  | "OCR_SCANNED_PDF"
  | "UNREADABLE_PDF";

export type SupplierExtractionReviewStatus =
  | "PENDING_REVIEW"
  | "CONFIRMED"
  | "REJECTED"
  | "SUPERSEDED";

export type SupplierExtractionRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  source_file_id: string | null;
  source_type: SupplierExtractionSourceType;
  extracted_text: string | null;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, unknown>;
  missing_fields: unknown[];
  warnings: unknown[];
  review_status: SupplierExtractionReviewStatus;
  created_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export class SupplierExtractionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    supplier_id: string;
    tenant_id: string;
    source_file_id: string | null;
    source_type: SupplierExtractionSourceType;
    extracted_text: string | null;
    extracted_payload: Record<string, unknown>;
    confidence_payload?: Record<string, unknown>;
    missing_fields?: unknown[];
    warnings?: unknown[];
    created_by: string;
  }): Promise<SupplierExtractionRecord> {
    const id = randomUUID();

    const result = await this.pool.query<SupplierExtractionRecord>(
      `
      INSERT INTO request_system.supplier_extractions (
        id,
        supplier_id,
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
        supplier_id,
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
        input.supplier_id,
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

  async listBySupplier(
    supplier_id: string,
    tenant_id: string
  ): Promise<SupplierExtractionRecord[]> {
    const result = await this.pool.query<SupplierExtractionRecord>(
      `
      SELECT
        id,
        supplier_id,
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
      FROM request_system.supplier_extractions
      WHERE supplier_id = $1
        AND tenant_id = $2
      ORDER BY created_at DESC
      `,
      [supplier_id, tenant_id]
    );

    return result.rows;
  }

  async getLatestBySupplier(
    supplier_id: string,
    tenant_id: string
  ): Promise<SupplierExtractionRecord | null> {
    const result = await this.pool.query<SupplierExtractionRecord>(
      `
      SELECT
        id,
        supplier_id,
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
      FROM request_system.supplier_extractions
      WHERE supplier_id = $1
        AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [supplier_id, tenant_id]
    );

    return result.rows[0] ?? null;
  }

  async markSupersededBySupplier(
    supplier_id: string,
    tenant_id: string
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE request_system.supplier_extractions
      SET review_status = 'SUPERSEDED'
      WHERE supplier_id = $1
        AND tenant_id = $2
        AND review_status = 'PENDING_REVIEW'
      `,
      [supplier_id, tenant_id]
    );
  }
}