export type SupplierDeclaredFieldType = "text" | "date" | "email" | "phone";

export type SupplierDeclaredPayload = Record<string, string | null>;

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

export type UpdateSupplierProfileInput = {
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

export type SupplierFileRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  file_sha256: string | null;
  document_type: SupplierDocumentType | null;
  issuing_country: string | null;
  supersedes_file_id: string | null;
  is_current: boolean;
  declared_document_number: string | null;
  declared_expiry_date: string | null;
  declared_payload: SupplierDeclaredPayload;
  notes: string | null;
  created_at: string;
  warnings?: Array<{
  code: string;
  message: string;
}>;
};

export type SupplierExtractionRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  source_file_id: string | null;
  source_type: string;
  extracted_text: string | null;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, unknown>;
  missing_fields: unknown[];
  warnings: unknown[];
  review_status: string;
  created_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

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

export type SupplierDocumentReviewStatus =
  | "PROCESSING"
  | "PROCESSING_FAILED"
  | "REVIEW_REQUIRED"
  | "CONFIRMED"
  | "CORRECTION_SUBMITTED";

export type SupplierDocumentReviewRecord = {
  file: SupplierFileRecord;
  extraction: SupplierExtractionRecord | null;
  declaration: SupplierDocumentDeclarationRecord | null;
  review_status: SupplierDocumentReviewStatus;
};


export type SupplierQualificationFinding = {
  code: string;
  severity: "BLOCKING" | "WARNING";
  document_type?: SupplierDocumentType;
  file_id?: string;
  field_id?: string;
  expected?: string | null;
  actual?: string | null;
  message: string;
};

export type SupplierQualificationReviewRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  extraction_id: string | null;

  decision_status:
    | "MISSING_REQUIREMENTS"
    | "APPROVED_FOR_DISCOVERY"
    | "REJECTED_PREDEAL";

  reason_code: string;
  reason_text: string;

  blocking_issues:
    SupplierQualificationFinding[];

  decided_by_type:
    | "SYSTEM"
    | "USER";

  decided_by_id: string;
  decided_at: string;
  created_at: string;
};
