import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiJson } from "../../lib/apiClient";

type SupplierDeclaredPayload = Record<string, string | null>;

type AdminSupplierFileRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  document_type: string | null;
  declared_document_number: string | null;
  declared_expiry_date: string | null;
  declared_payload: SupplierDeclaredPayload;
  notes: string | null;
  created_at: string;
};

type AdminSupplierExtractionRecord = {
  id: string;
  supplier_id: string;
  tenant_id: string;
  source_file_id: string | null;
  source_type: string;
  extracted_text: string | null;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, unknown>;
  missing_fields: unknown[];
  warnings: unknown[];
  review_status: string;
  created_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

type FilesResponse = {
  status: string;
  count: number;
  files: AdminSupplierFileRecord[];
};

type ExtractionsResponse = {
  status: string;
  count: number;
  extractions: AdminSupplierExtractionRecord[];
};

type ExtractionRunResponse = {
  status: string;
  extraction: AdminSupplierExtractionRecord;
};

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "-";
  }
}

function getPayloadEntries(
  payload: Record<string, unknown> | SupplierDeclaredPayload | null | undefined
): Array<[string, string]> {
  if (!payload) return [];

  return Object.entries(payload)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => [key, displayValue(value)]);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatDocumentType(value: string | null | undefined): string {
  return value ?? "UNSPECIFIED";
}

export default function AdminSupplierDocumentsReviewPage() {
  const { supplierId } = useParams<{ supplierId: string }>();

  const [files, setFiles] = useState<AdminSupplierFileRecord[]>([]);
  const [extractions, setExtractions] = useState<AdminSupplierExtractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [extractingFileId, setExtractingFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    if (!supplierId) return;

    setLoading(true);
    setError(null);

    try {
      const [filesData, extractionsData] = await Promise.all([
        apiJson<FilesResponse>(
          "request",
          `/admin/supplier-documents/suppliers/${supplierId}/files`,
          { method: "GET" }
        ),
        apiJson<ExtractionsResponse>(
          "request",
          `/admin/supplier-documents/suppliers/${supplierId}/extractions`,
          { method: "GET" }
        )
      ]);

      setFiles(filesData.files);
      setExtractions(extractionsData.extractions);
    } catch (err: any) {
      setError(err?.message || "ADMIN_SUPPLIER_REVIEW_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [supplierId]);

  const latestExtractionByFileId = useMemo(() => {
    const map = new Map<string, AdminSupplierExtractionRecord>();

    for (const extraction of extractions) {
      if (!extraction.source_file_id) continue;
      if (!map.has(extraction.source_file_id)) {
        map.set(extraction.source_file_id, extraction);
      }
    }

    return map;
  }, [extractions]);

  async function runExtraction(fileId: string) {
    if (!supplierId) return;

    setExtractingFileId(fileId);
    setError(null);
    setSuccess(null);

    try {
      await apiJson<ExtractionRunResponse>(
        "request",
        `/admin/supplier-documents/suppliers/${supplierId}/files/${fileId}/extract`,
        { method: "POST" }
      );

      await load();
      setSuccess("Extraction completed successfully.");
    } catch (err: any) {
      setError(err?.message || "ADMIN_SUPPLIER_EXTRACTION_FAILED");
    } finally {
      setExtractingFileId(null);
    }
  }

  if (!supplierId) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            border: "1px solid #ef4444",
            background: "#fef2f2",
            color: "#991b1b",
            padding: 16,
            borderRadius: 12
          }}
        >
          No supplier id was provided in the route.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Supplier document review</h1>
          <p style={{ marginTop: 8, color: "#5f6b7a" }}>
            Review uploaded supplier documents, declared fields, and extraction
            results for supplier {supplierId}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "#111827",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div
          style={{
            border: "1px solid #ef4444",
            background: "#fef2f2",
            color: "#991b1b",
            padding: 16,
            borderRadius: 12
          }}
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          style={{
            border: "1px solid #22c55e",
            background: "#f0fdf4",
            color: "#166534",
            padding: 16,
            borderRadius: 12
          }}
        >
          {success}
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid #d9e0ea",
          borderRadius: 16,
          padding: 20,
          background: "#fff",
          display: "grid",
          gap: 16
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Uploaded supplier documents</h2>
          <p style={{ marginTop: 8, color: "#5f6b7a" }}>
            Each card shows declared values and the latest extraction result for
            that file.
          </p>
        </div>

        {loading ? (
          <div>Loading supplier documents...</div>
        ) : files.length === 0 ? (
          <div>No supplier documents uploaded yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {files.map((file) => {
              const latestExtraction = latestExtractionByFileId.get(file.id) ?? null;
              const declaredEntries = getPayloadEntries(file.declared_payload);
              const extractedEntries = getPayloadEntries(
                latestExtraction?.extracted_payload
              );
              const missingFields = readStringArray(latestExtraction?.missing_fields);
              const warnings = readStringArray(latestExtraction?.warnings);

              return (
                <div
                  key={file.id}
                  style={{
                    border: "1px solid #d9e0ea",
                    borderRadius: 16,
                    padding: 16,
                    display: "grid",
                    gap: 16,
                    background: "#fff"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      alignItems: "flex-start",
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {formatDocumentType(file.document_type)} — {file.file_name}
                      </div>

                      <div style={{ color: "#5f6b7a", display: "grid", gap: 4 }}>
                        <div>File ID: {file.id}</div>
                        <div>Content type: {file.content_type}</div>
                        <div>Size: {file.file_size_bytes} bytes</div>
                        <div>Uploaded at: {formatDateTime(file.created_at)}</div>
                        <div>
                          Declared document number:{" "}
                          {file.declared_document_number ?? "-"}
                        </div>
                        <div>
                          Declared expiry date: {file.declared_expiry_date ?? "-"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void runExtraction(file.id)}
                      disabled={extractingFileId === file.id}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: "#111827",
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      {extractingFileId === file.id
                        ? "Running extraction..."
                        : "Run extraction"}
                    </button>
                  </div>

                  {file.notes ? (
                    <div
                      style={{
                        border: "1px solid #e6ebf2",
                        borderRadius: 12,
                        padding: 12,
                        background: "#fafbfd"
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Notes</div>
                      <div>{file.notes}</div>
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 16
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #e6ebf2",
                        borderRadius: 12,
                        padding: 12,
                        background: "#fafbfd"
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 10 }}>
                        Declared payload
                      </div>

                      {declaredEntries.length === 0 ? (
                        <div style={{ color: "#5f6b7a" }}>No declared fields.</div>
                      ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                          {declaredEntries.map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}</strong>: {value}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        border: "1px solid #e6ebf2",
                        borderRadius: 12,
                        padding: 12,
                        background: "#fafbfd"
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 10 }}>
                        Latest extraction
                      </div>

                      {!latestExtraction ? (
                        <div style={{ color: "#5f6b7a" }}>
                          No extraction result yet.
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                          <div>
                            <strong>Source type</strong>:{" "}
                            {latestExtraction.source_type}
                          </div>
                          <div>
                            <strong>Review status</strong>:{" "}
                            {latestExtraction.review_status}
                          </div>
                          <div>
                            <strong>Created at</strong>:{" "}
                            {formatDateTime(latestExtraction.created_at)}
                          </div>

                          {extractedEntries.length > 0 ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              {extractedEntries.map(([key, value]) => (
                                <div key={key}>
                                  <strong>{key}</strong>: {value}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: "#5f6b7a" }}>
                              No extracted payload values.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {latestExtraction ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 16
                      }}
                    >
                      <div
                        style={{
                          border: "1px solid #e6ebf2",
                          borderRadius: 12,
                          padding: 12
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>
                          Missing fields
                        </div>

                        {missingFields.length === 0 ? (
                          <div style={{ color: "#5f6b7a" }}>
                            No missing fields reported.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {missingFields.map((field) => (
                              <span
                                key={field}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  background: "#fff4e5",
                                  border: "1px solid #f3d19c",
                                  fontSize: 13
                                }}
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          border: "1px solid #e6ebf2",
                          borderRadius: 12,
                          padding: 12
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>
                          Warnings
                        </div>

                        {warnings.length === 0 ? (
                          <div style={{ color: "#5f6b7a" }}>
                            No warnings reported.
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: 8 }}>
                            {warnings.map((warning, index) => (
                              <div
                                key={`${warning}-${index}`}
                                style={{
                                  padding: 10,
                                  borderRadius: 10,
                                  background: "#fff4e5",
                                  border: "1px solid #f3d19c"
                                }}
                              >
                                {warning}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {latestExtraction?.extracted_text ? (
                    <div
                      style={{
                        border: "1px solid #e6ebf2",
                        borderRadius: 12,
                        padding: 12
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 10 }}>
                        Extracted text preview
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          fontFamily: "inherit",
                          fontSize: 14,
                          lineHeight: 1.6,
                          maxHeight: 280,
                          overflow: "auto"
                        }}
                      >
                        {latestExtraction.extracted_text}
                      </pre>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}