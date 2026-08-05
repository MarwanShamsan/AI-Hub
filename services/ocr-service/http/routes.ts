import { FastifyInstance } from "fastify";
import { ExtractDocumentUseCase } from "../application/extract-document";

export async function registerOcrRoutes(
  app: FastifyInstance,
  deps: {
    extractDocument: ExtractDocumentUseCase;
  }
) {
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "ocr-service"
    };
  });

  app.post("/extract", async (request, reply) => {
    const body = request.body as any;

    if (
      !body ||
      typeof body.file_name !== "string" ||
      typeof body.content_type !== "string" ||
      typeof body.file_data_base64 !== "string"
    ) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: "INVALID_OCR_REQUEST"
      });
    }

    const result = await deps.extractDocument.execute({
      file_name: body.file_name,
      content_type: body.content_type,
      file_data_base64: body.file_data_base64,
      document_type_hint: body.document_type_hint ?? null,
      language_hints: Array.isArray(body.language_hints)
        ? body.language_hints.map(String)
        : []
    });

    return reply.status(200).send({
      status: "ACCEPTED",
      result
    });
  });
}