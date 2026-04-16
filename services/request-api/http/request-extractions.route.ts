import { FastifyInstance } from "fastify";
import { extractIdentity } from "../authz/identity";
import { RequestRepository } from "../repositories/request.repository";
import { RequestFileRepository } from "../repositories/request-file.repository";
import { RequestExtractionRepository } from "../repositories/request-extraction.repository";
import { RequestExtractionService } from "../services/request-extraction.service";

type Deps = {
  requestRepo: RequestRepository;
  requestFileRepo: RequestFileRepository;
  requestExtractionRepo: RequestExtractionRepository;
};

export async function requestExtractionsRoute(
  app: FastifyInstance,
  opts: Deps
) {
  const extractionService = new RequestExtractionService();

  app.get("/:requestId/extractions", async (request, reply) => {
    try {
      const identity = await extractIdentity(request);
      const { requestId } = request.params as { requestId: string };

      const requestRecord = await opts.requestRepo.getById(
        requestId,
        identity.tenant_id
      );

      if (!requestRecord) {
        return reply.status(404).send({
          status: "REJECTED",
          reason: "REQUEST_NOT_FOUND"
        });
      }

      const extractions = await opts.requestExtractionRepo.listByRequest(
        requestId,
        identity.tenant_id
      );

      return reply.status(200).send({
        status: "ACCEPTED",
        count: extractions.length,
        extractions
      });
    } catch (error: any) {
      return reply.status(401).send({
        status: "REJECTED",
        reason: error?.message || "UNAUTHORIZED"
      });
    }
  });

  app.post("/:requestId/extract", async (request, reply) => {
    try {
      const identity = await extractIdentity(request);

      if (identity.actor_type !== "USER") {
        return reply.status(403).send({
          status: "REJECTED",
          reason: "REQUEST_EXTRACTION_REQUIRES_USER"
        });
      }

      const { requestId } = request.params as { requestId: string };

      const requestRecord = await opts.requestRepo.getById(
        requestId,
        identity.tenant_id
      );

      if (!requestRecord) {
        return reply.status(404).send({
          status: "REJECTED",
          reason: "REQUEST_NOT_FOUND"
        });
      }

      const files = await opts.requestFileRepo.listByRequest(
        requestId,
        identity.tenant_id
      );

      const latestPending =
        await opts.requestExtractionRepo.getLatestByRequest(
          requestId,
          identity.tenant_id
        );

      if (latestPending?.review_status === "PENDING_REVIEW") {
        await opts.requestExtractionRepo.markSupersededByRequest(
          requestId,
          identity.tenant_id
        );
      }

      const sourceFileMeta = files[0] ?? null;
      const sourceFile =
        sourceFileMeta
          ? await opts.requestFileRepo.getByIdWithData(
              sourceFileMeta.id,
              identity.tenant_id
            )
          : null;

      const fallbackRequestData = {
        request_title: requestRecord.confirmed_input.request_title,
        destination_country: requestRecord.confirmed_input.destination_country,
        quantity_value: requestRecord.confirmed_input.quantity_value,
        quantity_unit: requestRecord.confirmed_input.quantity_unit,
        request_brief: requestRecord.confirmed_input.request_brief,
        preferred_supplier_country:
          requestRecord.confirmed_input.preferred_supplier_country,
        certifications_required:
          requestRecord.confirmed_input.certifications_required,
        packaging_requirements:
          requestRecord.confirmed_input.packaging_requirements,
        shipping_preference:
          requestRecord.confirmed_input.shipping_preference,
        budget_range: requestRecord.confirmed_input.budget_range,
        target_delivery_timeline:
          requestRecord.confirmed_input.target_delivery_timeline
      };

      const extracted = sourceFile
        ? await extractionService.extractFromFile({
            file: sourceFile,
            fallbackRequestData
          })
        : {
            source_type: "MANUAL_MERGE" as const,
            extracted_text: null,
            extracted_payload: fallbackRequestData,
            confidence_payload: {},
            missing_fields: [],
            warnings: ["No request-side file uploaded yet; extraction used request data only."]
          };

      const extraction = await opts.requestExtractionRepo.create({
        request_id: requestId,
        tenant_id: identity.tenant_id,
        source_file_id: sourceFile?.id ?? null,
        source_type: extracted.source_type,
        extracted_text: extracted.extracted_text,
        extracted_payload: extracted.extracted_payload,
        confidence_payload: extracted.confidence_payload,
        missing_fields: extracted.missing_fields,
        warnings: extracted.warnings,
        created_by: identity.actor_id
      });

      return reply.status(201).send({
        status: "ACCEPTED",
        extraction
      });
    } catch (error: any) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: error?.message || "EXTRACTION_FAILED"
      });
    }
  });
}