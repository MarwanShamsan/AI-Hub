import { FastifyInstance } from "fastify";
import { RequestExtractionRepository } from "../repositories/request-extraction.repository";
import { RequestFileRepository } from "../repositories/request-file.repository";
import { RequestRepository } from "../repositories/request.repository";
import { SupplierDocumentDeclarationRepository } from "../repositories/supplier-document-declaration.repository";
import { SupplierExtractionRepository } from "../repositories/supplier-extraction.repository";
import { SupplierFileRepository } from "../repositories/supplier-file.repository";
import { SupplierRepository } from "../repositories/supplier.repository";
import { SupplierExtractionService } from "../services/supplier-extraction.service";
import { SupplierQualificationService } from "../services/supplier-qualification.service";
import { adminSupplierDocumentsRoute } from "./admin-supplier-documents.route";
import { adminSuppliersRoute } from "./admin-suppliers.route";
import { requestExtractionsRoute } from "./request-extractions.route";
import { requestFilesRoute } from "./request-files.route";
import { requestsRoute } from "./requests.route";
import { suppliersRoute } from "./suppliers.route";

type Deps = {
  requestRepo: RequestRepository;
  requestFileRepo: RequestFileRepository;
  requestExtractionRepo: RequestExtractionRepository;

  supplierRepo: SupplierRepository;
  supplierFileRepo: SupplierFileRepository;
  supplierExtractionRepo: SupplierExtractionRepository;
  supplierDocumentDeclarationRepo: SupplierDocumentDeclarationRepository;
  supplierExtractionService: SupplierExtractionService;
  supplierQualificationService: SupplierQualificationService;
};

export async function registerRoutes(
  app: FastifyInstance,
  deps: Deps
): Promise<void> {
  await app.register(
    async (instance) => {
      await requestsRoute(instance, {
        requestRepo: deps.requestRepo
      });
    },
    {
      prefix: "/requests"
    }
  );

  await app.register(
    async (instance) => {
      await requestFilesRoute(instance, {
        requestRepo: deps.requestRepo,
        requestFileRepo: deps.requestFileRepo
      });
    },
    {
      prefix: "/requests"
    }
  );

  await app.register(
    async (instance) => {
      await requestExtractionsRoute(instance, {
        requestRepo: deps.requestRepo,
        requestFileRepo: deps.requestFileRepo,
        requestExtractionRepo: deps.requestExtractionRepo
      });
    },
    {
      prefix: "/requests"
    }
  );

  await app.register(
    async (instance) => {
      await suppliersRoute(instance, {
        supplierRepo: deps.supplierRepo,
        supplierFileRepo: deps.supplierFileRepo,
        supplierExtractionRepo:
          deps.supplierExtractionRepo,
        supplierDocumentDeclarationRepo:
          deps.supplierDocumentDeclarationRepo,
        supplierExtractionService:
          deps.supplierExtractionService,
        supplierQualificationService:
          deps.supplierQualificationService
      });
    },
    {
      prefix: "/suppliers"
    }
  );

  await app.register(
    async (instance) => {
      await adminSuppliersRoute(instance, {
        supplierRepo: deps.supplierRepo
      });
    },
    {
      prefix: "/admin"
    }
  );

  await app.register(
    async (instance) => {
      await adminSupplierDocumentsRoute(instance, {
        supplierRepo: deps.supplierRepo,
        supplierFileRepo: deps.supplierFileRepo,
        supplierExtractionRepo: deps.supplierExtractionRepo,
        supplierExtractionService: deps.supplierExtractionService,
        supplierQualificationService:
          deps.supplierQualificationService
      });
    },
    {
      prefix: "/admin/supplier-documents"
    }
  );
}