import { randomUUID } from "node:crypto";
import { Pool } from "pg";

export type SupplierDocumentDeclarationType =
  | "CONFIRMED_AS_EXTRACTED"
  | "CORRECTION_SUBMITTED";

export type SupplierDocumentDeclarationField = {
  field_id: string;
  label: string;
  extracted_value: string | null;
  declared_value: string | null;
  confidence: number | null;
};

export type SupplierDocumentDeclarationRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  source_file_id: string;
  extraction_id: string;
  declaration_type: SupplierDocumentDeclarationType;
  declared_fields: SupplierDocumentDeclarationField[];
  correction_reason: string | null;
  submitted_by: string;
  created_at: string;
};

export class SupplierDocumentDeclarationRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    supplier_id: string;
    tenant_id: string;
    source_file_id: string;
    extraction_id: string;
    declaration_type: SupplierDocumentDeclarationType;
    declared_fields: SupplierDocumentDeclarationField[];
    correction_reason?: string | null;
    submitted_by: string;
  }): Promise<SupplierDocumentDeclarationRecord> {
    const id = randomUUID();

    const result =
      await this.pool.query<SupplierDocumentDeclarationRecord>(
        `
        INSERT INTO request_system.supplier_document_declarations (
          id,
          supplier_id,
          tenant_id,
          source_file_id,
          extraction_id,
          declaration_type,
          declared_fields,
          correction_reason,
          submitted_by,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::jsonb,
          $8,
          $9,
          NOW()
        )
        RETURNING
          id,
          supplier_id,
          tenant_id,
          source_file_id,
          extraction_id,
          declaration_type,
          declared_fields,
          correction_reason,
          submitted_by,
          created_at
        `,
        [
          id,
          input.supplier_id,
          input.tenant_id,
          input.source_file_id,
          input.extraction_id,
          input.declaration_type,
          JSON.stringify(input.declared_fields),
          input.correction_reason?.trim() || null,
          input.submitted_by
        ]
      );

    return result.rows[0];
  }

  async listBySupplier(
    supplierId: string,
    tenantId: string
  ): Promise<SupplierDocumentDeclarationRecord[]> {
    const result =
      await this.pool.query<SupplierDocumentDeclarationRecord>(
        `
        SELECT
          id,
          supplier_id,
          tenant_id,
          source_file_id,
          extraction_id,
          declaration_type,
          declared_fields,
          correction_reason,
          submitted_by,
          created_at
        FROM request_system.supplier_document_declarations
        WHERE supplier_id = $1
          AND tenant_id = $2
        ORDER BY created_at DESC
        `,
        [supplierId, tenantId]
      );

    return result.rows;
  }

  async getLatestByFile(input: {
    supplier_id: string;
    tenant_id: string;
    source_file_id: string;
  }): Promise<SupplierDocumentDeclarationRecord | null> {
    const result =
      await this.pool.query<SupplierDocumentDeclarationRecord>(
        `
        SELECT
          id,
          supplier_id,
          tenant_id,
          source_file_id,
          extraction_id,
          declaration_type,
          declared_fields,
          correction_reason,
          submitted_by,
          created_at
        FROM request_system.supplier_document_declarations
        WHERE supplier_id = $1
          AND tenant_id = $2
          AND source_file_id = $3
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [
          input.supplier_id,
          input.tenant_id,
          input.source_file_id
        ]
      );

    return result.rows[0] ?? null;
  }
}