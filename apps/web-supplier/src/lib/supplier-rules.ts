import {
  SupplierDocumentType,
  SupplierFileRecord,
  SupplierProfileRecord,
  SupplierType
} from "../types/supplier";

export type RequiredDocumentRule = {
  type: SupplierDocumentType;
  label: string;
  descriptionKey: string;
  required: true;
};

export const supplierDocumentLabels = {
  LEGAL_REGISTRATION: "Legal registration certificate",
  TRADE_LICENSE: "Trade license",
  TAX_REGISTRATION: "Tax registration certificate",
  MANUFACTURING_LICENSE: "Industrial license",
  EXPORT_LICENSE: "Export license",
  DISTRIBUTION_AUTHORIZATION: "Distribution authorization",
  QUALITY_CERTIFICATE: "Quality certificate",
  FACTORY_PROFILE: "Factory profile",
  OTHER: "Other document"
};

export function getRequiredDocumentsBySupplierType(
  supplierType: SupplierType | null | undefined
): RequiredDocumentRule[] {
  const base: RequiredDocumentRule[] = [
    {
      type: "LEGAL_REGISTRATION",
      label: "Legal registration",
      descriptionKey: "documentRequirementDescription.LEGAL_REGISTRATION",
      required: true
    },
    {
      type: "TRADE_LICENSE",
      label: "Trade license",
      descriptionKey: "documentRequirementDescription.TRADE_LICENSE",
      required: true
    }
  ];

  if (supplierType === "manufacturer") {
    base.push({
      type: "MANUFACTURING_LICENSE",
      label: "Manufacturing license",
      descriptionKey: "documentRequirementDescription.MANUFACTURING_LICENSE",
      required: true
    });
  }

  return base;
}

export function getUploadedDocumentMap(
  files: SupplierFileRecord[]
): Record<string, SupplierFileRecord> {
  const map: Record<string, SupplierFileRecord> = {};

  for (const file of files) {
    if (!file.document_type || file.is_current === false) continue;
    if (!map[file.document_type]) {
      map[file.document_type] = file;
    }
  }

  return map;
}

export function getMissingRequiredDocumentTypes(
  supplierType: SupplierType | null | undefined,
  files: SupplierFileRecord[]
): SupplierDocumentType[] {
  const required = getRequiredDocumentsBySupplierType(supplierType);
  const uploaded = getUploadedDocumentMap(files);

  return required
    .filter((rule) => !uploaded[rule.type])
    .map((rule) => rule.type);
}

export function getProfileCompleteness(profile: SupplierProfileRecord | null) {
  const missingFields: string[] = [];

  if (!profile?.supplier_type) missingFields.push("supplier_type");
  if (!profile?.legal_name) missingFields.push("legal_name");
  if (!profile?.registration_number) missingFields.push("registration_number");
  if (!profile?.registration_country) missingFields.push("registration_country");
  if (!profile?.operational_contact_email) {
    missingFields.push("operational_contact_email");
  }

  return {
    complete: missingFields.length === 0,
    missingFields
  };
}
