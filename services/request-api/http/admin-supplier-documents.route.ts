import { FastifyInstance } from "fastify";
import { extractIdentity } from "../authz/identity";
import { SupplierExtractionRepository } from "../repositories/supplier-extraction.repository";
import { SupplierFileRepository } from "../repositories/supplier-file.repository";
import { SupplierRepository } from "../repositories/supplier.repository";
import { SupplierExtractionService } from "../services/supplier-extraction.service";
import { SupplierQualificationService } from "../services/supplier-qualification.service";

type Deps = {
  supplierRepo: SupplierRepository;
  supplierFileRepo: SupplierFileRepository;
  supplierExtractionRepo: SupplierExtractionRepository;
  supplierExtractionService: SupplierExtractionService;
  supplierQualificationService: SupplierQualificationService;
};

async function requireInternalReviewIdentity(request: any, reply: any) {
  try {
    const identity = await extractIdentity(request);

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
        reason: "ADMIN_ROUTE_REQUIRES_USER"
      });
      return null;
    }

    if (identity.role === "supplier") {
      reply.status(403).send({
        status: "REJECTED",
        reason: "INTERNAL_REVIEW_ROLE_REQUIRED"
      });
      return null;
    }

    return identity;
  } catch (error: any) {
    reply.status(401).send({
      status: "REJECTED",
      reason: "UNAUTHORIZED",
      message: error?.message ?? "UNKNOWN_AUTH_ERROR"
    });
    return null;
  }
}

export async function adminSupplierDocumentsRoute(
  app: FastifyInstance,
  opts: Deps
) {
  app.get("/suppliers/:supplierId/files", async (request, reply) => {
    const identity = await requireInternalReviewIdentity(request, reply);
    if (!identity) return;

    try {
      const { supplierId } = request.params as { supplierId: string };

      const supplier = await opts.supplierRepo.getById(supplierId);
      if (!supplier) {
        return reply.status(404).send({
          status: "REJECTED",
          reason: "SUPPLIER_NOT_FOUND"
        });
      }

      const files = await opts.supplierFileRepo.listBySupplier(
        supplierId,
        supplier.tenant_id
      );

      return reply.status(200).send({
        status: "ACCEPTED",
        count: files.length,
        files
      });
    } catch (error) {
      request.log.error(error, "admin supplier files fetch failed");

      return reply.status(500).send({
        status: "REJECTED",
        reason: "ADMIN_SUPPLIER_FILES_FETCH_FAILED"
      });
    }
  });

  app.get("/suppliers/:supplierId/extractions", async (request, reply) => {
    const identity = await requireInternalReviewIdentity(request, reply);
    if (!identity) return;

    try {
      const { supplierId } = request.params as { supplierId: string };

      const supplier = await opts.supplierRepo.getById(supplierId);
      if (!supplier) {
        return reply.status(404).send({
          status: "REJECTED",
          reason: "SUPPLIER_NOT_FOUND"
        });
      }

      const extractions = await opts.supplierExtractionRepo.listBySupplier(
        supplierId,
        supplier.tenant_id
      );

      return reply.status(200).send({
        status: "ACCEPTED",
        count: extractions.length,
        extractions
      });
    } catch (error) {
      request.log.error(error, "admin supplier extractions fetch failed");

      return reply.status(500).send({
        status: "REJECTED",
        reason: "ADMIN_SUPPLIER_EXTRACTIONS_FETCH_FAILED"
      });
    }
  });

  app.post(
    "/suppliers/:supplierId/files/:fileId/extract",
    async (request, reply) => {
      const identity = await requireInternalReviewIdentity(request, reply);
      if (!identity) return;

      try {
        const { supplierId, fileId } = request.params as {
          supplierId: string;
          fileId: string;
        };

        const supplier = await opts.supplierRepo.getById(supplierId);
        if (!supplier) {
          return reply.status(404).send({
            status: "REJECTED",
            reason: "SUPPLIER_NOT_FOUND"
          });
        }

        const supplierTenantId = supplier.tenant_id;

        const fileBlob = await opts.supplierFileRepo.getByIdWithData(
          fileId,
          supplierTenantId
        );

        if (!fileBlob || fileBlob.supplier_id !== supplierId) {
          return reply.status(404).send({
            status: "REJECTED",
            reason: "SUPPLIER_FILE_NOT_FOUND"
          });
        }

        await opts.supplierExtractionRepo.markSupersededBySupplier(
          supplierId,
          supplierTenantId
        );

        const result =
          await opts.supplierExtractionService.extractFromUploadedFile({
            file_name: fileBlob.file_name,
            content_type: fileBlob.content_type,
            file_data: fileBlob.file_data,
            document_type_hint: fileBlob.document_type ?? undefined
          });

        const extraction = await opts.supplierExtractionRepo.create({
          supplier_id: supplierId,
          tenant_id: supplierTenantId,
          source_file_id: fileBlob.id,
          source_type: result.source_type,
          extracted_text: result.extracted_text,
          extracted_payload: {
            ...result.extracted_payload,
            declared_document_type: fileBlob.document_type,
            declared_document_number: fileBlob.declared_document_number,
            declared_expiry_date: fileBlob.declared_expiry_date,
            declared_payload: fileBlob.declared_payload ?? {}
          },
          confidence_payload: result.confidence_payload,
          missing_fields: result.missing_fields,
          warnings: result.warnings,
          created_by: identity.actor_id
        });

        await opts.supplierRepo.updateQualificationStatus(
          supplierId,
          supplierTenantId,
          "PENDING_REVIEW",
          null,
          null
        );

        return reply.status(201).send({
          status: "ACCEPTED",
          extraction
        });
      } catch (error) {
        request.log.error(error, "admin supplier file extraction failed");

        return reply.status(500).send({
          status: "REJECTED",
          reason: "ADMIN_SUPPLIER_EXTRACTION_FAILED"
        });
      }
    }
  );
}