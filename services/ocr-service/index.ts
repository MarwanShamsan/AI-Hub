import * as path from "node:path";
import * as dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";

import { registerOcrRoutes } from "./http/routes";
import { ExtractDocumentUseCase } from "./application/extract-document";
import { PdfTextProvider } from "./providers/pdf-text.provider";
import { NoopOcrProvider } from "./providers/noop-ocr.provider";
import { AzureDocumentIntelligenceProvider } from "./providers/azure-document-intelligence.provider";
import type { OcrProvider } from "./domain/ocr-provider";

/**
 * Load the local .env file only during local development.
 *
 * Render injects environment variables directly into process.env,
 * so it must not depend on a committed or local .env file.
 */
if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: path.resolve(
      process.cwd(),
      "services/ocr-service/.env"
    )
  });
}

type OcrProviderConstructor =
  new () => OcrProvider;

type TesseractProviderModule = {
  TesseractOcrProvider:
    OcrProviderConstructor;
};

/**
 * Tesseract currently depends on a platform-specific PDF package.
 *
 * The module path is deliberately constructed at runtime so Node and
 * TypeScript do not eagerly load the package when Azure is selected.
 */
function createFallbackOcrProvider(
  configuredProvider: string
): OcrProvider {
  if (configuredProvider === "azure") {
    return new NoopOcrProvider();
  }

  if (process.platform === "linux") {
    throw new Error(
      "The local Tesseract OCR provider is not supported on Linux by the current implementation. Set DOCUMENT_AI_PROVIDER=azure."
    );
  }

  const modulePath = [
    "./providers",
    "tesseract-ocr.provider"
  ].join("/");

  const providerModule =
    require(
      modulePath
    ) as TesseractProviderModule;

  return new providerModule
    .TesseractOcrProvider();
}

function resolveConfiguredProvider():
  string {
  return (
    process.env
      .DOCUMENT_AI_PROVIDER
      ?.trim()
      .toLowerCase() ??
    "tesseract"
  );
}

function resolvePort(): number {
  const rawPort =
    process.env.PORT ??
    process.env.OCR_SERVICE_PORT ??
    "3010";

  const port =
    Number(rawPort);

  if (
    !Number.isInteger(port) ||
    port <= 0 ||
    port > 65_535
  ) {
    throw new Error(
      `OCR service port is invalid: ${rawPort}`
    );
  }

  return port;
}

async function main(): Promise<void> {
  const configuredProvider =
    resolveConfiguredProvider();

  if (
    configuredProvider !== "azure" &&
    configuredProvider !== "tesseract"
  ) {
    throw new Error(
      `Unsupported DOCUMENT_AI_PROVIDER: ${configuredProvider}`
    );
  }

  const app = Fastify({
    logger: true
  });

  /*
   * This service is intended for server-to-server requests.
   * Browser CORS access is therefore disabled.
   */
  await app.register(cors, {
    origin: false
  });

  const pdfTextProvider =
    new PdfTextProvider();

  const azureProvider =
    new AzureDocumentIntelligenceProvider();

  if (
    configuredProvider === "azure" &&
    !azureProvider.isConfigured()
  ) {
    throw new Error(
      "Azure Document Intelligence is selected, but its endpoint or credentials are incomplete."
    );
  }

  const documentUnderstandingProvider =
    configuredProvider === "azure"
      ? azureProvider
      : undefined;

  const fallbackOcrProvider =
    createFallbackOcrProvider(
      configuredProvider
    );

  const extractDocument =
    new ExtractDocumentUseCase(
      pdfTextProvider,
      fallbackOcrProvider,
      documentUnderstandingProvider
    );

  await registerOcrRoutes(app, {
    extractDocument
  });

  const port =
    resolvePort();

  await app.listen({
    port,
    host: "0.0.0.0"
  });

  app.log.info(
    {
      port,
      provider:
        configuredProvider === "azure"
          ? "AZURE_DOCUMENT_INTELLIGENCE"
          : "TESSERACT"
    },
    "OCR service started"
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.error(
    "[ocr-service] fatal error:",
    message
  );

  process.exit(1);
});