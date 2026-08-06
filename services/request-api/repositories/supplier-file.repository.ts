import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

export type SupplierDocumentType =
  | "LEGAL_REGISTRATION"
  | "TRADE_LICENSE"
  | "TAX_REGISTRATION"
  | "MANUFACTURING_LICENSE"
  | "EXPORT_LICENSE"
  | "DISTRIBUTION_AUTHORIZATION"
  | "QUALITY_CERTIFICATE"
  | "FACTORY_PROFILE"
  | "OTHER";

export type SupplierDeclaredPayload =
  Record<string, unknown>;

export type SupplierFileRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  document_type: SupplierDocumentType | null;

  declared_document_number: string | null;
  declared_expiry_date: string | null;
  declared_payload: SupplierDeclaredPayload;
  notes: string | null;

  /*
   * Nullable only because legacy rows may exist
   * without an evidence hash.
   *
   * Every new official upload must provide one.
   */
  file_sha256: string | null;
  issuing_country: string | null;
  supersedes_file_id: string | null;

  created_at: string;
};

export type SupplierFileWithDataRecord =
  SupplierFileRecord & {
    file_data: Buffer;
  };

export class SupplierFileRepository {
  constructor(
    private readonly pool: Pool
  ) {}

  async create(input: {
    supplier_id: string;
    tenant_id: string;
    uploaded_by: string;

    file_name: string;
    content_type: string;
    file_size_bytes: number;
    file_data: Buffer;

    document_type:
      | SupplierDocumentType
      | null;

    declared_document_number?:
      | string
      | null;

    declared_expiry_date?:
      | string
      | null;

    declared_payload?:
      Record<string, unknown>;

    notes?:
      | string
      | null;

    file_sha256: string;

    issuing_country?:
      | string
      | null;

    supersedes_file_id?:
      | string
      | null;
  }): Promise<SupplierFileRecord> {
    const normalizedHash =
      input.file_sha256
        .trim()
        .toLowerCase();

    if (
      !/^[a-f0-9]{64}$/.test(
        normalizedHash
      )
    ) {
      throw new Error(
        "INVALID_SUPPLIER_FILE_SHA256"
      );
    }

    const id = randomUUID();

    const result =
      await this.pool.query<SupplierFileRecord>(
        `
        INSERT INTO request_system.supplier_files (
          id,
          supplier_id,
          tenant_id,
          uploaded_by,
          file_name,
          content_type,
          file_size_bytes,
          file_data,
          document_type,
          declared_document_number,
          declared_expiry_date,
          declared_payload,
          notes,
          file_sha256,
          issuing_country,
          supersedes_file_id,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12::jsonb,
          $13,
          $14,
          $15,
          $16,
          NOW()
        )
        RETURNING
          id,
          supplier_id,
          tenant_id,
          uploaded_by,
          file_name,
          content_type,
          file_size_bytes,
          document_type,
          declared_document_number,
          declared_expiry_date,
          declared_payload,
          notes,
          file_sha256,
          issuing_country,
          supersedes_file_id,
          created_at
        `,
        [
          id,
          input.supplier_id,
          input.tenant_id,
          input.uploaded_by,
          input.file_name,
          input.content_type,
          input.file_size_bytes,
          input.file_data,
          input.document_type,
          input.declared_document_number ??
            null,
          input.declared_expiry_date ??
            null,
          JSON.stringify(
            input.declared_payload ?? {}
          ),
          input.notes ?? null,
          normalizedHash,
          input.issuing_country ?? null,
          input.supersedes_file_id ??
            null
        ]
      );

    const record = result.rows[0];

    if (!record) {
      throw new Error(
        "SUPPLIER_FILE_INSERT_FAILED"
      );
    }

    if (
      record.file_sha256 !==
      normalizedHash
    ) {
      throw new Error(
        "SUPPLIER_FILE_HASH_PERSISTENCE_FAILED"
      );
    }

    return record;
  }

  async listBySupplier(
    supplier_id: string,
    tenant_id: string
  ): Promise<SupplierFileRecord[]> {
    const result =
      await this.pool.query<SupplierFileRecord>(
        `
        SELECT
          id,
          supplier_id,
          tenant_id,
          uploaded_by,
          file_name,
          content_type,
          file_size_bytes,
          document_type,
          declared_document_number,
          declared_expiry_date,
          declared_payload,
          notes,
          file_sha256,
          issuing_country,
          supersedes_file_id,
          created_at
        FROM request_system.supplier_files
        WHERE supplier_id = $1
          AND tenant_id = $2
        ORDER BY created_at DESC
        `,
        [
          supplier_id,
          tenant_id
        ]
      );

    return result.rows;
  }

  async getByIdWithData(
    file_id: string,
    tenant_id: string
  ): Promise<
    SupplierFileWithDataRecord | null
  > {
    const result =
      await this.pool.query<SupplierFileWithDataRecord>(
        `
        SELECT
          id,
          supplier_id,
          tenant_id,
          uploaded_by,
          file_name,
          content_type,
          file_size_bytes,
          file_data,
          document_type,
          declared_document_number,
          declared_expiry_date,
          declared_payload,
          notes,
          file_sha256,
          issuing_country,
          supersedes_file_id,
          created_at
        FROM request_system.supplier_files
        WHERE id = $1
          AND tenant_id = $2
        LIMIT 1
        `,
        [
          file_id,
          tenant_id
        ]
      );

    return result.rows[0] ?? null;
  }
}