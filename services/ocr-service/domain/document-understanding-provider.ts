export type DocumentBoundingRegion = {
  page_number: number;
  polygon: number[];
};

export type GenericDocumentField = {
  label: string;
  value: string | null;
  confidence: number | null;
  key_bounding_regions: DocumentBoundingRegion[];
  value_bounding_regions: DocumentBoundingRegion[];
};

export type GenericDocumentTableCell = {
  row_index: number;
  column_index: number;
  row_span: number;
  column_span: number;
  content: string;
  kind: string | null;
  bounding_regions: DocumentBoundingRegion[];
};

export type GenericDocumentTable = {
  row_count: number;
  column_count: number;
  cells: GenericDocumentTableCell[];
};

export type DocumentPageMetadata = {
  page_number: number;
  width: number | null;
  height: number | null;
  unit: string | null;
};

export type DocumentUnderstandingInput = {
  file_name: string;
  content_type: string;
  file_data: Buffer;
};

export type DocumentUnderstandingResult = {
  provider: "AZURE_DOCUMENT_INTELLIGENCE";
  model_id: string;
  api_version: string;
  extracted_text: string;
  generic_fields: GenericDocumentField[];
  tables: GenericDocumentTable[];
  pages: DocumentPageMetadata[];
  warnings: string[];
};

export interface DocumentUnderstandingProvider {
  isConfigured(): boolean;

  analyze(
    input: DocumentUnderstandingInput
  ): Promise<DocumentUnderstandingResult>;
}