import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { queryClient } from "../../services/query-client";
import type { Deal } from "../../types/api";
import { useI18n } from "../../i18n/useI18n";

export default function DealsListPage() {
  const { t, locale } = useI18n();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await queryClient.getDeals();
        if (!active) return;
        setDeals(res.deals ?? []);
      } catch (e: any) {
        if (!active) return;
        setError(e.message || t("deals.list.failed"));
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

  const statuses = useMemo(() => {
    const values = Array.from(new Set(deals.map((d) => d.status))).sort();
    return ["ALL", ...values];
  }, [deals]);

  const filteredDeals = useMemo(() => {
    if (statusFilter === "ALL") return deals;
    return deals.filter((deal) => deal.status === statusFilter);
  }, [deals, statusFilter]);

  return (
    <div className="deals-page">
      <section className="deals-page-header">
        <div>
          <h1 className="deals-page-title">{t("deals.list.title")}</h1>
          <p className="deals-page-subtitle">{t("deals.list.subtitle")}</p>
        </div>

        <div className="deals-page-actions">
          <Link className="dashboard-link-button" to="/app">
            {t("layout.nav.dashboard")}
          </Link>
          <Link
            className="dashboard-link-button dashboard-link-button-primary"
            to="/app/requests/new"
          >
            {t("layout.nav.newRequest")}
          </Link>
        </div>
      </section>

      <section className="deals-filters-bar">
        <div className="deals-filter-group">
          <label htmlFor="deal-status-filter" className="deals-filter-label">
            {t("deals.list.statusFilter")}
          </label>

          <select
            id="deal-status-filter"
            className="deals-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? t("deals.list.all") : status}
              </option>
            ))}
          </select>
        </div>

        <div className="deals-filter-count">
          {filteredDeals.length}
        </div>
      </section>

      {loading && <div className="dashboard-loading">{t("deals.list.loading")}</div>}

      {error && <div className="dashboard-error">{error}</div>}

      {!loading && !error && filteredDeals.length === 0 && (
        <div className="dashboard-empty">{t("deals.list.empty")}</div>
      )}

      {!loading && !error && filteredDeals.length > 0 && (
        <section className="deals-grid">
          {filteredDeals.map((deal) => (
            <Link
              key={deal.deal_id}
              to={`/app/deals/${deal.deal_id}`}
              className="deal-card"
            >
              <div className="deal-card-header">
                <div className="deal-card-title">{deal.deal_title}</div>

                <span
                  className={`deal-badge ${
                    deal.deal_closed
                      ? "deal-badge-success"
                      : deal.dispute_open
                        ? "deal-badge-danger"
                        : "deal-badge-neutral"
                  }`}
                >
                  {deal.status}
                </span>
              </div>

              <div className="deal-card-body">
                <div className="deal-card-row">
                  <span className="deal-card-label">{t("deals.list.supplier")}</span>
                  <span className="deal-card-value">{deal.supplier_id || "—"}</span>
                </div>

                <div className="deal-card-row">
                  <span className="deal-card-label">{t("deals.list.currency")}</span>
                  <span className="deal-card-value">{deal.currency || "—"}</span>
                </div>

                <div className="deal-card-row">
                  <span className="deal-card-label">{t("deals.list.lastEvent")}</span>
                  <span className="deal-card-value">{deal.last_event_type || "—"}</span>
                </div>

                <div className="deal-card-row">
                  <span className="deal-card-label">{t("deals.list.updatedAt")}</span>
                  <span className="deal-card-value">
                    {formatDateTime(deal.updated_at, locale)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function formatDateTime(value: string | undefined, locale: "ar" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
}