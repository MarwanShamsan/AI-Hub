import sharp from "sharp";
import {
  DocumentBoundingRegion,
  DocumentUnderstandingInput,
  DocumentUnderstandingProvider,
  DocumentUnderstandingResult,
  GenericDocumentField,
  GenericDocumentTable
} from "../domain/document-understanding-provider";

type AzureBoundingRegion = {
  pageNumber?: number;
  polygon?: number[];
};

type AzureElement = {
  content?: string;
  confidence?: number;
  boundingRegions?: AzureBoundingRegion[];
};

type AzureKeyValuePair = {
  key?: AzureElement;
  value?: AzureElement | null;
  confidence?: number;
};

type AzureTableCell = {
  rowIndex?: number;
  columnIndex?: number;
  rowSpan?: number;
  columnSpan?: number;
  content?: string;
  kind?: string;
  boundingRegions?: AzureBoundingRegion[];
};

type AzureTable = {
  rowCount?: number;
  columnCount?: number;
  cells?: AzureTableCell[];
};

type AzurePage = {
  pageNumber?: number;
  width?: number;
  height?: number;
  unit?: string;
};

type AzureAnalyzeResult = {
  content?: string;
  pages?: AzurePage[];
  keyValuePairs?: AzureKeyValuePair[];
  tables?: AzureTable[];
};

type AzureOperationResponse = {
  status?: "notStarted" | "running" | "succeeded" | "failed";
  analyzeResult?: AzureAnalyzeResult;
  error?: {
    code?: string;
    message?: string;
  };
};

function removeTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function readPositiveInteger(
  variableName: string,
  fallback: number
): number {
  const value = process.env[variableName]?.trim();

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(1, Math.max(0, value));
}

function mapBoundingRegions(
  regions: AzureBoundingRegion[] | undefined
): DocumentBoundingRegion[] {
  if (!Array.isArray(regions)) {
    return [];
  }

  return regions.map((region) => ({
    page_number:
      typeof region.pageNumber === "number"
        ? region.pageNumber
        : 1,

    polygon: Array.isArray(region.polygon)
      ? region.polygon.filter(
          (coordinate): coordinate is number =>
            typeof coordinate === "number" &&
            Number.isFinite(coordinate)
        )
      : []
  }));
}

function mapFields(
  pairs: AzureKeyValuePair[] | undefined
): GenericDocumentField[] {
  if (!Array.isArray(pairs)) {
    return [];
  }

  const fields: GenericDocumentField[] = [];

  for (const pair of pairs) {
    const label = String(pair.key?.content ?? "").trim();

    if (!label) {
      continue;
    }

    const rawValue = pair.value?.content;
    const value =
      typeof rawValue === "string" && rawValue.trim()
        ? rawValue.trim()
        : null;

    fields.push({
      label,
      value,

      confidence: normalizeConfidence(
        pair.confidence ??
          pair.value?.confidence ??
          pair.key?.confidence
      ),

      key_bounding_regions: mapBoundingRegions(
        pair.key?.boundingRegions
      ),

      value_bounding_regions: mapBoundingRegions(
        pair.value?.boundingRegions
      )
    });
  }

  return fields;
}

function mapTables(
  tables: AzureTable[] | undefined
): GenericDocumentTable[] {
  if (!Array.isArray(tables)) {
    return [];
  }

  return tables.map((table) => ({
    row_count:
      typeof table.rowCount === "number"
        ? table.rowCount
        : 0,

    column_count:
      typeof table.columnCount === "number"
        ? table.columnCount
        : 0,

    cells: Array.isArray(table.cells)
      ? table.cells.map((cell) => ({
          row_index:
            typeof cell.rowIndex === "number"
              ? cell.rowIndex
              : 0,

          column_index:
            typeof cell.columnIndex === "number"
              ? cell.columnIndex
              : 0,

          row_span:
            typeof cell.rowSpan === "number"
              ? cell.rowSpan
              : 1,

          column_span:
            typeof cell.columnSpan === "number"
              ? cell.columnSpan
              : 1,

          content: String(cell.content ?? "").trim(),

          kind:
            typeof cell.kind === "string"
              ? cell.kind
              : null,

          bounding_regions: mapBoundingRegions(
            cell.boundingRegions
          )
        }))
      : []
  }));
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function readResponseText(
  response: globalThis.Response
): Promise<string> {
  return response.text().catch(() => "");
}

export class AzureDocumentIntelligenceProvider
  implements DocumentUnderstandingProvider
{
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly apiVersion: string;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor() {
    this.endpoint = removeTrailingSlashes(
      process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim() ??
        ""
    );

    this.apiKey =
      process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim() ??
      "";

    this.modelId =
      process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID?.trim() ||
      "prebuilt-layout";

    this.apiVersion =
      process.env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION?.trim() ||
      "2024-11-30";

    this.pollIntervalMs = readPositiveInteger(
      "AZURE_DOCUMENT_INTELLIGENCE_POLL_INTERVAL_MS",
      1000
    );

    this.timeoutMs = readPositiveInteger(
      "AZURE_DOCUMENT_INTELLIGENCE_TIMEOUT_MS",
      120000
    );
  }

  isConfigured(): boolean {
    return Boolean(this.endpoint && this.apiKey);
  }

  async analyze(
    input: DocumentUnderstandingInput
  ): Promise<DocumentUnderstandingResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "AZURE_DOCUMENT_INTELLIGENCE_NOT_CONFIGURED"
      );
    }

    if (!Buffer.isBuffer(input.file_data) || input.file_data.length === 0) {
      throw new Error("AZURE_DOCUMENT_BUFFER_EMPTY");
    }

    const preparedBytes = await this.prepareBytes(input);

    const operationLocation = await this.startAnalysis(
      preparedBytes
    );

    const result = await this.pollAnalysis(
      operationLocation
    );

    const fields = mapFields(result.keyValuePairs);
    const tables = mapTables(result.tables);

    const warnings: string[] = [];

    if (!String(result.content ?? "").trim()) {
      warnings.push("AZURE_NO_TEXT_EXTRACTED");
    }

    if (fields.length === 0) {
      warnings.push("AZURE_NO_KEY_VALUE_PAIRS_EXTRACTED");
    }

    return {
      provider: "AZURE_DOCUMENT_INTELLIGENCE",
      model_id: this.modelId,
      api_version: this.apiVersion,

      extracted_text: String(result.content ?? "").trim(),

      generic_fields: fields,
      tables,

      pages: Array.isArray(result.pages)
        ? result.pages.map((page, index) => ({
            page_number:
              typeof page.pageNumber === "number"
                ? page.pageNumber
                : index + 1,

            width:
              typeof page.width === "number"
                ? page.width
                : null,

            height:
              typeof page.height === "number"
                ? page.height
                : null,

            unit:
              typeof page.unit === "string"
                ? page.unit
                : null
          }))
        : [],

      warnings
    };
  }

  private async prepareBytes(
    input: DocumentUnderstandingInput
  ): Promise<Buffer> {
    const contentType = input.content_type
      .trim()
      .toLowerCase();

    // Azure Layout does not accept WebP directly.
    // This creates a temporary PNG while preserving
    // the original uploaded evidence unchanged.
    if (contentType === "image/webp") {
      return sharp(input.file_data, {
        failOn: "error"
      })
        .rotate()
        .png({
          compressionLevel: 6
        })
        .toBuffer();
    }

    return input.file_data;
  }

  private async startAnalysis(
    documentBytes: Buffer
  ): Promise<string> {
    const url = new URL(
      `${this.endpoint}/documentintelligence/documentModels/${encodeURIComponent(
        this.modelId
      )}:analyze`
    );

    url.searchParams.set(
      "_overload",
      "analyzeDocument"
    );

    url.searchParams.set(
      "api-version",
      this.apiVersion
    );

    url.searchParams.append(
      "features",
      "keyValuePairs"
    );

    url.searchParams.set(
      "stringIndexType",
      "utf16CodeUnit"
    );

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Ocp-Apim-Subscription-Key": this.apiKey,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        base64Source: documentBytes.toString("base64")
      })
    });

    if (response.status !== 202) {
      const responseText =
        await readResponseText(response);

      throw new Error(
        `AZURE_ANALYZE_REQUEST_FAILED:${response.status}:${
          responseText || response.statusText
        }`
      );
    }

    const operationLocation =
      response.headers.get("operation-location");

    if (!operationLocation) {
      throw new Error(
        "AZURE_OPERATION_LOCATION_MISSING"
      );
    }

    return operationLocation;
  }

  private async pollAnalysis(
    operationLocation: string
  ): Promise<AzureAnalyzeResult> {
    const deadline =
      Date.now() + this.timeoutMs;

    while (Date.now() < deadline) {
      await sleep(this.pollIntervalMs);

      const response = await fetch(
        operationLocation,
        {
          method: "GET",
          headers: {
            "Ocp-Apim-Subscription-Key":
              this.apiKey
          }
        }
      );

      if (!response.ok) {
        const responseText =
          await readResponseText(response);

        throw new Error(
          `AZURE_ANALYZE_POLL_FAILED:${response.status}:${
            responseText || response.statusText
          }`
        );
      }

      const payload =
        (await response.json()) as AzureOperationResponse;

      if (payload.status === "succeeded") {
        if (!payload.analyzeResult) {
          throw new Error(
            "AZURE_ANALYZE_RESULT_MISSING"
          );
        }

        return payload.analyzeResult;
      }

      if (payload.status === "failed") {
        throw new Error(
          `AZURE_ANALYZE_FAILED:${
            payload.error?.code ?? "UNKNOWN"
          }:${payload.error?.message ?? "UNKNOWN"}`
        );
      }
    }

    throw new Error("AZURE_ANALYZE_TIMEOUT");
  }
}