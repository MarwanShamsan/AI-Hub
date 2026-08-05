import { createHash } from "node:crypto";
import { FastifyInstance } from "fastify";

import { extractIdentity } from "../authz/identity";
import { SupplierDocumentDeclarationRepository } from "../repositories/supplier-document-declaration.repository";

import {
  SupplierExtractionRecord,
  SupplierExtractionRepository
} from "../repositories/supplier-extraction.repository";

import {
  SupplierDocumentType,
  SupplierFileRecord,
  SupplierFileRepository
} from "../repositories/supplier-file.repository";

import { SupplierRepository } from "../repositories/supplier.repository";
import { SupplierExtractionService } from "../services/supplier-extraction.service";
import { SupplierQualificationService } from "../services/supplier-qualification.service";
import { updateSupplierProfileSchema } from "../validators/update-supplier-profile.schema";

type Deps = {
  supplierRepo: SupplierRepository;
  supplierFileRepo: SupplierFileRepository;
  supplierExtractionRepo: SupplierExtractionRepository;
  supplierDocumentDeclarationRepo: SupplierDocumentDeclarationRepository;
  supplierExtractionService: SupplierExtractionService;
  supplierQualificationService: SupplierQualificationService;
};

type ExtendedSupplierFileRecord = SupplierFileRecord & {
  file_sha256?: string | null;
  issuing_country?: string | null;
  supersedes_file_id?: string | null;
  is_current?: boolean;
};

type DocumentReviewStatus =
  | "PROCESSING_FAILED"
  | "REVIEW_REQUIRED"
  | "CONFIRMED"
  | "CORRECTION_SUBMITTED";

type SupplierDocumentDeclarationType =
  | "CONFIRMED_AS_EXTRACTED"
  | "CORRECTION_SUBMITTED";

type SupplierDocumentDeclarationField = {
  field_id: string;
  label: string;
  extracted_value: string | null;
  declared_value: string | null;
  confidence: number | null;
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = new Set<SupplierDocumentType>([
  "LEGAL_REGISTRATION",
  "TRADE_LICENSE",
  "TAX_REGISTRATION",
  "MANUFACTURING_LICENSE",
  "EXPORT_LICENSE",
  "DISTRIBUTION_AUTHORIZATION",
  "QUALITY_CERTIFICATE",
  "FACTORY_PROFILE",
  "OTHER"
]);

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/bmp",
  "image/heic",
  "image/heif"
]);

function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "UNKNOWN_ERROR";
}

function normalizeOptionalString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function isSupplierDocumentType(
  value: unknown
): value is SupplierDocumentType {
  return (
    typeof value === "string" &&
    ALLOWED_DOCUMENT_TYPES.has(
      value as SupplierDocumentType
    )
  );
}

function sha256(buffer: Buffer): string {
  return createHash("sha256")
    .update(buffer)
    .digest("hex");
}

function enrichSupplierFiles(
  records: SupplierFileRecord[]
): Array<
  SupplierFileRecord & {
    file_sha256: string | null;
    issuing_country: string | null;
    supersedes_file_id: string | null;
    is_current: boolean;
  }
> {
  const extendedRecords =
    records as ExtendedSupplierFileRecord[];

  const explicitlySupersededIds = new Set<string>();

  for (const record of extendedRecords) {
    if (record.supersedes_file_id) {
      explicitlySupersededIds.add(
        record.supersedes_file_id
      );
    }
  }

  const newestDocumentTypeSeen =
    new Set<SupplierDocumentType>();

  return extendedRecords.map((record) => {
    let isCurrent: boolean;

    if (typeof record.is_current === "boolean") {
      isCurrent = record.is_current;
    } else if (
      explicitlySupersededIds.has(record.id)
    ) {
      isCurrent = false;
    } else if (!record.document_type) {
      isCurrent = true;
    } else if (
      newestDocumentTypeSeen.has(
        record.document_type
      )
    ) {
      isCurrent = false;
    } else {
      newestDocumentTypeSeen.add(
        record.document_type
      );

      isCurrent = true;
    }

    return {
      ...record,
      file_sha256:
        record.file_sha256 ?? null,
      issuing_country:
        record.issuing_country ?? null,
      supersedes_file_id:
        record.supersedes_file_id ?? null,
      is_current: isCurrent
    };
  });
}

function buildDocumentReviewStatus(input: {
  extraction: SupplierExtractionRecord | null;
  declarationType: string | null;
}): DocumentReviewStatus {
  if (!input.extraction) {
    return "PROCESSING_FAILED";
  }

  if (
    input.declarationType ===
    "CONFIRMED_AS_EXTRACTED"
  ) {
    return "CONFIRMED";
  }

  if (
    input.declarationType ===
    "CORRECTION_SUBMITTED"
  ) {
    return "CORRECTION_SUBMITTED";
  }

  return "REVIEW_REQUIRED";
}

function normalizeConfidence(
  value: unknown
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  const normalized =
    value > 1 && value <= 100
      ? value / 100
      : value;

  return Math.min(
    1,
    Math.max(0, normalized)
  );
}

function parseDeclarationFields(
  value: unknown
):
  | {
      ok: true;
      fields: SupplierDocumentDeclarationField[];
    }
  | {
      ok: false;
      reason: string;
    } {
  if (!Array.isArray(value) || value.length === 0) {
    return {
      ok: false,
      reason: "INVALID_DOCUMENT_DECLARATION"
    };
  }

  const fields: SupplierDocumentDeclarationField[] =
    [];

  for (const rawField of value) {
    if (!isPlainObject(rawField)) {
      return {
        ok: false,
        reason: "INVALID_DOCUMENT_DECLARATION"
      };
    }

    const fieldId =
      normalizeOptionalString(
        rawField.field_id
      );

    const label =
      normalizeOptionalString(
        rawField.label
      );

    if (!fieldId || !label) {
      return {
        ok: false,
        reason: "INVALID_DOCUMENT_DECLARATION"
      };
    }

    fields.push({
      field_id: fieldId,
      label,

      extracted_value:
        normalizeOptionalString(
          rawField.extracted_value
        ),

      declared_value:
        normalizeOptionalString(
          rawField.declared_value
        ),

      confidence:
        normalizeConfidence(
          rawField.confidence
        )
    });
  }

  return {
    ok: true,
    fields
  };
}

async function requireSupplierIdentity(
  request: any,
  reply: any
) {
  try {
    const identity =
      await extractIdentity(request);

    if (!identity.tenant_id) {
      reply.status(401).send({
        status: "REJECTED",
        reason: "TENANT_ID_MISSING"
      });

      return null;
    }

    if (identity.actor_type !== "USER") {
      reply.status(403).send({
        status: "REJECTED",
        reason:
          "SUPPLIER_ROUTE_REQUIRES_USER"
      });

      return null;
    }

    if (identity.role !== "supplier") {
      reply.status(403).send({
        status: "REJECTED",
        reason: "SUPPLIER_ROLE_REQUIRED"
      });

      return null;
    }

    return identity;
  } catch {
    reply.status(401).send({
      status: "REJECTED",
      reason: "UNAUTHORIZED"
    });

    return null;
  }
}

export async function suppliersRoute(
  app: FastifyInstance,
  opts: Deps
): Promise<void> {
  app.post(
    "/me/bootstrap",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const supplier =
          await opts.supplierRepo.bootstrap({
            tenant_id: identity.tenant_id,
            owner_user_id:
              identity.actor_id
          });

        const profile =
          await opts.supplierRepo.getProfileByTenant(
            identity.tenant_id
          );

        return reply.status(201).send({
          status: "ACCEPTED",
          supplier,
          profile
        });
      } catch (error) {
        request.log.error(
          {
            err: error
          },
          "supplier bootstrap failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason: "REQUEST_FAILED",
          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  app.get(
    "/me/profile",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const view =
          await opts.supplierRepo.getViewByTenant(
            identity.tenant_id
          );

        if (!view) {
          return reply.status(404).send({
            status: "REJECTED",
            reason: "SUPPLIER_NOT_FOUND"
          });
        }

        return reply.status(200).send({
          status: "ACCEPTED",
          supplier: view.supplier,
          profile: view.profile
        });
      } catch (error) {
        request.log.error(
          {
            err: error
          },
          "supplier profile fetch failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason: "REQUEST_FAILED",
          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  app.put(
    "/me/profile",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      const parsed =
        updateSupplierProfileSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply.status(400).send({
          status: "REJECTED",
          reason:
            "INVALID_SUPPLIER_PROFILE_PAYLOAD",

          message: parsed.error.issues
            .map((issue) => issue.message)
            .join("; ")
        });
      }

      try {
        const supplier =
          await opts.supplierRepo.bootstrap({
            tenant_id: identity.tenant_id,
            owner_user_id:
              identity.actor_id
          });

        const profile =
          await opts.supplierRepo.upsertProfile(
            supplier.supplier_id,
            identity.tenant_id,
            parsed.data
          );

        const isIncomplete =
          !profile.supplier_type ||
          !profile.legal_name ||
          !profile.registration_number ||
          !profile.registration_country ||
          !profile.operational_contact_email;

        const updatedSupplier =
          await opts.supplierRepo.updateQualificationStatus(
            supplier.supplier_id,
            identity.tenant_id,
            isIncomplete
              ? "PROFILE_INCOMPLETE"
              : supplier.qualification_status,
            null,
            null
          );

        return reply.status(200).send({
          status: "ACCEPTED",
          supplier: updatedSupplier,
          profile
        });
      } catch (error) {
        request.log.error(
          {
            err: error
          },
          "supplier profile update failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason: "REQUEST_FAILED",
          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  app.get(
    "/me/files",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const supplier =
          await opts.supplierRepo.getByTenant(
            identity.tenant_id
          );

        if (!supplier) {
          return reply.status(404).send({
            status: "REJECTED",
            reason: "SUPPLIER_NOT_FOUND"
          });
        }

        const records =
          await opts.supplierFileRepo.listBySupplier(
            supplier.supplier_id,
            identity.tenant_id
          );

        const files =
          enrichSupplierFiles(records);

        return reply.status(200).send({
          status: "ACCEPTED",
          count: files.length,
          files
        });
      } catch (error) {
        request.log.error(
          {
            err: error
          },
          "supplier files fetch failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason: "REQUEST_FAILED",
          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  /*
   * This route is declared exactly once.
   */
  app.get(
    "/me/document-reviews",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const supplier =
          await opts.supplierRepo.getByTenant(
            identity.tenant_id
          );

        if (!supplier) {
          return reply.status(404).send({
            status: "REJECTED",
            reason: "SUPPLIER_NOT_FOUND"
          });
        }

        const [
          rawFiles,
          extractions,
          declarations
        ] = await Promise.all([
          opts.supplierFileRepo.listBySupplier(
            supplier.supplier_id,
            identity.tenant_id
          ),

          opts.supplierExtractionRepo.listBySupplier(
            supplier.supplier_id,
            identity.tenant_id
          ),

          opts.supplierDocumentDeclarationRepo.listBySupplier(
            supplier.supplier_id,
            identity.tenant_id
          )
        ]);

        const files =
          enrichSupplierFiles(rawFiles);

        /*
         * Both repository lists are expected
         * to be ordered newest first.
         */
        const latestExtractionByFile =
          new Map<
            string,
            SupplierExtractionRecord
          >();

        for (const extraction of extractions) {
          if (
            extraction.source_file_id &&
            !latestExtractionByFile.has(
              extraction.source_file_id
            )
          ) {
            latestExtractionByFile.set(
              extraction.source_file_id,
              extraction
            );
          }
        }

        const latestDeclarationByFile =
          new Map<
            string,
            (typeof declarations)[number]
          >();

        for (const declaration of declarations) {
          if (
            !latestDeclarationByFile.has(
              declaration.source_file_id
            )
          ) {
            latestDeclarationByFile.set(
              declaration.source_file_id,
              declaration
            );
          }
        }

        const documents = files.map(
          (file) => {
            const extraction =
              latestExtractionByFile.get(
                file.id
              ) ?? null;

            const declaration =
              latestDeclarationByFile.get(
                file.id
              ) ?? null;

            return {
              file,
              extraction,
              declaration,

              review_status:
                buildDocumentReviewStatus({
                  extraction,

                  declarationType:
                    declaration
                      ?.declaration_type ??
                    null
                })
            };
          }
        );

        return reply.status(200).send({
          status: "ACCEPTED",
          count: documents.length,
          documents
        });
      } catch (error) {
        request.log.error(
          {
            err: error,
            message: errorMessage(error)
          },
          "supplier document reviews fetch failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason:
            "SUPPLIER_DOCUMENT_REVIEWS_FETCH_FAILED",

          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  /*
   * Evidence files are not deleted.
   * A replacement must be uploaded as a new file.
   */
  app.delete(
    "/me/files/:fileId",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      return reply.status(405).send({
        status: "REJECTED",
        reason:
          "SUPPLIER_EVIDENCE_DELETE_NOT_ALLOWED",

        message:
          "Upload a newer version instead of deleting evidence."
      });
    }
  );

  app.post(
    "/me/files",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const supplier =
          await opts.supplierRepo.bootstrap({
            tenant_id: identity.tenant_id,
            owner_user_id:
              identity.actor_id
          });

        const parts = request.parts();

        let uploadedFileName:
          | string
          | null = null;

        let uploadedFileMimeType:
          | string
          | null = null;

        let uploadedFileBuffer:
          | Buffer
          | null = null;

        let documentType:
          | SupplierDocumentType
          | null = null;

        let issuingCountry:
          | string
          | null = null;

        let supersedesFileId:
          | string
          | null = null;

        let notes:
          | string
          | null = null;

        for await (const part of parts) {
          if (part.type === "file") {
            if (uploadedFileBuffer) {
              await part.toBuffer();

              return reply.status(400).send({
                status: "REJECTED",
                reason:
                  "MULTIPLE_FILES_NOT_ALLOWED"
              });
            }

            uploadedFileName =
              part.filename;

            uploadedFileMimeType =
              part.mimetype
                .trim()
                .toLowerCase();

            uploadedFileBuffer =
              await part.toBuffer();

            continue;
          }

          const value =
            normalizeOptionalString(
              part.value
            );

          if (
            part.fieldname ===
            "document_type"
          ) {
            if (
              value &&
              isSupplierDocumentType(value)
            ) {
              documentType = value;
            } else if (value) {
              return reply.status(400).send({
                status: "REJECTED",
                reason:
                  "INVALID_DOCUMENT_TYPE"
              });
            }
          } else if (
            part.fieldname ===
            "issuing_country"
          ) {
            issuingCountry = value;
          } else if (
            part.fieldname ===
            "supersedes_file_id"
          ) {
            supersedesFileId = value;
          } else if (
            part.fieldname === "notes"
          ) {
            notes = value;
          }
        }

        if (
          !uploadedFileBuffer ||
          !uploadedFileName ||
          !uploadedFileMimeType
        ) {
          return reply.status(400).send({
            status: "REJECTED",
            reason: "FILE_REQUIRED"
          });
        }

        if (!documentType) {
          return reply.status(400).send({
            status: "REJECTED",
            reason:
              "INVALID_DOCUMENT_TYPE"
          });
        }

        if (
          uploadedFileBuffer.length >
          MAX_FILE_BYTES
        ) {
          return reply.status(413).send({
            status: "REJECTED",
            reason: "FILE_TOO_LARGE"
          });
        }

        if (
          !ALLOWED_CONTENT_TYPES.has(
            uploadedFileMimeType
          )
        ) {
          return reply.status(415).send({
            status: "REJECTED",
            reason:
              "UNSUPPORTED_DOCUMENT_CONTENT_TYPE"
          });
        }

        const fileHash =
          sha256(uploadedFileBuffer);

        const existingRecords =
          await opts.supplierFileRepo.listBySupplier(
            supplier.supplier_id,
            identity.tenant_id
          );

        const existingFiles =
          enrichSupplierFiles(
            existingRecords
          );

        if (supersedesFileId) {
          const supersededFile =
            existingFiles.find(
              (file) =>
                file.id ===
                supersedesFileId
            );

          if (
            !supersededFile ||
            !supersededFile.is_current
          ) {
            return reply.status(400).send({
              status: "REJECTED",
              reason:
                "INVALID_SUPERSEDED_FILE"
            });
          }

          if (
            supersededFile.document_type !==
            documentType
          ) {
            return reply.status(409).send({
              status: "REJECTED",
              reason:
                "REPLACEMENT_DOCUMENT_TYPE_MISMATCH"
            });
          }
        }

        const duplicateFile =
          existingFiles.find(
            (file) =>
              file.file_sha256 ===
              fileHash
          );

        if (duplicateFile) {
          return reply.status(409).send({
            status: "REJECTED",

            reason:
              duplicateFile.document_type ===
              documentType
                ? "DUPLICATE_SUPPLIER_DOCUMENT"
                : "DUPLICATE_FILE_DIFFERENT_REQUIREMENT",

            duplicate_file_id:
              duplicateFile.id
          });
        }

        /*
         * The intersection preserves compatibility
         * with both the old and upgraded repository.
         */
        const createInput:
          Parameters<
            SupplierFileRepository["create"]
          >[0] & {
            file_sha256: string;
            issuing_country: string | null;
            supersedes_file_id: string | null;
          } = {
          supplier_id:
            supplier.supplier_id,

          tenant_id:
            identity.tenant_id,

          uploaded_by:
            identity.actor_id,

          file_name:
            uploadedFileName,

          content_type:
            uploadedFileMimeType,

          file_size_bytes:
            uploadedFileBuffer.length,

          file_data:
            uploadedFileBuffer,

          document_type:
            documentType,

          declared_document_number:
            null,

          declared_expiry_date:
            null,

          declared_payload: {},

          notes,

          file_sha256:
            fileHash,

          issuing_country:
            issuingCountry,

          supersedes_file_id:
            supersedesFileId
        };

        const storedRecord =
          await opts.supplierFileRepo.create(
            createInput
          );

        const storedExtended =
          storedRecord as ExtendedSupplierFileRecord;

        const file = {
          ...storedRecord,

          file_sha256:
            storedExtended.file_sha256 ??
            fileHash,

          issuing_country:
            storedExtended.issuing_country ??
            issuingCountry,

          supersedes_file_id:
            storedExtended.supersedes_file_id ??
            supersedesFileId,

          is_current: true
        };

        let extraction:
          | SupplierExtractionRecord
          | null = null;

        let processingError:
          | string
          | null = null;

        try {
          const extracted =
            await opts.supplierExtractionService.extractFromUploadedFile(
              {
                file_name:
                  uploadedFileName,

                content_type:
                  uploadedFileMimeType,

                file_data:
                  uploadedFileBuffer,

                document_type_hint:
                  documentType
              }
            );

          extraction =
            await opts.supplierExtractionRepo.create(
              {
                supplier_id:
                  supplier.supplier_id,

                tenant_id:
                  identity.tenant_id,

                source_file_id:
                  storedRecord.id,

                source_type:
                  extracted.source_type,

                extracted_text:
                  extracted.extracted_text,

                extracted_payload:
                  extracted.extracted_payload,

                confidence_payload:
                  extracted.confidence_payload,

                missing_fields:
                  extracted.missing_fields,

                warnings:
                  extracted.warnings,

                created_by:
                  identity.actor_id
              }
            );
        } catch (extractionError) {
          processingError =
            errorMessage(
              extractionError
            );

          request.log.error(
            {
              err: extractionError,
              supplier_id:
                supplier.supplier_id,
              file_id:
                storedRecord.id
            },
            "supplier document extraction failed"
          );
        }

        const profile =
          await opts.supplierRepo.getProfileByTenant(
            identity.tenant_id
          );

        const profileComplete =
          Boolean(
            profile?.supplier_type &&
              profile.legal_name &&
              profile.registration_number &&
              profile.registration_country &&
              profile.operational_contact_email
          );

        await opts.supplierRepo.updateQualificationStatus(
          supplier.supplier_id,
          identity.tenant_id,
          profileComplete
            ? "READY_FOR_REVIEW"
            : "PROFILE_INCOMPLETE",
          null,
          null
        );

        return reply.status(201).send({
          status: processingError
            ? "ACCEPTED_WITH_PROCESSING_ERROR"
            : "ACCEPTED",

          file,
          extraction,

          processing_error:
            processingError
        });
      } catch (error) {
        request.log.error(
          {
            err: error,
            message: errorMessage(error)
          },
          "supplier file upload failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason:
            "SUPPLIER_FILE_UPLOAD_FAILED",

          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  app.post(
    "/me/files/:fileId/declarations",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const supplier =
          await opts.supplierRepo.getByTenant(
            identity.tenant_id
          );

        if (!supplier) {
          return reply.status(404).send({
            status: "REJECTED",
            reason: "SUPPLIER_NOT_FOUND"
          });
        }

        const { fileId } =
          request.params as {
            fileId: string;
          };

        const body =
          request.body as unknown;

        if (!isPlainObject(body)) {
          return reply.status(400).send({
            status: "REJECTED",
            reason:
              "INVALID_DOCUMENT_DECLARATION"
          });
        }

        const declarationType =
          body.declaration_type;

        if (
          declarationType !==
            "CONFIRMED_AS_EXTRACTED" &&
          declarationType !==
            "CORRECTION_SUBMITTED"
        ) {
          return reply.status(400).send({
            status: "REJECTED",
            reason:
              "INVALID_DOCUMENT_DECLARATION"
          });
        }

        const parsedFields =
          parseDeclarationFields(
            body.declared_fields
          );

        if (!parsedFields.ok) {
          return reply.status(400).send({
            status: "REJECTED",
            reason: parsedFields.reason
          });
        }

        const correctionReason =
          normalizeOptionalString(
            body.correction_reason
          );

        let declaredFields =
          parsedFields.fields;

        if (
          declarationType ===
          "CONFIRMED_AS_EXTRACTED"
        ) {
          declaredFields =
            declaredFields.map(
              (field) => ({
                ...field,
                declared_value:
                  field.extracted_value
              })
            );
        }

        if (
          declarationType ===
            "CORRECTION_SUBMITTED" &&
          !correctionReason
        ) {
          return reply.status(400).send({
            status: "REJECTED",
            reason:
              "CORRECTION_REASON_REQUIRED"
          });
        }

        if (
          declarationType ===
          "CORRECTION_SUBMITTED"
        ) {
          const changed =
            declaredFields.some(
              (field) =>
                (
                  field.declared_value ??
                  ""
                ) !==
                (
                  field.extracted_value ??
                  ""
                )
            );

          if (!changed) {
            return reply.status(400).send({
              status: "REJECTED",
              reason:
                "NO_CORRECTED_VALUE_PROVIDED"
            });
          }
        }

        const file =
          await opts.supplierFileRepo.getByIdWithData(
            fileId,
            identity.tenant_id
          );

        if (
          !file ||
          file.supplier_id !==
            supplier.supplier_id
        ) {
          return reply.status(404).send({
            status: "REJECTED",
            reason:
              "SUPPLIER_FILE_NOT_FOUND"
          });
        }

        const extractions =
          await opts.supplierExtractionRepo.listBySupplier(
            supplier.supplier_id,
            identity.tenant_id
          );

        const extraction =
          extractions.find(
            (record) =>
              record.source_file_id ===
              file.id
          ) ?? null;

        if (!extraction) {
          return reply.status(409).send({
            status: "REJECTED",
            reason:
              "DOCUMENT_EXTRACTION_REQUIRED"
          });
        }

        const requestedExtractionId =
          normalizeOptionalString(
            body.extraction_id
          );

        if (
          requestedExtractionId &&
          requestedExtractionId !==
            extraction.id
        ) {
          return reply.status(409).send({
            status: "REJECTED",
            reason:
              "STALE_DOCUMENT_EXTRACTION"
          });
        }

        const declaration =
          await opts.supplierDocumentDeclarationRepo.create(
            {
              supplier_id:
                supplier.supplier_id,

              tenant_id:
                identity.tenant_id,

              source_file_id:
                file.id,

              extraction_id:
                extraction.id,

              declaration_type:
                declarationType as SupplierDocumentDeclarationType,

              declared_fields:
                declaredFields,

              correction_reason:
                correctionReason,

              submitted_by:
                identity.actor_id
            }
          );

        return reply.status(201).send({
          status: "ACCEPTED",
          declaration
        });
      } catch (error) {
        request.log.error(
          {
            err: error,
            message: errorMessage(error)
          },
          "supplier document declaration failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason:
            "SUPPLIER_DOCUMENT_DECLARATION_FAILED",

          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  app.get(
    "/me/extractions",
    async (_request, reply) => {
      return reply.status(403).send({
        status: "REJECTED",
        reason:
          "SUPPLIER_EXTRACTION_NOT_AVAILABLE"
      });
    }
  );

  app.post(
    "/me/files/:fileId/extract",
    async (_request, reply) => {
      return reply.status(403).send({
        status: "REJECTED",
        reason:
          "SUPPLIER_EXTRACTION_NOT_AVAILABLE"
      });
    }
  );

  app.post(
    "/me/extract",
    async (_request, reply) => {
      return reply.status(403).send({
        status: "REJECTED",
        reason:
          "SUPPLIER_EXTRACTION_NOT_AVAILABLE"
      });
    }
  );

  app.get(
    "/me/qualification",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const view =
          await opts.supplierRepo.getViewByTenant(
            identity.tenant_id
          );

        if (!view) {
          return reply.status(404).send({
            status: "REJECTED",
            reason: "SUPPLIER_NOT_FOUND"
          });
        }

        const latestReview =
          await opts.supplierRepo.getLatestQualificationReview(
            view.supplier.supplier_id,
            identity.tenant_id
          );

        return reply.status(200).send({
          status: "ACCEPTED",
          supplier: view.supplier,
          profile: view.profile,
          latest_review: latestReview
        });
      } catch (error) {
        request.log.error(
          {
            err: error
          },
          "supplier qualification fetch failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason: "REQUEST_FAILED",
          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );

  app.post(
    "/me/qualification/evaluate",
    async (request, reply) => {
      const identity =
        await requireSupplierIdentity(
          request,
          reply
        );

      if (!identity) {
        return;
      }

      try {
        const supplier =
          await opts.supplierRepo.bootstrap({
            tenant_id:
              identity.tenant_id,

            owner_user_id:
              identity.actor_id
          });

        const result =
          await opts.supplierQualificationService.evaluateSupplierQualification(
            {
              supplier_id:
                supplier.supplier_id,

              tenant_id:
                identity.tenant_id
            }
          );

        return reply.status(200).send({
          status: "ACCEPTED",
          supplier: result.supplier,
          review: result.review
        });
      } catch (error) {
        request.log.error(
          {
            err: error
          },
          "supplier qualification evaluate failed"
        );

        return reply.status(500).send({
          status: "REJECTED",
          reason: "REQUEST_FAILED",
          message:
            process.env.NODE_ENV ===
            "production"
              ? undefined
              : errorMessage(error)
        });
      }
    }
  );
}