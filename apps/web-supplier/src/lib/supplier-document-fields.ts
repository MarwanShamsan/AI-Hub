import { SupplierDocumentType, SupplierDeclaredFieldType } from "../types/supplier";

export type SupplierDocumentFieldDefinition = {
  key: string;
  labelKey: string;
  type: SupplierDeclaredFieldType;
  required?: boolean;
  placeholder?: string;
};

const COMMON_LICENSE_FIELDS: SupplierDocumentFieldDefinition[] = [
  {
    key: "legal_name",
    labelKey: "documents.fields.legalName",
    type: "text",
    required: true
  },
  {
    key: "license_number",
    labelKey: "documents.fields.licenseNumber",
    type: "text",
    required: true
  },
  {
    key: "registration_number",
    labelKey: "documents.fields.registrationNumber",
    type: "text"
  },
  {
    key: "issue_date",
    labelKey: "documents.fields.issueDate",
    type: "date"
  },
  {
    key: "expiry_date",
    labelKey: "documents.fields.expiryDate",
    type: "date"
  },
  {
    key: "issuing_authority",
    labelKey: "documents.fields.issuingAuthority",
    type: "text"
  },
  {
    key: "country_hint",
    labelKey: "documents.fields.country",
    type: "text"
  }
];

export const supplierDocumentFieldMap: Record<
  SupplierDocumentType,
  SupplierDocumentFieldDefinition[]
> = {
  LEGAL_REGISTRATION: [
    {
      key: "legal_name",
      labelKey: "documents.fields.legalName",
      type: "text",
      required: true
    },
    {
      key: "registration_number",
      labelKey: "documents.fields.registrationNumber",
      type: "text",
      required: true
    },
    {
      key: "issue_date",
      labelKey: "documents.fields.issueDate",
      type: "date"
    },
    {
      key: "expiry_date",
      labelKey: "documents.fields.expiryDate",
      type: "date"
    },
    {
      key: "issuing_authority",
      labelKey: "documents.fields.issuingAuthority",
      type: "text"
    },
    {
      key: "country_hint",
      labelKey: "documents.fields.country",
      type: "text"
    }
  ],
  TRADE_LICENSE: COMMON_LICENSE_FIELDS,
  TAX_REGISTRATION: [
    {
      key: "legal_name",
      labelKey: "documents.fields.legalName",
      type: "text",
      required: true
    },
    {
      key: "tax_number",
      labelKey: "documents.fields.taxNumber",
      type: "text",
      required: true
    },
    {
      key: "issue_date",
      labelKey: "documents.fields.issueDate",
      type: "date"
    },
    {
      key: "expiry_date",
      labelKey: "documents.fields.expiryDate",
      type: "date"
    },
    {
      key: "issuing_authority",
      labelKey: "documents.fields.issuingAuthority",
      type: "text"
    },
    {
      key: "country_hint",
      labelKey: "documents.fields.country",
      type: "text"
    }
  ],
  MANUFACTURING_LICENSE: COMMON_LICENSE_FIELDS,
  EXPORT_LICENSE: COMMON_LICENSE_FIELDS,
  DISTRIBUTION_AUTHORIZATION: [
    {
      key: "legal_name",
      labelKey: "documents.fields.legalName",
      type: "text",
      required: true
    },
    {
      key: "authorization_number",
      labelKey: "documents.fields.authorizationNumber",
      type: "text",
      required: true
    },
    {
      key: "issue_date",
      labelKey: "documents.fields.issueDate",
      type: "date"
    },
    {
      key: "expiry_date",
      labelKey: "documents.fields.expiryDate",
      type: "date"
    },
    {
      key: "issuing_authority",
      labelKey: "documents.fields.issuingAuthority",
      type: "text"
    },
    {
      key: "country_hint",
      labelKey: "documents.fields.country",
      type: "text"
    }
  ],
  QUALITY_CERTIFICATE: [
    {
      key: "legal_name",
      labelKey: "documents.fields.legalName",
      type: "text"
    },
    {
      key: "certificate_reference",
      labelKey: "documents.fields.certificateReference",
      type: "text",
      required: true
    },
    {
      key: "issue_date",
      labelKey: "documents.fields.issueDate",
      type: "date"
    },
    {
      key: "expiry_date",
      labelKey: "documents.fields.expiryDate",
      type: "date"
    },
    {
      key: "issuing_authority",
      labelKey: "documents.fields.issuingAuthority",
      type: "text"
    },
    {
      key: "country_hint",
      labelKey: "documents.fields.country",
      type: "text"
    }
  ],
  FACTORY_PROFILE: [
    {
      key: "legal_name",
      labelKey: "documents.fields.legalName",
      type: "text",
      required: true
    },
    {
      key: "factory_name",
      labelKey: "documents.fields.factoryName",
      type: "text"
    },
    {
      key: "country_hint",
      labelKey: "documents.fields.country",
      type: "text"
    }
  ],
  OTHER: [
    {
      key: "document_reference",
      labelKey: "documents.fields.documentReference",
      type: "text"
    },
    {
      key: "legal_name",
      labelKey: "documents.fields.legalName",
      type: "text"
    }
  ]
};

export function getSupplierDocumentFields(
  documentType: SupplierDocumentType
): SupplierDocumentFieldDefinition[] {
  return supplierDocumentFieldMap[documentType] ?? [];
}