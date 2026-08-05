import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type {
  SupplierProfileInput,
  SupplierProfileRecord,
  SupplierQualificationDecisionStatus,
  SupplierQualificationReviewRecord,
  SupplierRecord,
  SupplierView
} from "../types/supplier.types";

export type AdminSupplierListItem = {
  supplier_id: string;
  tenant_id: string;
  owner_user_id: string;
  qualification_status: SupplierRecord["qualification_status"];
  last_decision_reason_code: string | null;
  last_decision_reason_text: string | null;
  supplier_created_at: string;
  supplier_updated_at: string;

  supplier_type: SupplierProfileRecord["supplier_type"] | null;
  legal_name: string | null;
  registration_number: string | null;
  registration_country: string | null;
  business_category: string | null;
  product_categories: string[];
  operational_contact_name: string | null;
  operational_contact_email: string | null;
  operational_contact_phone: string | null;
  declared_license_expiry_date: string | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;

  latest_review_id: string | null;
  latest_review_decision_status: SupplierQualificationReviewRecord["decision_status"] | null;
  latest_review_reason_code: string | null;
  latest_review_reason_text: string | null;
  latest_review_decided_at: string | null;

  uploaded_files_count: number;
};

export class SupplierRepository {
  constructor(private readonly pool: Pool) {}
   
  async getById(supplier_id: string): Promise<SupplierRecord | null> {
    const result = await this.pool.query<SupplierRecord>(
      `
      SELECT
        supplier_id,
        tenant_id,
        owner_user_id,
        qualification_status,
        last_decision_reason_code,
        last_decision_reason_text,
        created_at,
        updated_at
      FROM request_system.suppliers
      WHERE supplier_id = $1
      LIMIT 1
      `,
      [supplier_id]
    );

    return result.rows[0] ?? null;
  }
  async bootstrap(input: {
    tenant_id: string;
    owner_user_id: string;
  }): Promise<SupplierRecord> {
    const existing = await this.getByTenant(input.tenant_id);
    if (existing) return existing;

    const supplier_id = randomUUID();

    const result = await this.pool.query<SupplierRecord>(
      `
      INSERT INTO request_system.suppliers (
        supplier_id,
        tenant_id,
        owner_user_id,
        qualification_status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'DRAFT', NOW(), NOW())
      RETURNING
        supplier_id,
        tenant_id,
        owner_user_id,
        qualification_status,
        last_decision_reason_code,
        last_decision_reason_text,
        created_at,
        updated_at
      `,
      [supplier_id, input.tenant_id, input.owner_user_id]
    );

    await this.pool.query(
      `
      INSERT INTO request_system.supplier_profiles (
        supplier_id,
        tenant_id,
        product_categories,
        created_at,
        updated_at
      )
      VALUES ($1, $2, '[]'::jsonb, NOW(), NOW())
      ON CONFLICT (supplier_id) DO NOTHING
      `,
      [supplier_id, input.tenant_id]
    );

    return result.rows[0];
  }

  async getByTenant(tenant_id: string): Promise<SupplierRecord | null> {
    const result = await this.pool.query<SupplierRecord>(
      `
      SELECT
        supplier_id,
        tenant_id,
        owner_user_id,
        qualification_status,
        last_decision_reason_code,
        last_decision_reason_text,
        created_at,
        updated_at
      FROM request_system.suppliers
      WHERE tenant_id = $1
      LIMIT 1
      `,
      [tenant_id]
    );

    return result.rows[0] ?? null;
  }

  async getProfileByTenant(tenant_id: string): Promise<SupplierProfileRecord | null> {
    const result = await this.pool.query<SupplierProfileRecord>(
      `
      SELECT
        supplier_id,
        tenant_id,
        supplier_type,
        legal_name,
        registration_number,
        registration_country,
        business_category,
        product_categories,
        operational_contact_name,
        operational_contact_email,
        operational_contact_phone,
        declared_license_expiry_date::text,
        created_at,
        updated_at
      FROM request_system.supplier_profiles
      WHERE tenant_id = $1
      LIMIT 1
      `,
      [tenant_id]
    );

    return result.rows[0] ?? null;
  }

  async getViewByTenant(tenant_id: string): Promise<SupplierView | null> {
    const supplier = await this.getByTenant(tenant_id);
    if (!supplier) return null;

    const profile = await this.getProfileByTenant(tenant_id);
    return { supplier, profile };
  }

  async upsertProfile(
    supplier_id: string,
    tenant_id: string,
    payload: SupplierProfileInput
  ): Promise<SupplierProfileRecord> {
    const existing = await this.getProfileByTenant(tenant_id);

    const merged = {
      supplier_type: payload.supplier_type ?? existing?.supplier_type ?? null,
      legal_name: payload.legal_name ?? existing?.legal_name ?? null,
      registration_number: payload.registration_number ?? existing?.registration_number ?? null,
      registration_country: payload.registration_country ?? existing?.registration_country ?? null,
      business_category: payload.business_category ?? existing?.business_category ?? null,
      product_categories: payload.product_categories ?? existing?.product_categories ?? [],
      operational_contact_name:
        payload.operational_contact_name ?? existing?.operational_contact_name ?? null,
      operational_contact_email:
        payload.operational_contact_email ?? existing?.operational_contact_email ?? null,
      operational_contact_phone:
        payload.operational_contact_phone ?? existing?.operational_contact_phone ?? null,
      declared_license_expiry_date:
        payload.declared_license_expiry_date ?? existing?.declared_license_expiry_date ?? null
    };

    const result = await this.pool.query<SupplierProfileRecord>(
      `
      INSERT INTO request_system.supplier_profiles (
        supplier_id,
        tenant_id,
        supplier_type,
        legal_name,
        registration_number,
        registration_country,
        business_category,
        product_categories,
        operational_contact_name,
        operational_contact_email,
        operational_contact_phone,
        declared_license_expiry_date,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12::date, NOW(), NOW()
      )
      ON CONFLICT (supplier_id)
      DO UPDATE SET
        supplier_type = EXCLUDED.supplier_type,
        legal_name = EXCLUDED.legal_name,
        registration_number = EXCLUDED.registration_number,
        registration_country = EXCLUDED.registration_country,
        business_category = EXCLUDED.business_category,
        product_categories = EXCLUDED.product_categories,
        operational_contact_name = EXCLUDED.operational_contact_name,
        operational_contact_email = EXCLUDED.operational_contact_email,
        operational_contact_phone = EXCLUDED.operational_contact_phone,
        declared_license_expiry_date = EXCLUDED.declared_license_expiry_date,
        updated_at = NOW()
      RETURNING
        supplier_id,
        tenant_id,
        supplier_type,
        legal_name,
        registration_number,
        registration_country,
        business_category,
        product_categories,
        operational_contact_name,
        operational_contact_email,
        operational_contact_phone,
        declared_license_expiry_date::text,
        created_at,
        updated_at
      `,
      [
        supplier_id,
        tenant_id,
        merged.supplier_type,
        merged.legal_name,
        merged.registration_number,
        merged.registration_country,
        merged.business_category,
        JSON.stringify(merged.product_categories),
        merged.operational_contact_name,
        merged.operational_contact_email,
        merged.operational_contact_phone,
        merged.declared_license_expiry_date
      ]
    );

    return result.rows[0];
  }

  async updateQualificationStatus(
    supplier_id: string,
    tenant_id: string,
    status: SupplierRecord["qualification_status"],
    reasonCode?: string | null,
    reasonText?: string | null
  ): Promise<SupplierRecord | null> {
    const result = await this.pool.query<SupplierRecord>(
      `
      UPDATE request_system.suppliers
      SET
        qualification_status = $3,
        last_decision_reason_code = $4,
        last_decision_reason_text = $5,
        updated_at = NOW()
      WHERE supplier_id = $1
        AND tenant_id = $2
      RETURNING
        supplier_id,
        tenant_id,
        owner_user_id,
        qualification_status,
        last_decision_reason_code,
        last_decision_reason_text,
        created_at,
        updated_at
      `,
      [supplier_id, tenant_id, status, reasonCode ?? null, reasonText ?? null]
    );

    return result.rows[0] ?? null;
  }

  async createQualificationReview(input: {
    supplier_id: string;
    tenant_id: string;
    extraction_id: string | null;
    decision_status: SupplierQualificationDecisionStatus;
    reason_code: string;
    reason_text: string;
    blocking_issues?: unknown[];
    decided_by_type: "SYSTEM" | "USER";
    decided_by_id: string;
  }): Promise<SupplierQualificationReviewRecord> {
    const id = randomUUID();

    const result = await this.pool.query<SupplierQualificationReviewRecord>(
      `
      INSERT INTO request_system.supplier_qualification_reviews (
        id,
        supplier_id,
        tenant_id,
        extraction_id,
        decision_status,
        reason_code,
        reason_text,
        blocking_issues,
        decided_by_type,
        decided_by_id,
        decided_at,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, NOW(), NOW()
      )
      RETURNING
        id,
        supplier_id,
        tenant_id,
        extraction_id,
        decision_status,
        reason_code,
        reason_text,
        blocking_issues,
        decided_by_type,
        decided_by_id,
        decided_at,
        created_at
      `,
      [
        id,
        input.supplier_id,
        input.tenant_id,
        input.extraction_id,
        input.decision_status,
        input.reason_code,
        input.reason_text,
        JSON.stringify(input.blocking_issues ?? []),
        input.decided_by_type,
        input.decided_by_id
      ]
    );

    return result.rows[0];
  }

  async getLatestQualificationReview(
    supplier_id: string,
    tenant_id: string
  ): Promise<SupplierQualificationReviewRecord | null> {
    const result = await this.pool.query<SupplierQualificationReviewRecord>(
      `
      SELECT
        id,
        supplier_id,
        tenant_id,
        extraction_id,
        decision_status,
        reason_code,
        reason_text,
        blocking_issues,
        decided_by_type,
        decided_by_id,
        decided_at,
        created_at
      FROM request_system.supplier_qualification_reviews
      WHERE supplier_id = $1
        AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [supplier_id, tenant_id]
    );

    return result.rows[0] ?? null;
  }

  async listForAdmin(): Promise<AdminSupplierListItem[]> {
    const result = await this.pool.query<AdminSupplierListItem>(
      `
      WITH latest_reviews AS (
        SELECT DISTINCT ON (r.supplier_id)
          r.supplier_id,
          r.id AS latest_review_id,
          r.decision_status AS latest_review_decision_status,
          r.reason_code AS latest_review_reason_code,
          r.reason_text AS latest_review_reason_text,
          r.decided_at::text AS latest_review_decided_at
        FROM request_system.supplier_qualification_reviews r
        ORDER BY r.supplier_id, r.created_at DESC
      ),
      file_counts AS (
        SELECT
          f.supplier_id,
          COUNT(*)::int AS uploaded_files_count
        FROM request_system.supplier_files f
        GROUP BY f.supplier_id
      )
      SELECT
        s.supplier_id,
        s.tenant_id,
        s.owner_user_id,
        s.qualification_status,
        s.last_decision_reason_code,
        s.last_decision_reason_text,
        s.created_at::text AS supplier_created_at,
        s.updated_at::text AS supplier_updated_at,

        sp.supplier_type,
        sp.legal_name,
        sp.registration_number,
        sp.registration_country,
        sp.business_category,
        COALESCE(sp.product_categories, '[]'::jsonb) AS product_categories,
        sp.operational_contact_name,
        sp.operational_contact_email,
        sp.operational_contact_phone,
        sp.declared_license_expiry_date::text,
        sp.created_at::text AS profile_created_at,
        sp.updated_at::text AS profile_updated_at,

        lr.latest_review_id,
        lr.latest_review_decision_status,
        lr.latest_review_reason_code,
        lr.latest_review_reason_text,
        lr.latest_review_decided_at,

        COALESCE(fc.uploaded_files_count, 0) AS uploaded_files_count
      FROM request_system.suppliers s
      LEFT JOIN request_system.supplier_profiles sp
        ON sp.supplier_id = s.supplier_id
       AND sp.tenant_id = s.tenant_id
      LEFT JOIN latest_reviews lr
        ON lr.supplier_id = s.supplier_id
      LEFT JOIN file_counts fc
        ON fc.supplier_id = s.supplier_id
      ORDER BY s.updated_at DESC, s.created_at DESC
      `
    );

    return result.rows;
  }
}
