import path from "node:path";
import * as dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";

dotenv.config({
  path: path.resolve(
    process.cwd(),
    "services/ocr-service/.env"
  )
});

import { registerOcrRoutes } from "./http/routes";
import { ExtractDocumentUseCase } from "./application/extract-document";
import { PdfTextProvider } from "./providers/pdf-text.provider";
import { TesseractOcrProvider } from "./providers/tesseract-ocr.provider";
import { AzureDocumentIntelligenceProvider } from "./providers/azure-document-intelligence.provider";

async function main() {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  const pdfTextProvider =
    new PdfTextProvider();

  const fallbackOcrProvider =
    new TesseractOcrProvider();

  const azureProvider =
    new AzureDocumentIntelligenceProvider();

  const configuredProvider =
    process.env.DOCUMENT_AI_PROVIDER
      ?.trim()
      .toLowerCase();

  const documentUnderstandingProvider =
    configuredProvider === "azure"
      ? azureProvider
      : undefined;

  const extractDocument =
    new ExtractDocumentUseCase(
      pdfTextProvider,
      fallbackOcrProvider,
      documentUnderstandingProvider
    );

  await registerOcrRoutes(app, {
    extractDocument
  });

  const port = Number(
    process.env.PORT ??
      process.env.OCR_SERVICE_PORT ??
      3010
  );

if (
  !Number.isInteger(port) ||
  port <= 0
) {
  throw new Error(
    "OCR service port must be a positive integer"
  );
}

  await app.listen({
    port,
    host: "0.0.0.0"
  });

  console.log(
    `[ocr-service] listening on :${port}`
  );

  console.log(
    `[ocr-service] primary provider = ${
      documentUnderstandingProvider?.isConfigured()
        ? "AZURE_DOCUMENT_INTELLIGENCE"
        : "TESSERACT_FALLBACK"
    }`
  );
}

main().catch((error) => {
  console.error(
    "[ocr-service] fatal error",
    error
  );

  process.exit(1);
});