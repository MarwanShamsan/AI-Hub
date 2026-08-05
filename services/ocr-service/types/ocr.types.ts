export type OcrSourceType =
  | "PDF_TEXT"
  | "OCR_SCANNED_PDF"
  | "OCR_IMAGE"
  | "MANUAL_MERGE"
  | "UNREADABLE_PDF";

export type OcrExtractRequest = {
  file_name: string;
  content_type: string;
  file_data_base64: string;
  document_type_hint?: string | null;
  language_hints?: string[];
};

export type OcrPageResult = {
  page_number: number;
  text: string;
  confidence?: number;
};

export type OcrExtractResponse = {
  status: "SUCCEEDED" | "FAILED" | "PARTIAL";
  source_type: OcrSourceType;
  extracted_text: string;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, number>;
  missing_fields: string[];
  warnings: string[];
};