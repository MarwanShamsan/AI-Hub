import { ChangeEvent, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import PageSection from "../../components/common/PageSection";
import { useI18n } from "../../i18n/useI18n";
import {
  requestClient,
  type RequestExtractionRecord,
  type RequestFileRecord,
  type RequestRecord
} from "../../services/request-client";

export default function RequestDetailsPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const { t, locale } = useI18n();

  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [files, setFiles] = useState<RequestFileRecord[]>([]);
  const [extractions, setExtractions] = useState<RequestExtractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [extractionsLoading, setExtractionsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [extractionsError, setExtractionsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!requestId) {
        setError(t("requests.details.missingRequestId"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await requestClient.getRequest(requestId);

        if (!active) return;
        setRequest(result.request);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || t("requests.details.failed"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [requestId, t]);

  useEffect(() => {
    let active = true;

    async function loadFiles() {
      if (!requestId) {
        setFilesLoading(false);
        return;
      }

      try {
        setFilesLoading(true);
        setFilesError(null);

        const result = await requestClient.getRequestFiles(requestId);

        if (!active) return;
        setFiles(result.files ?? []);
      } catch (err: any) {
        if (!active) return;
        setFilesError(err?.message || t("requests.details.filesFailed"));
      } finally {
        if (active) {
          setFilesLoading(false);
        }
      }
    }

    void loadFiles();

    return () => {
      active = false;
    };
  }, [requestId, t]);

  useEffect(() => {
    let active = true;

    async function loadExtractions() {
      if (!requestId) {
        setExtractionsLoading(false);
        return;
      }

      try {
        setExtractionsLoading(true);
        setExtractionsError(null);

        const result = await requestClient.getRequestExtractions(requestId);

        if (!active) return;
        setExtractions(result.extractions ?? []);
      } catch (err: any) {
        if (!active) return;
        setExtractionsError(err?.message || t("requests.details.extractionsFailed"));
      } finally {
        if (active) {
          setExtractionsLoading(false);
        }
      }
    }

    void loadExtractions();

    return () => {
      active = false;
    };
  }, [requestId, t]);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !requestId) {
      return;
    }

    try {
      setUploading(true);
      setFilesError(null);

      const result = await requestClient.uploadRequestFile(requestId, file);

      setFiles((prev) => [result.file, ...prev]);
      event.target.value = "";
    } catch (err: any) {
      setFilesError(err?.message || t("requests.details.filesUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleRunExtraction() {
    if (!requestId) {
      return;
    }

    try {
      setExtracting(true);
      setExtractionsError(null);

      const result = await requestClient.runRequestExtraction(requestId);

      setExtractions((prev) => [result.extraction, ...prev]);
    } catch (err: any) {
      setExtractionsError(err?.message || t("requests.details.extractionsRunFailed"));
    } finally {
      setExtracting(false);
    }
  }

  if (!requestId) {
    return <Navigate to="/app/requests" replace />;
  }

  const latestExtraction = extractions[0] ?? null;

  return (
    <PageSection
      title={t("requests.details.title")}
      description={t("requests.details.description")}
    >
      <div className="request-details-page">
        <div className="request-details-topbar">
          <Link className="request-details-back-link" to="/app/requests">
            {t("requests.details.backToRequests")}
          </Link>

          <Link className="button request-details-top-action" to="/app/requests/new">
            {t("requests.details.newRequest")}
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-loading">{t("requests.details.loading")}</div>
        ) : null}

        {error ? (
          <div className="dashboard-error">{error}</div>
        ) : null}

        {!loading && !error && !request ? (
          <div className="dashboard-empty">{t("requests.details.notFound")}</div>
        ) : null}

        {!loading && !error && request ? (
          <>
            <section className="request-details-hero">
              <div className="request-details-hero-main">
                <h2 className="request-details-title">
                  {request.confirmed_input.request_title}
                </h2>
                <p className="request-details-subtitle">
                  {request.confirmed_input.destination_country}
                </p>
              </div>

              <div className="request-details-status-card">
                <RequestDetailsRow
                  label={t("requests.details.requestId")}
                  value={request.request_id}
                />
                <RequestDetailsRow
                  label={t("requests.details.status")}
                  value={request.status}
                />
                <RequestDetailsRow
                  label={t("requests.details.updatedAt")}
                  value={formatDateTime(request.updated_at, locale)}
                />
              </div>
            </section>

            <section className="request-details-grid">
              <div className="request-details-card">
                <div className="request-details-card-header">
                  <h3 className="request-details-card-title">
                    {t("requests.details.confirmedInput")}
                  </h3>
                </div>

                <div className="request-details-summary">
                  <RequestDetailsRow
                    label={t("requests.details.requestTitle")}
                    value={request.confirmed_input.request_title}
                  />
                  <RequestDetailsRow
                    label={t("requests.details.destinationCountry")}
                    value={request.confirmed_input.destination_country}
                  />
                  <RequestDetailsRow
                    label={t("requests.details.quantity")}
                    value={`${request.confirmed_input.quantity_value} ${request.confirmed_input.quantity_unit}`}
                  />
                  <RequestDetailsRow
                    label={t("requests.details.requestBrief")}
                    value={request.confirmed_input.request_brief}
                  />

                  {request.confirmed_input.preferred_supplier_country ? (
                    <RequestDetailsRow
                      label={t("requests.details.preferredSupplierCountry")}
                      value={request.confirmed_input.preferred_supplier_country}
                    />
                  ) : null}

                  {request.confirmed_input.certifications_required ? (
                    <RequestDetailsRow
                      label={t("requests.details.certificationsRequired")}
                      value={request.confirmed_input.certifications_required}
                    />
                  ) : null}

                  {request.confirmed_input.packaging_requirements ? (
                    <RequestDetailsRow
                      label={t("requests.details.packagingRequirements")}
                      value={request.confirmed_input.packaging_requirements}
                    />
                  ) : null}

                  {request.confirmed_input.shipping_preference ? (
                    <RequestDetailsRow
                      label={t("requests.details.shippingPreference")}
                      value={request.confirmed_input.shipping_preference}
                    />
                  ) : null}

                  {request.confirmed_input.budget_range ? (
                    <RequestDetailsRow
                      label={t("requests.details.budgetRange")}
                      value={request.confirmed_input.budget_range}
                    />
                  ) : null}

                  {request.confirmed_input.target_delivery_timeline ? (
                    <RequestDetailsRow
                      label={t("requests.details.targetDeliveryTimeline")}
                      value={request.confirmed_input.target_delivery_timeline}
                    />
                  ) : null}
                </div>
              </div>

              <div className="request-details-card">
                <div className="request-details-card-header">
                  <h3 className="request-details-card-title">
                    {t("requests.details.filesTitle")}
                  </h3>
                </div>

                <div className="request-upload-box">
                  <label className="request-upload-label">
                    <span>{t("requests.details.uploadFile")}</span>
                    <input
                      className="request-upload-input"
                      type="file"
                      onChange={handleFileSelected}
                      disabled={uploading}
                    />
                  </label>

                  <p className="request-upload-help">
                    {uploading
                      ? t("requests.details.uploading")
                      : t("requests.details.filesDescription")}
                  </p>
                </div>

                {filesError ? (
                  <div className="dashboard-error">{filesError}</div>
                ) : null}

                {filesLoading ? (
                  <div className="dashboard-loading">
                    {t("requests.details.filesLoading")}
                  </div>
                ) : null}

                {!filesLoading && files.length === 0 ? (
                  <div className="request-details-placeholder">
                    {t("requests.details.filesEmpty")}
                  </div>
                ) : null}

                {!filesLoading && files.length > 0 ? (
                  <div className="request-files-list">
                    {files.map((file) => (
                      <div key={file.id} className="request-file-card">
                        <div className="request-file-name">{file.file_name}</div>
                        <div className="request-file-meta">
                          <span>{file.content_type}</span>
                          <span>{formatFileSize(file.file_size_bytes)}</span>
                          <span>{formatDateTime(file.created_at, locale)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="request-details-card">
              <div className="request-details-card-header">
                <h3 className="request-details-card-title">
                  {t("requests.details.extractionsTitle")}
                </h3>

                <button
                  className="request-extract-button"
                  type="button"
                  onClick={handleRunExtraction}
                  disabled={extracting}
                >
                  {extracting
                    ? t("requests.details.extracting")
                    : t("requests.details.extractNow")}
                </button>
              </div>

              <p className="request-extraction-help">
                {t("requests.details.extractionsDescription")}
              </p>

              {extractionsError ? (
                <div className="dashboard-error">{extractionsError}</div>
              ) : null}

              {extractionsLoading ? (
                <div className="dashboard-loading">
                  {t("requests.details.extractionsLoading")}
                </div>
              ) : null}

              {!extractionsLoading && !latestExtraction ? (
                <div className="request-details-placeholder">
                  {t("requests.details.extractionsEmpty")}
                </div>
              ) : null}
                {/* here to view or delet the present of JESON file */}
              {!extractionsLoading && latestExtraction ? (
                <div className="request-extraction-result">
                    <div className="request-extraction-meta">
                    <span>
                        {t("requests.details.extractionSourceType")}:{" "}
                        {latestExtraction.source_type}
                    </span>
                    <span>
                        {t("requests.details.extractionStatus")}:{" "}
                        {latestExtraction.review_status}
                    </span>
                    <span>
                        {t("requests.details.extractionCreatedAt")}:{" "}
                        {formatDateTime(latestExtraction.created_at, locale)}
                    </span>
                    </div>

                    <div className="request-details-placeholder">
                    {t("requests.details.extractionReadyForReview")}
                    </div>

                    <div className="request-extraction-actions">
                    <Link
                        className="button request-extraction-review-button"
                        to={`/app/requests/${requestId}/review`}
                    >
                        {t("requests.details.reviewExtraction")}
                    </Link>
                    </div>
                </div>
                ) : null}
            </section>
          </>
        ) : null}
      </div>
    </PageSection>
  );
}

function RequestDetailsRow({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="request-details-row">
      <span className="request-details-label">{label}</span>
      <span className="request-details-value">{value}</span>
    </div>
  );
}

function formatDateTime(value: string, locale: "ar" | "en") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUnknown(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}