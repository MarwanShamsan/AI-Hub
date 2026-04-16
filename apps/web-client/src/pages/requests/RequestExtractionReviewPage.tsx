import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import PageSection from "../../components/common/PageSection";
import { useI18n } from "../../i18n/useI18n";
import {
  requestClient,
  type RequestExtractionRecord
} from "../../services/request-client";
import {
  mapExtractionToCustomerView,
  type CustomerFacingProposedField
} from "../../features/requests/mapExtractionToCustomerView";

export default function RequestExtractionReviewPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const { t } = useI18n();

  const [extractions, setExtractions] = useState<RequestExtractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      if (!requestId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await requestClient.getRequestExtractions(requestId);

        if (!active) return;

        const items = result.extractions ?? [];
        setExtractions(items);

        const latest = items[0];
        if (latest) {
          const mapped = mapExtractionToCustomerView(latest);
          const nextValues: Record<string, string> = {};

          mapped.proposedRequest.forEach((field) => {
            nextValues[field.key] = field.value;
          });

          setEditableValues(nextValues);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || t("requests.review.failed"));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [requestId, t]);

  const latestExtraction = extractions[0] ?? null;
  const customerView = useMemo(
    () => (latestExtraction ? mapExtractionToCustomerView(latestExtraction) : null),
    [latestExtraction]
  );

  if (!requestId) {
    return <Navigate to="/app/requests" replace />;
  }

  return (
    <PageSection
      title={t("requests.review.title")}
      description={t("requests.review.description")}
    >
      <div className="request-review-page">
        <div className="request-review-topbar">
          <Link className="request-details-back-link" to={`/app/requests/${requestId}`}>
            {t("requests.review.backToDetails")}
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-loading">{t("requests.review.loading")}</div>
        ) : null}

        {error ? (
          <div className="dashboard-error">{error}</div>
        ) : null}

        {!loading && !error && !latestExtraction ? (
          <div className="dashboard-empty">{t("requests.review.empty")}</div>
        ) : null}

        {!loading && !error && customerView ? (
          <>
            <section className="request-review-card">
              <h3 className="request-review-card-title">{t("requests.review.summaryTitle")}</h3>
              <div className="request-review-grid">
                {customerView.summary.map((field) => (
                  <ReviewFieldCard
                    key={field.label}
                    label={field.label}
                    value={field.value}
                  />
                ))}
              </div>
            </section>

            {customerView.sections.map((section) => (
              <section key={section.title} className="request-review-card">
                <h3 className="request-review-card-title">{section.title}</h3>
                <div className="request-review-section-list">
                  {section.fields.map((field) => (
                    <ReviewRow
                      key={`${section.title}-${field.label}`}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>
              </section>
            ))}

            <section className="request-review-card">
              <h3 className="request-review-card-title">
                {t("requests.review.proposedRequestTitle")}
              </h3>

              <div className="request-review-form">
                {customerView.proposedRequest.map((field) => (
                  <EditableField
                    key={field.key}
                    field={field}
                    value={editableValues[field.key] ?? ""}
                    onChange={(value) =>
                      setEditableValues((prev) => ({
                        ...prev,
                        [field.key]: value
                      }))
                    }
                  />
                ))}
              </div>
            </section>

            <div className="request-review-two-col">
              <section className="request-review-card">
                <h3 className="request-review-card-title">
                  {t("requests.review.missingFieldsTitle")}
                </h3>

                {customerView.missingFields.length === 0 ? (
                  <div className="request-review-empty-note">
                    {t("requests.review.noMissingFields")}
                  </div>
                ) : (
                  <ul className="request-review-list">
                    {customerView.missingFields.map((item) => (
                      <li key={item}>{prettifyMissingField(item)}</li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="request-review-card">
                <h3 className="request-review-card-title">
                  {t("requests.review.warningsTitle")}
                </h3>

                {customerView.warnings.length === 0 ? (
                  <div className="request-review-empty-note">
                    {t("requests.review.noWarnings")}
                  </div>
                ) : (
                  <ul className="request-review-list">
                    {customerView.warnings.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="request-review-card">
              <h3 className="request-review-card-title">
                {t("requests.review.nextStepTitle")}
              </h3>
              <p className="request-review-note">
                {t("requests.review.nextStepDescription")}
              </p>
            </section>
          </>
        ) : null}
      </div>
    </PageSection>
  );
}

function ReviewFieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="request-review-field-card">
      <div className="request-review-field-label">{label}</div>
      <div className="request-review-field-value">{value}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="request-review-row">
      <span className="request-review-row-label">{label}</span>
      <span className="request-review-row-value">{value}</span>
    </div>
  );
}

function EditableField({
  field,
  value,
  onChange
}: {
  field: CustomerFacingProposedField;
  value: string;
  onChange: (value: string) => void;
}) {
  const multiline =
    field.key === "request_brief" || field.key === "packaging_requirements";

  return (
    <div className="request-review-editable">
      <label className="request-review-editable-label">{field.label}</label>
      {multiline ? (
        <textarea
          className="textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function prettifyMissingField(key: string): string {
  const map: Record<string, string> = {
    destination_country: "الدولة المستهدفة",
    quantity_value: "الكمية",
    quantity_unit: "وحدة الكمية",
    shipping_preference: "تفضيل الشحن",
    budget_range: "نطاق الميزانية",
    target_delivery_timeline: "الجدول الزمني للتسليم"
  };

  return map[key] ?? key;
}