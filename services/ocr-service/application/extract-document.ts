import { OcrProvider } from "../domain/ocr-provider";
import { DocumentUnderstandingProvider } from "../domain/document-understanding-provider";
import { parseSupplierDocument } from "../domain/supplier-field-parser";
import {
  OcrExtractRequest,
  OcrExtractResponse,
  OcrPageResult
} from "../types/ocr.types";

function joinPages(pages: OcrPageResult[]): string {
  return pages
    .map((page) => page.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function averageConfidence(
  values: Array<number | null>
): number {
  const usableValues = values.filter(
    (value): value is number =>
      typeof value === "number" &&
      Number.isFinite(value)
  );

  if (usableValues.length === 0) {
    return 0;
  }

  return Number(
    (
      usableValues.reduce(
        (sum, value) => sum + value,
        0
      ) / usableValues.length
    ).toFixed(4)
  );
}

export class ExtractDocumentUseCase {
  constructor(
    private readonly pdfTextProvider: OcrProvider,
    private readonly fallbackOcrProvider: OcrProvider,
    private readonly documentUnderstandingProvider?: DocumentUnderstandingProvider
  ) {}

  async execute(
    input: OcrExtractRequest
  ): Promise<OcrExtractResponse> {
    const fileBuffer = Buffer.from(
      input.file_data_base64,
      "base64"
    );

    const contentType =
      input.content_type.toLowerCase();

    const warnings: string[] = [];

    if (
      this.documentUnderstandingProvider?.isConfigured() &&
      (
        contentType.includes("pdf") ||
        contentType.startsWith("image/")
      )
    ) {
      try {
        const result =
          await this.documentUnderstandingProvider.analyze({
            file_name: input.file_name,
            content_type: input.content_type,
            file_data: fileBuffer
          });

        const overallConfidence =
          averageConfidence(
            result.generic_fields.map(
              (field) => field.confidence
            )
          );

        return {
          status:
            result.extracted_text &&
            result.generic_fields.length > 0
              ? "SUCCEEDED"
              : "PARTIAL",

          source_type:
            contentType.includes("pdf")
              ? "OCR_SCANNED_PDF"
              : "OCR_IMAGE",

          extracted_text:
            result.extracted_text,

          extracted_payload: {
            provider: result.provider,
            model_id: result.model_id,
            api_version: result.api_version,

            generic_fields:
              result.generic_fields,

            tables:
              result.tables,

            pages:
              result.pages
          },

          confidence_payload: {
            overall: overallConfidence
          },

          missing_fields: [],

          warnings:
            result.warnings
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "UNKNOWN_AZURE_ERROR";

        console.error(
          "[ocr-service] Azure analysis failed; using Tesseract fallback:",
          message
        );

        warnings.push(
          "AZURE_DOCUMENT_INTELLIGENCE_FAILED"
        );
      }
    }

    let sourceType:
      OcrExtractResponse["source_type"] =
        "MANUAL_MERGE";

    let pages: OcrPageResult[] = [];

    if (contentType.includes("pdf")) {
      pages =
        await this.pdfTextProvider.extractFromPdf(
          fileBuffer
        );

      if (pages.length > 0) {
        sourceType = "PDF_TEXT";
      } else {
        pages =
          await this.fallbackOcrProvider.extractFromPdf(
            fileBuffer
          );

        sourceType =
          pages.length > 0
            ? "OCR_SCANNED_PDF"
            : "UNREADABLE_PDF";
      }
    } else if (contentType.startsWith("image/")) {
      pages =
        await this.fallbackOcrProvider.extractFromImage(
          fileBuffer
        );

      sourceType =
        pages.length > 0
          ? "OCR_IMAGE"
          : "MANUAL_MERGE";
    } else {
      warnings.push(
        "UNSUPPORTED_CONTENT_TYPE"
      );
    }

    const extractedText = joinPages(pages);

    if (!extractedText.trim()) {
      return {
        status: "FAILED",
        source_type: sourceType,
        extracted_text: "",

        extracted_payload: {
          provider: "TESSERACT",
          document_type: "NO_FILE"
        },

        confidence_payload: {
          overall: 0
        },

        missing_fields: [
          "file_upload"
        ],

        warnings: [
          ...warnings,
          "NO_TEXT_EXTRACTED"
        ]
      };
    }

    const parsed = parseSupplierDocument(
      extractedText,
      input.document_type_hint ?? null
    );

    return {
      status:
        parsed.missingFields.length > 0
          ? "PARTIAL"
          : "SUCCEEDED",

      source_type: sourceType,
      extracted_text: extractedText,

      extracted_payload: {
        provider: "TESSERACT",
        ...parsed.extractedPayload
      },

      confidence_payload:
        parsed.confidencePayload,

      missing_fields:
        parsed.missingFields,

      warnings: [
        ...warnings,
        ...parsed.warnings
      ]
    };
  }
}