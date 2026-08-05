import {
  validateSupplierDocument
} from "./document-validation.policy";

import {
  validateDocumentType
} from "./document-type.policy";

import type {
  QualificationFinding,
  SupplierQualificationDocument,
  SupplierQualificationProfile,
  SupplierQualificationResult
} from "./types";

export function evaluateSupplierQualificationPolicy(
  input: {
    profile: SupplierQualificationProfile;
    documents:
      SupplierQualificationDocument[];
    requiredDocumentTypes: string[];
    now: Date;
  }
): SupplierQualificationResult {
  const findings:
    QualificationFinding[] = [];

  const profileFields = [
    [
      "supplier_type",
      input.profile.supplier_type
    ],
    [
      "legal_name",
      input.profile.legal_name
    ],
    [
      "registration_number",
      input.profile
        .registration_number
    ],
    [
      "registration_country",
      input.profile
        .registration_country
    ],
    [
      "operational_contact_email",
      input.profile
        .operational_contact_email
    ]
  ] as const;

  for (
    const [
      fieldName,
      fieldValue
    ] of profileFields
  ) {
    if (!fieldValue?.trim()) {
      findings.push({
        code:
          "PROFILE_FIELD_MISSING",
        severity: "BLOCKING",
        field_id: fieldName,
        message:
          `حقل الملف مطلوب: ${fieldName}`
      });
    }
  }

  const currentDocuments =
    input.documents.filter(
      (document) =>
        document.is_current
    );

  for (
    const requiredType of
    input.requiredDocumentTypes
  ) {
    const exists =
      currentDocuments.some(
        (document) =>
          document.document_type ===
          requiredType
      );

    if (!exists) {
      findings.push({
        code:
          "REQUIRED_DOCUMENT_MISSING",
        severity: "BLOCKING",
        document_type:
          requiredType as any,
        message:
          `الوثيقة المطلوبة غير موجودة: ${requiredType}`
      });
    }
  }

  const hashToDocuments =
    new Map<
      string,
      SupplierQualificationDocument[]
    >();

  for (
    const document of
    currentDocuments
  ) {
    if (document.file_sha256) {
      const existing =
        hashToDocuments.get(
          document.file_sha256
        ) ?? [];

      existing.push(document);

      hashToDocuments.set(
        document.file_sha256,
        existing
      );
    }

    findings.push(
      ...validateSupplierDocument({
        profile: input.profile,
        document,
        now: input.now
      }),

      ...validateDocumentType(
        document
      )
    );
  }

  for (
    const duplicatedDocuments of
    hashToDocuments.values()
  ) {
    const types =
      new Set(
        duplicatedDocuments.map(
          (document) =>
            document.document_type
        )
      );

    if (
      duplicatedDocuments.length > 1 &&
      types.size > 1
    ) {
      for (
        const document of
        duplicatedDocuments
      ) {
        findings.push({
          code:
            "DUPLICATE_EVIDENCE_ACROSS_REQUIREMENTS",
          severity: "BLOCKING",
          document_type:
            document.document_type,
          file_id:
            document.file_id,
          message:
            "تم استخدام الملف نفسه لإثبات أكثر من متطلب مختلف."
        });
      }
    }
  }

  const blockingFindings =
    findings.filter(
      (finding) =>
        finding.severity ===
        "BLOCKING"
    );

  if (
    blockingFindings.length > 0
  ) {
    return {
      decision:
        "MISSING_REQUIREMENTS",
      reason_code:
        "DOCUMENT_VALIDATION_FAILED",
      reason_text:
        "Supplier qualification requires corrected or replacement documents.",
      findings
    };
  }

  return {
    decision:
      "APPROVED_FOR_DISCOVERY",
    reason_code:
      "QUALIFIED_FOR_DISCOVERY",
    reason_text:
      "Supplier passed deterministic pre-deal qualification validation.",
    findings
  };
}