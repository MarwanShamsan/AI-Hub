type SupplierExtractionOutput = {
  source_type: "PDF_TEXT" | "PDF_OCR" | "IMAGE_OCR" | "MANUAL_MERGE" | "OCR_SCANNED_PDF" | "UNREADABLE_PDF";
  extracted_text: string | null;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, unknown>;
  missing_fields: string[];
  warnings: string[];
};

type OcrServiceAcceptedResponse = {
  status: "ACCEPTED";
  result: {
    status: "SUCCEEDED" | "FAILED" | "PARTIAL";
    source_type:
      | "PDF_TEXT"
      | "OCR_SCANNED_PDF"
      | "OCR_IMAGE"
      | "MANUAL_MERGE"
      | "UNREADABLE_PDF";
    extracted_text: string;
    extracted_payload: Record<string, unknown>;
    confidence_payload: Record<string, number>;
    missing_fields: string[];
    warnings: string[];
  };
};

export class SupplierExtractionService {
  private readonly ocrServiceBaseUrl: string;

  constructor() {
    this.ocrServiceBaseUrl =
      process.env.OCR_SERVICE_URL?.trim() || "http://localhost:3010";
  }

  async extractFromUploadedFile(input: {
    file_name: string;
    content_type: string;
    file_data: Buffer;
    document_type_hint?: string | null;
  }): Promise<SupplierExtractionOutput> {
    const response = await fetch(`${this.ocrServiceBaseUrl}/extract`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        file_name: input.file_name,
        content_type: input.content_type,
        file_data_base64: input.file_data.toString("base64"),
        document_type_hint: input.document_type_hint ?? null,
        language_hints: ["en", "ar"]
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `OCR_SERVICE_REQUEST_FAILED: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`
      );
    }

    const payload = (await response.json()) as OcrServiceAcceptedResponse;

    if (payload.status !== "ACCEPTED" || !payload.result) {
      throw new Error("OCR_SERVICE_INVALID_RESPONSE");
    }

    return {
      source_type: this.mapSourceType(payload.result.source_type),
      extracted_text: payload.result.extracted_text || null,
      extracted_payload: payload.result.extracted_payload ?? {},
      confidence_payload: payload.result.confidence_payload ?? {},
      missing_fields: Array.isArray(payload.result.missing_fields)
        ? payload.result.missing_fields.map(String)
        : [],
      warnings: Array.isArray(payload.result.warnings)
        ? payload.result.warnings.map(String)
        : []
    };
  }

  private mapSourceType(
    sourceType:
      | "PDF_TEXT"
      | "OCR_SCANNED_PDF"
      | "OCR_IMAGE"
      | "MANUAL_MERGE"
      | "UNREADABLE_PDF"
  ): SupplierExtractionOutput["source_type"] {
    switch (sourceType) {
      case "PDF_TEXT":
        return "PDF_TEXT";
      case "OCR_SCANNED_PDF":
        return "OCR_SCANNED_PDF";
      case "OCR_IMAGE":
        return "IMAGE_OCR";
      case "MANUAL_MERGE":
        return "MANUAL_MERGE";
      case "UNREADABLE_PDF":
        return "UNREADABLE_PDF";
      default:
        return "MANUAL_MERGE";
    }
  }
}