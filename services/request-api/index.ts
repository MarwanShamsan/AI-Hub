import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";
import { buildServer } from "./http/server";
import { registerRoutes } from "./http/routes";
import { RequestExtractionRepository } from "./repositories/request-extraction.repository";
import { RequestFileRepository } from "./repositories/request-file.repository";
import { RequestRepository } from "./repositories/request.repository";
import { SupplierDocumentDeclarationRepository } from "./repositories/supplier-document-declaration.repository";
import { SupplierExtractionRepository } from "./repositories/supplier-extraction.repository";
import { SupplierFileRepository } from "./repositories/supplier-file.repository";
import { SupplierRepository } from "./repositories/supplier.repository";
import { SupplierExtractionService } from "./services/supplier-extraction.service";
import { SupplierQualificationService } from "./services/supplier-qualification.service";

dotenv.config({
  path: path.resolve(__dirname, ".env")
});

async function main(): Promise<void> {
  const port = Number(
    process.env.PORT ??
      process.env.REQUEST_API_PORT ??
      3003
  );

  console.log(
    "[request-api] ENV file =",
    path.resolve(__dirname, ".env")
  );

  console.log(
    "[request-api] CORS_ORIGIN =",
    process.env.CORS_ORIGIN
  );

  console.log(
    "[request-api] JWT_PUBLIC_KEY_PEM exists =",
    Boolean(process.env.JWT_PUBLIC_KEY_PEM)
  );

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const requestRepo = new RequestRepository(pool);
  const requestFileRepo = new RequestFileRepository(pool);
  const requestExtractionRepo =
    new RequestExtractionRepository(pool);

  const supplierRepo = new SupplierRepository(pool);
  const supplierFileRepo =
    new SupplierFileRepository(pool);
  const supplierExtractionRepo =
    new SupplierExtractionRepository(pool);

  const supplierDocumentDeclarationRepo =
    new SupplierDocumentDeclarationRepository(pool);

  const supplierExtractionService =
    new SupplierExtractionService();

  const supplierQualificationService =
    new SupplierQualificationService(
      supplierRepo,
      supplierFileRepo,
      supplierExtractionRepo,
      supplierDocumentDeclarationRepo
    );

  const app = await buildServer();

  await registerRoutes(app, {
    requestRepo,
    requestFileRepo,
    requestExtractionRepo,

    supplierRepo,
    supplierFileRepo,
    supplierExtractionRepo,
    supplierDocumentDeclarationRepo,
    supplierExtractionService,
    supplierQualificationService
  });

  await app.listen({
    port,
    host: "0.0.0.0"
  });

  console.log(
    `[request-api] listening on :${port}`
  );
}

main().catch((error) => {
  console.error(
    "[request-api] fatal error",
    error
  );

  process.exit(1);
});