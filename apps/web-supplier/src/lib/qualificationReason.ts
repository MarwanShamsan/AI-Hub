export type QualificationTranslator = (
  key: string,
  params?: Record<string, string | number>
) => string;

type QualificationReasonInput = {
  reasonCode?: string | null;
  reasonText?: string | null;
  blockingIssues?: unknown[] | null;
};

const DOCUMENT_TYPES = [
  "LEGAL_REGISTRATION",
  "TRADE_LICENSE",
  "TAX_REGISTRATION",
  "MANUFACTURING_LICENSE",
  "EXPORT_LICENSE",
  "DISTRIBUTION_AUTHORIZATION",
  "QUALITY_CERTIFICATE",
  "FACTORY_PROFILE",
  "OTHER"
] as const;

const PROFILE_FIELDS = [
  "supplier_type",
  "legal_name",
  "registration_number",
  "registration_country",
  "operational_contact_email"
] as const;

function getStringIssues(
  blockingIssues: unknown[] | null | undefined
): string[] {
  if (!Array.isArray(blockingIssues)) {
    return [];
  }

  return blockingIssues.filter(
    (issue): issue is string =>
      typeof issue === "string" &&
      issue.trim().length > 0
  );
}

function extractDocumentType(
  input: QualificationReasonInput
): string | null {
  const searchableText = [
    input.reasonText ?? "",
    ...getStringIssues(
      input.blockingIssues
    )
  ].join(" ");

  for (const documentType of DOCUMENT_TYPES) {
    if (
      searchableText.includes(
        documentType
      )
    ) {
      return documentType;
    }
  }

  return null;
}

function extractDate(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(
    /\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/
  );

  return match?.[0] ?? null;
}

function extractMissingProfileFields(
  blockingIssues: unknown[] | null | undefined
): string[] {
  const issues =
    getStringIssues(blockingIssues);

  return PROFILE_FIELDS.filter(
    (field) =>
      issues.some(
        (issue) =>
          issue === field ||
          issue.endsWith(`:${field}`)
      )
  );
}

function extractMissingDocumentTypes(
  blockingIssues: unknown[] | null | undefined
): string[] {
  const issues =
    getStringIssues(blockingIssues);

  const found =
    new Set<string>();

  for (const issue of issues) {
    for (
      const documentType of
      DOCUMENT_TYPES
    ) {
      if (
        issue.includes(
          documentType
        )
      ) {
        found.add(documentType);
      }
    }
  }

  return Array.from(found);
}

function getDocumentLabel(
  input: QualificationReasonInput,
  t: QualificationTranslator
): string {
  const documentType =
    extractDocumentType(input);

  if (!documentType) {
    return t(
      "qualificationReason.genericDocument"
    );
  }

  return t(
    `documentType.${documentType}`
  );
}

function getProfileFieldLabels(
  input: QualificationReasonInput,
  t: QualificationTranslator
): string {
  const fields =
    extractMissingProfileFields(
      input.blockingIssues
    );

  if (fields.length === 0) {
    return t(
      "qualificationReason.unspecifiedFields"
    );
  }

  return fields
    .map((field) =>
      t(
        `qualificationProfileField.${field}`
      )
    )
    .join(
      t("common.listSeparator")
    );
}

function getMissingDocumentLabels(
  input: QualificationReasonInput,
  t: QualificationTranslator
): string {
  const documents =
    extractMissingDocumentTypes(
      input.blockingIssues
    );

  if (documents.length === 0) {
    return t(
      "qualificationReason.genericDocuments"
    );
  }

  return documents
    .map((documentType) =>
      t(
        `documentType.${documentType}`
      )
    )
    .join(
      t("common.listSeparator")
    );
}

export function getQualificationReasonText(
  input: QualificationReasonInput,
  t: QualificationTranslator
): string {
  const reasonCode =
    input.reasonCode?.trim() ||
    "UNKNOWN";

  const document =
    getDocumentLabel(
      input,
      t
    );

  const date =
    extractDate(
      input.reasonText
    );

  switch (reasonCode) {
    case "SUPPLIER_PROFILE_NOT_FOUND":
      return t(
        "qualificationReason.SUPPLIER_PROFILE_NOT_FOUND"
      );

    case "PROFILE_FIELDS_MISSING":
      return t(
        "qualificationReason.PROFILE_FIELDS_MISSING",
        {
          fields:
            getProfileFieldLabels(
              input,
              t
            )
        }
      );

    case "REQUIRED_DOCUMENTS_MISSING":
      return t(
        "qualificationReason.REQUIRED_DOCUMENTS_MISSING",
        {
          documents:
            getMissingDocumentLabels(
              input,
              t
            )
        }
      );

    case "QUALIFICATION_DOCUMENTS_NOT_EXTRACTED":
      return t(
        "qualificationReason.QUALIFICATION_DOCUMENTS_NOT_EXTRACTED",
        {
          document
        }
      );

    case "QUALIFICATION_DOCUMENT_UNREADABLE":
      return t(
        "qualificationReason.QUALIFICATION_DOCUMENT_UNREADABLE",
        {
          document
        }
      );

    case "DOCUMENT_EXTRACTION_INCOMPLETE":
      return t(
        "qualificationReason.DOCUMENT_EXTRACTION_INCOMPLETE",
        {
          document
        }
      );

    case "DOCUMENT_REVIEW_REQUIRED":
      return t(
        "qualificationReason.DOCUMENT_REVIEW_REQUIRED",
        {
          document
        }
      );

    case "DOCUMENT_CORRECTIONS_PENDING_VALIDATION":
      return t(
        "qualificationReason.DOCUMENT_CORRECTIONS_PENDING_VALIDATION",
        {
          document
        }
      );

    case "STALE_DOCUMENT_DECLARATION":
      return t(
        "qualificationReason.STALE_DOCUMENT_DECLARATION",
        {
          document
        }
      );

    case "DECLARED_DOCUMENT_EXPIRED":
      return t(
        "qualificationReason.DECLARED_DOCUMENT_EXPIRED",
        {
          document
        }
      );

    case "LICENSE_EXPIRED":
    case "DOCUMENT_EXPIRED":
      return date
        ? t(
            "qualificationReason.DOCUMENT_EXPIRED_WITH_DATE",
            {
              document,
              date
            }
          )
        : t(
            "qualificationReason.DOCUMENT_EXPIRED",
            {
              document
            }
          );

    case "INVALID_ISSUE_DATE":
      return t(
        "qualificationReason.INVALID_ISSUE_DATE",
        {
          document
        }
      );

    case "INVALID_EXPIRY_DATE":
      return t(
        "qualificationReason.INVALID_EXPIRY_DATE",
        {
          document
        }
      );

    case "ISSUE_DATE_IN_FUTURE":
      return t(
        "qualificationReason.ISSUE_DATE_IN_FUTURE",
        {
          document
        }
      );

    case "ISSUE_DATE_AFTER_EXPIRY":
      return t(
        "qualificationReason.ISSUE_DATE_AFTER_EXPIRY",
        {
          document
        }
      );

    case "LEGAL_NAME_MISMATCH":
      return t(
        "qualificationReason.LEGAL_NAME_MISMATCH",
        {
          document
        }
      );

    case "REGISTRATION_NUMBER_MISMATCH":
      return t(
        "qualificationReason.REGISTRATION_NUMBER_MISMATCH",
        {
          document
        }
      );

    case "ISSUING_COUNTRY_MISMATCH":
      return t(
        "qualificationReason.ISSUING_COUNTRY_MISMATCH",
        {
          document
        }
      );

    case "DOCUMENT_TYPE_MISMATCH":
      return t(
        "qualificationReason.DOCUMENT_TYPE_MISMATCH",
        {
          document
        }
      );

    case "DUPLICATE_EVIDENCE_ACROSS_REQUIREMENTS":
      return t(
        "qualificationReason.DUPLICATE_EVIDENCE_ACROSS_REQUIREMENTS"
      );

    case "FILE_HASH_MISSING":
      return t(
        "qualificationReason.FILE_HASH_MISSING",
        {
          document
        }
      );

    case "LOW_CONFIDENCE_FIELD":
      return t(
        "qualificationReason.LOW_CONFIDENCE_FIELD",
        {
          document
        }
      );

    case "DOCUMENT_VALIDATION_FAILED":
      return t(
        "qualificationReason.DOCUMENT_VALIDATION_FAILED"
      );

    case "QUALIFIED_FOR_DISCOVERY":
      return t(
        "qualificationReason.QUALIFIED_FOR_DISCOVERY"
      );

    default:
      return t(
        "qualificationReason.UNKNOWN"
      );
  }
}

export function getQualificationReasonCodeLabel(
  reasonCode: string | null | undefined,
  t: QualificationTranslator
): string {
  if (!reasonCode) {
    return "-";
  }

  const key =
    `qualificationReasonCode.${reasonCode}`;

  const translated =
    t(key);

  if (translated === key) {
    return t(
      "qualificationReasonCode.UNKNOWN"
    );
  }

  return translated;
}

export function getQualificationDecisionLabel(
  decision:
    | string
    | null
    | undefined,
  t: QualificationTranslator
): string {
  if (!decision) {
    return "-";
  }

  const key =
    `status.${decision}`;

  const translated =
    t(key);

  if (translated === key) {
    return t(
      "status.UNKNOWN"
    );
  }

  return translated;
}