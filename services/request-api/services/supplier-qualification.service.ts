import {
  SupplierFileRecord,
  SupplierFileRepository
} from "../repositories/supplier-file.repository";
import { SupplierDocumentDeclarationRepository } from "../repositories/supplier-document-declaration.repository";
import {
  SupplierExtractionRecord,
  SupplierExtractionRepository
} from "../repositories/supplier-extraction.repository";
import { SupplierRepository } from "../repositories/supplier.repository";
import type {
  SupplierDocumentType,
  SupplierProfileRecord,
  SupplierQualificationDecisionStatus,
  SupplierType
} from "../types/supplier.types";

type DeclarationLike = {
  id: string;
  source_file_id: string;
  extraction_id: string;
  declaration_type:
    | "CONFIRMED_AS_EXTRACTED"
    | "CORRECTION_SUBMITTED";
  created_at: string;
};

type CurrentSupplierFileRecord = SupplierFileRecord & {
  is_current?: boolean;
};

type EvaluationResult = {
  decision_status: SupplierQualificationDecisionStatus;
  reason_code: string;
  reason_text: string;
  blocking_issues: string[];
  extraction_id: string | null;
};

type DocumentContext = {
  documentType: SupplierDocumentType;
  file: CurrentSupplierFileRecord;
  extraction: SupplierExtractionRecord | null;
  declaration: DeclarationLike | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeRegistrationNumber(
  value: string | null | undefined
): string {
  return normalize(value).replace(/[^a-z0-9\u0600-\u06ff]/g, "");
}

function isPastDate(
  dateText: string | null | undefined
): boolean {
  if (!dateText) {
    return false;
  }

  const dateOnlyMatch = dateText.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  let parsed: Date;

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    parsed = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        23,
        59,
        59,
        999
      )
    );
  } else {
    parsed = new Date(dateText);
  }

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() < Date.now();
}

function getRequiredDocumentTypes(
  supplierType: SupplierType | null | undefined
): SupplierDocumentType[] {
  const required: SupplierDocumentType[] = [
    "LEGAL_REGISTRATION",
    "TRADE_LICENSE"
  ];

  if (supplierType === "manufacturer") {
    required.push("MANUFACTURING_LICENSE");
  }

  return required;
}

function buildUploadedDocumentMap(
  files: SupplierFileRecord[]
): Partial<
  Record<SupplierDocumentType, CurrentSupplierFileRecord>
> {
  const map: Partial<
    Record<SupplierDocumentType, CurrentSupplierFileRecord>
  > = {};

  for (const rawFile of files) {
    const file = rawFile as CurrentSupplierFileRecord;

    if (!file.document_type) {
      continue;
    }

    if (file.is_current === false) {
      continue;
    }

    /*
     * listBySupplier returns newest records first.
     * Therefore, the first current file for a document type wins.
     */
    if (!map[file.document_type]) {
      map[file.document_type] = file;
    }
  }

  return map;
}

function buildLatestExtractionMap(
  extractions: SupplierExtractionRecord[]
): Map<string, SupplierExtractionRecord> {
  const map = new Map<string, SupplierExtractionRecord>();

  for (const extraction of extractions) {
    if (!extraction.source_file_id) {
      continue;
    }

    /*
     * listBySupplier returns newest records first.
     */
    if (!map.has(extraction.source_file_id)) {
      map.set(extraction.source_file_id, extraction);
    }
  }

  return map;
}

function buildLatestDeclarationMap(
  declarations: DeclarationLike[]
): Map<string, DeclarationLike> {
  const map = new Map<string, DeclarationLike>();

  for (const declaration of declarations) {
    if (!declaration.source_file_id) {
      continue;
    }

    /*
     * listBySupplier returns newest records first.
     */
    if (!map.has(declaration.source_file_id)) {
      map.set(
        declaration.source_file_id,
        declaration
      );
    }
  }

  return map;
}

function readString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizePayloadKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readGenericField(
  payload: Record<string, unknown>,
  aliases: string[]
): string | null {
  const genericFields = payload.generic_fields;

  if (!Array.isArray(genericFields)) {
    return null;
  }

  const normalizedAliases = new Set(
    aliases.map(normalizePayloadKey)
  );

  for (const rawField of genericFields) {
    if (
      typeof rawField !== "object" ||
      rawField === null ||
      Array.isArray(rawField)
    ) {
      continue;
    }

    const field = rawField as Record<string, unknown>;

    const rawIdentifier =
      readString(field.field_id) ??
      readString(field.key) ??
      readString(field.label);

    if (!rawIdentifier) {
      continue;
    }

    if (
      !normalizedAliases.has(
        normalizePayloadKey(rawIdentifier)
      )
    ) {
      continue;
    }

    const fieldValue =
      readString(field.value) ??
      readString(field.extracted_value);

    if (fieldValue) {
      return fieldValue;
    }
  }

  return null;
}

function readPayloadField(
  payload: Record<string, unknown>,
  aliases: string[]
): string | null {
  for (const alias of aliases) {
    const directValue = readString(payload[alias]);

    if (directValue) {
      return directValue;
    }
  }

  return readGenericField(payload, aliases);
}

function getExtractionFields(
  extraction: SupplierExtractionRecord
): {
  documentType: string | null;
  legalName: string | null;
  registrationNumber: string | null;
  expiryDate: string | null;
} {
  const payload =
    extraction.extracted_payload &&
    typeof extraction.extracted_payload === "object"
      ? extraction.extracted_payload
      : {};

  return {
    documentType: readPayloadField(payload, [
      "document_type",
      "documentType"
    ]),

    legalName: readPayloadField(payload, [
      "legal_name",
      "legalName",
      "company_name",
      "companyName",
      "business_name",
      "businessName"
    ]),

    registrationNumber: readPayloadField(payload, [
      "registration_number",
      "registrationNumber",
      "license_number",
      "licenseNumber",
      "licence_number",
      "licenceNumber"
    ]),

    expiryDate: readPayloadField(payload, [
      "expiry_date",
      "expiryDate",
      "expiration_date",
      "expirationDate",
      "valid_until",
      "validUntil"
    ])
  };
}

function getPrimaryExtractionId(
  documents: DocumentContext[]
): string | null {
  for (const document of documents) {
    if (document.extraction) {
      return document.extraction.id;
    }
  }

  return null;
}

export class SupplierQualificationService {
  constructor(
    private readonly supplierRepo: SupplierRepository,
    private readonly supplierFileRepo: SupplierFileRepository,
    private readonly supplierExtractionRepo: SupplierExtractionRepository,
    private readonly supplierDeclarationRepo: SupplierDocumentDeclarationRepository
  ) {}

  async evaluateSupplierQualification(input: {
    supplier_id: string;
    tenant_id: string;
  }) {
    const supplierView =
      await this.supplierRepo.getViewByTenant(
        input.tenant_id
      );

    if (
      !supplierView ||
      supplierView.supplier.supplier_id !==
        input.supplier_id
    ) {
      throw new Error("SUPPLIER_NOT_FOUND");
    }

    const [
      files,
      extractions,
      rawDeclarations
    ] = await Promise.all([
      this.supplierFileRepo.listBySupplier(
        input.supplier_id,
        input.tenant_id
      ),

      this.supplierExtractionRepo.listBySupplier(
        input.supplier_id,
        input.tenant_id
      ),

      this.supplierDeclarationRepo.listBySupplier(
        input.supplier_id,
        input.tenant_id
      )
    ]);

    const declarations =
      rawDeclarations as unknown as DeclarationLike[];

    const decision = this.buildDecision({
      profile: supplierView.profile,
      files,
      extractions,
      declarations
    });

    const review =
      await this.supplierRepo.createQualificationReview({
        supplier_id: input.supplier_id,
        tenant_id: input.tenant_id,
        extraction_id: decision.extraction_id,
        decision_status: decision.decision_status,
        reason_code: decision.reason_code,
        reason_text: decision.reason_text,
        blocking_issues: decision.blocking_issues,
        decided_by_type: "SYSTEM",
        decided_by_id: "PREDEAL_AGENT_1"
      });

    const supplier =
      await this.supplierRepo.updateQualificationStatus(
        input.supplier_id,
        input.tenant_id,
        decision.decision_status,
        decision.reason_code,
        decision.reason_text
      );

    if (!supplier) {
      throw new Error(
        "SUPPLIER_QUALIFICATION_STATUS_UPDATE_FAILED"
      );
    }

    return {
      supplier,
      review
    };
  }

  private buildDecision(input: {
    profile: SupplierProfileRecord | null;
    files: SupplierFileRecord[];
    extractions: SupplierExtractionRecord[];
    declarations: DeclarationLike[];
  }): EvaluationResult {
    const {
      profile,
      files,
      extractions,
      declarations
    } = input;

    if (!profile) {
      return {
        decision_status: "MISSING_REQUIREMENTS",
        reason_code: "SUPPLIER_PROFILE_NOT_FOUND",
        reason_text:
          "Supplier profile does not exist yet",
        blocking_issues: [
          "supplier_profile_missing"
        ],
        extraction_id: null
      };
    }

    const missingProfileFields: string[] = [];

    if (!profile.supplier_type) {
      missingProfileFields.push("supplier_type");
    }

    if (!profile.legal_name) {
      missingProfileFields.push("legal_name");
    }

    if (!profile.registration_number) {
      missingProfileFields.push(
        "registration_number"
      );
    }

    if (!profile.registration_country) {
      missingProfileFields.push(
        "registration_country"
      );
    }

    if (!profile.operational_contact_email) {
      missingProfileFields.push(
        "operational_contact_email"
      );
    }

    if (missingProfileFields.length > 0) {
      return {
        decision_status: "MISSING_REQUIREMENTS",
        reason_code: "PROFILE_FIELDS_MISSING",
        reason_text:
          `Supplier profile is incomplete: ` +
          missingProfileFields.join(", "),
        blocking_issues: missingProfileFields,
        extraction_id: null
      };
    }

    const requiredDocumentTypes =
      getRequiredDocumentTypes(
        profile.supplier_type
      );

    const uploadedDocumentMap =
      buildUploadedDocumentMap(files);

    const missingRequiredDocuments =
      requiredDocumentTypes.filter(
        (documentType) =>
          !uploadedDocumentMap[documentType]
      );

    if (missingRequiredDocuments.length > 0) {
      return {
        decision_status: "MISSING_REQUIREMENTS",
        reason_code:
          "REQUIRED_DOCUMENTS_MISSING",
        reason_text:
          `Required supplier documents are missing: ` +
          missingRequiredDocuments.join(", "),
        blocking_issues:
          missingRequiredDocuments.map(
            (documentType) =>
              `missing_document:${documentType}`
          ),
        extraction_id: null
      };
    }

    const latestExtractionByFile =
      buildLatestExtractionMap(extractions);

    const latestDeclarationByFile =
      buildLatestDeclarationMap(declarations);

    const requiredDocuments: DocumentContext[] =
      requiredDocumentTypes.map(
        (documentType) => {
          const file =
            uploadedDocumentMap[documentType];

          if (!file) {
            throw new Error(
              `REQUIRED_DOCUMENT_MAP_INCONSISTENT:${documentType}`
            );
          }

          const extraction =
            latestExtractionByFile.get(file.id) ??
            null;

          const declarationCandidate =
            latestDeclarationByFile.get(file.id) ??
            null;

          const declaration =
            declarationCandidate &&
            extraction &&
            declarationCandidate.extraction_id ===
              extraction.id
              ? declarationCandidate
              : null;

          return {
            documentType,
            file,
            extraction,
            declaration
          };
        }
      );

    const primaryExtractionId =
      getPrimaryExtractionId(requiredDocuments);

    const expiredDeclaredDocuments =
      requiredDocuments.filter((document) =>
        isPastDate(
          document.file.declared_expiry_date
        )
      );

    if (expiredDeclaredDocuments.length > 0) {
      return {
        decision_status: "REJECTED_PREDEAL",
        reason_code:
          "DECLARED_DOCUMENT_EXPIRED",
        reason_text:
          `One or more required documents are declared expired: ` +
          expiredDeclaredDocuments
            .map(
              (document) =>
                document.documentType
            )
            .join(", "),
        blocking_issues:
          expiredDeclaredDocuments.map(
            (document) =>
              `expired_declared_document:${document.documentType}`
          ),
        extraction_id: primaryExtractionId
      };
    }

    const documentsWithoutExtraction =
      requiredDocuments.filter(
        (document) => !document.extraction
      );

    if (documentsWithoutExtraction.length > 0) {
      return {
        decision_status: "MISSING_REQUIREMENTS",
        reason_code:
          "QUALIFICATION_DOCUMENTS_NOT_EXTRACTED",
        reason_text:
          `Required documents have no extraction result: ` +
          documentsWithoutExtraction
            .map(
              (document) =>
                document.documentType
            )
            .join(", "),
        blocking_issues:
          documentsWithoutExtraction.map(
            (document) =>
              `extraction_missing:${document.documentType}`
          ),
        extraction_id: primaryExtractionId
      };
    }

    const unusableDocuments =
      requiredDocuments.filter((document) => {
        const extraction =
          document.extraction;

        if (!extraction) {
          return false;
        }

        const fields =
          getExtractionFields(extraction);

        return (
          fields.documentType === "NO_FILE" ||
          extraction.source_type ===
            "UNREADABLE_PDF"
        );
      });

    if (unusableDocuments.length > 0) {
      return {
        decision_status: "MISSING_REQUIREMENTS",
        reason_code:
          "QUALIFICATION_DOCUMENT_UNREADABLE",
        reason_text:
          `One or more required documents could not be read: ` +
          unusableDocuments
            .map(
              (document) =>
                document.documentType
            )
            .join(", "),
        blocking_issues:
          unusableDocuments.map(
            (document) =>
              `document_unreadable:${document.documentType}`
          ),
        extraction_id: primaryExtractionId
      };
    }

    const documentsWithoutDeclaration =
      requiredDocuments.filter(
        (document) => !document.declaration
      );

    if (
      documentsWithoutDeclaration.length > 0
    ) {
      return {
        decision_status: "MISSING_REQUIREMENTS",
        reason_code:
          "DOCUMENT_REVIEW_REQUIRED",
        reason_text:
          `Supplier review is required for extracted documents: ` +
          documentsWithoutDeclaration
            .map(
              (document) =>
                document.documentType
            )
            .join(", "),
        blocking_issues:
          documentsWithoutDeclaration.map(
            (document) =>
              `document_review_required:${document.documentType}`
          ),
        extraction_id: primaryExtractionId
      };
    }

    const correctedDocuments =
      requiredDocuments.filter(
        (document) =>
          document.declaration
            ?.declaration_type ===
          "CORRECTION_SUBMITTED"
      );

    if (correctedDocuments.length > 0) {
      return {
        decision_status: "MISSING_REQUIREMENTS",
        reason_code:
          "DOCUMENT_CORRECTIONS_PENDING_VALIDATION",
        reason_text:
          `Supplier corrections require validation before qualification: ` +
          correctedDocuments
            .map(
              (document) =>
                document.documentType
            )
            .join(", "),
        blocking_issues:
          correctedDocuments.map(
            (document) =>
              `correction_pending_validation:${document.documentType}`
          ),
        extraction_id: primaryExtractionId
      };
    }

    for (const document of requiredDocuments) {
      const extraction = document.extraction;

      if (!extraction) {
        continue;
      }

      const missingFields = Array.isArray(
        extraction.missing_fields
      )
        ? extraction.missing_fields
            .map(String)
            .filter(Boolean)
        : [];

      if (missingFields.length > 0) {
        return {
          decision_status:
            "MISSING_REQUIREMENTS",
          reason_code:
            "DOCUMENT_EXTRACTION_INCOMPLETE",
          reason_text:
            `Missing extracted fields in ${document.documentType}: ` +
            missingFields.join(", "),
          blocking_issues:
            missingFields.map(
              (field) =>
                `missing_extracted_field:${document.documentType}:${field}`
            ),
          extraction_id: extraction.id
        };
      }

      const extractedFields =
        getExtractionFields(extraction);

      if (
        extractedFields.expiryDate &&
        isPastDate(
          extractedFields.expiryDate
        )
      ) {
        return {
          decision_status:
            "REJECTED_PREDEAL",
          reason_code: "LICENSE_EXPIRED",
          reason_text:
            `${document.documentType} expired on ` +
            extractedFields.expiryDate,
          blocking_issues: [
            `expired_qualification_document:${document.documentType}`
          ],
          extraction_id: extraction.id
        };
      }

      if (
        extractedFields.legalName &&
        normalize(profile.legal_name) !==
          normalize(
            extractedFields.legalName
          )
      ) {
        return {
          decision_status:
            "REJECTED_PREDEAL",
          reason_code:
            "LEGAL_NAME_MISMATCH",
          reason_text:
            `Extracted legal name in ${document.documentType} ` +
            "does not match the supplier profile legal name",
          blocking_issues: [
            `legal_name_mismatch:${document.documentType}`
          ],
          extraction_id: extraction.id
        };
      }

      if (
        extractedFields.registrationNumber &&
        normalizeRegistrationNumber(
          profile.registration_number
        ) !==
          normalizeRegistrationNumber(
            extractedFields.registrationNumber
          )
      ) {
        return {
          decision_status:
            "REJECTED_PREDEAL",
          reason_code:
            "REGISTRATION_NUMBER_MISMATCH",
          reason_text:
            `Extracted registration number in ${document.documentType} ` +
            "does not match the supplier profile registration number",
          blocking_issues: [
            `registration_number_mismatch:${document.documentType}`
          ],
          extraction_id: extraction.id
        };
      }
    }

    return {
      decision_status:
        "APPROVED_FOR_DISCOVERY",
      reason_code:
        "QUALIFIED_FOR_DISCOVERY",
      reason_text:
        "Supplier passed pre-deal qualification and is eligible for discovery",
      blocking_issues: [],
      extraction_id: primaryExtractionId
    };
  }
}