import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageSection from "../../components/common/PageSection";
import { useI18n } from "../../i18n/useI18n";
import { requestClient, type RequestRecord } from "../../services/request-client";

export default function RequestsListPage() {
  const { t, locale } = useI18n();

  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const result = await requestClient.getRequests();

        if (!active) return;
        setRequests(result.requests ?? []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || t("requests.list.failed"));
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
  }, [t]);

  return (
    <PageSection
      title={t("requests.list.title")}
      description={t("requests.list.description")}
    >
      <div className="requests-list-page">
        <div className="requests-list-actions">
          <Link className="button requests-list-primary-action" to="/app/requests/new">
            {t("requests.list.newRequest")}
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-loading">{t("requests.list.loading")}</div>
        ) : null}

        {error ? (
          <div className="dashboard-error">{error}</div>
        ) : null}

        {!loading && !error && requests.length === 0 ? (
          <div className="dashboard-empty">{t("requests.list.empty")}</div>
        ) : null}

        {!loading && !error && requests.length > 0 ? (
          <div className="requests-list-grid">
            {requests.map((request) => (
              <div key={request.request_id} className="request-list-card">
                <div className="request-list-card-header">
                  <div>
                    <h3 className="request-list-card-title">
                      {request.confirmed_input.request_title}
                    </h3>
                    <p className="request-list-card-subtitle">
                      {request.confirmed_input.destination_country}
                    </p>
                  </div>

                  <span className="request-list-status-badge">
                    {request.status}
                  </span>
                </div>

                <div className="request-list-card-body">
                  <RequestListRow
                    label={t("requests.list.requestId")}
                    value={request.request_id}
                  />
                  <RequestListRow
                    label={t("requests.list.quantity")}
                    value={`${request.confirmed_input.quantity_value} ${request.confirmed_input.quantity_unit}`}
                  />
                  <RequestListRow
                    label={t("requests.list.updatedAt")}
                    value={formatDateTime(request.updated_at, locale)}
                  />
                </div>

                <div className="request-list-card-actions">
                  <Link
                    className="request-list-link"
                    to={`/app/requests/${request.request_id}`}
                    >
                    {t("requests.list.viewDetails")}
                </Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}

function RequestListRow({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="request-list-row">
      <span className="request-list-label">{label}</span>
      <span className="request-list-value">{value}</span>
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