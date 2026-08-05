export type SupplierQualificationStatus =
  | "DRAFT"
  | "PROFILE_INCOMPLETE"
  | "READY_FOR_REVIEW"
  | "PENDING_REVIEW"
  | "MISSING_REQUIREMENTS"
  | "APPROVED_FOR_DISCOVERY"
  | "REJECTED_PREDEAL";

export type SupplierType =
  | "manufacturer"
  | "trading_company"
  | "exporter"
  | "distributor"
  | "other";

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

export type SupplierProfileInput = {
  supplier_type?: SupplierType;
  legal_name?: string;
  registration_number?: string;
  registration_country?: string;
  business_category?: string;
  product_categories?: string[];
  operational_contact_name?: string;
  operational_contact_email?: string;
  operational_contact_phone?: string;
  declared_license_expiry_date?: string | null;
};

export type SupplierRecord = {
  supplier_id: string;
  tenant_id: string;
  owner_user_id: string;
  qualification_status: SupplierQualificationStatus;
  last_decision_reason_code: string | null;
  last_decision_reason_text: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierProfileRecord = {
  supplier_id: string;
  tenant_id: string;
  supplier_type: SupplierType | null;
  legal_name: string | null;
  registration_number: string | null;
  registration_country: string | null;
  business_category: string | null;
  product_categories: string[];
  operational_contact_name: string | null;
  operational_contact_email: string | null;
  operational_contact_phone: string | null;
  declared_license_expiry_date: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierView = {
  supplier: SupplierRecord;
  profile: SupplierProfileRecord | null;
};

export type SupplierQualificationDecisionStatus =
  | "MISSING_REQUIREMENTS"
  | "APPROVED_FOR_DISCOVERY"
  | "REJECTED_PREDEAL";

export type SupplierQualificationReviewRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  extraction_id: string | null;
  decision_status: SupplierQualificationDecisionStatus;
  reason_code: string;
  reason_text: string;
  blocking_issues: unknown[];
  decided_by_type: "SYSTEM" | "USER";
  decided_by_id: string;
  decided_at: string;
  created_at: string;
};