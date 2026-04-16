import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { queryClient } from "../../services/query-client";
import type { Deal } from "../../types/api";
import { useI18n } from "../../i18n/useI18n";

export default function DashboardPage() {
  const { t, locale } = useI18n();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(e.message || t("dashboard.failed"));
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

  const stats = useMemo(
    () => ({
      total: deals.length,
      inTransit: deals.filter((d) => d.status === "IN_TRANSIT").length,
      disputed: deals.filter((d) => d.dispute_open).length,
      completed: deals.filter((d) => d.deal_closed).length
    }),
    [deals]
  );

  const recentDeals = deals.slice(0, 5);

  return (
    <div className="dashboard-page">
      <section className="dashboard-topbar">
        <div className="dashboard-topbar-main">
          <h1 className="dashboard-title">{t("dashboard.title")}</h1>
          <p className="dashboard-subtitle">{t("dashboard.subtitle")}</p>
        </div>

        <div className="dashboard-topbar-actions">
          <Link className="dashboard-link-button dashboard-link-button-primary" to="/app/requests/new">
            {t("layout.nav.newRequest")}
          </Link>
          <Link className="dashboard-link-button" to="/app/deals">
            {t("dashboard.viewAllDeals")}
          </Link>
        </div>
      </section>

      {loading && <div className="dashboard-loading">{t("dashboard.loading")}</div>}
      {error && <div className="dashboard-error">{error}</div>}

      {!loading && !error && (
        <>
          <section className="dashboard-kpis">
            <Stat
              label={t("dashboard.totalDeals")}
              value={stats.total}
              accentClass="kpi-accent-total"
            />
            <Stat
              label={t("dashboard.inTransit")}
              value={stats.inTransit}
              accentClass="kpi-accent-transit"
            />
            <Stat
              label={t("dashboard.disputed")}
              value={stats.disputed}
              accentClass="kpi-accent-disputed"
            />
            <Stat
              label={t("dashboard.completed")}
              value={stats.completed}
              accentClass="kpi-accent-completed"
            />
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2 className="dashboard-panel-title">{t("dashboard.recentDeals")}</h2>
                  <p className="dashboard-panel-subtitle">
                    {recentDeals.length > 0
                      ? `${recentDeals.length} / 5`
                      : t("dashboard.noDeals")}
                  </p>
                </div>

                <Link className="dashboard-panel-link" to="/app/deals">
                  {t("dashboard.viewAllDeals")}
                </Link>
              </div>

              {recentDeals.length === 0 ? (
                <div className="dashboard-empty">{t("dashboard.noDeals")}</div>
              ) : (
                <div className="deal-list">
                  {recentDeals.map((deal) => (
                    <Link
                      key={deal.deal_id}
                      to={`/app/deals/${deal.deal_id}`}
                      className="deal-row"
                    >
                      <div className="deal-row-header">
                        <div className="deal-row-title">{deal.deal_title}</div>

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

                      <div className="deal-row-meta">
                        <span>
                          {t("dashboard.lastEvent")}: {deal.last_event_type}
                        </span>
                        <span>
                          {t("dashboard.updatedAt")}:{" "}
                          {formatDateTime(deal.updated_at, locale)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-panel dashboard-panel-compact">
              <div className="dashboard-panel-header">
                <div>
                  <h2 className="dashboard-panel-title">{t("dashboard.quickActions")}</h2>
                  <p className="dashboard-panel-subtitle">
                    {t("dashboard.quickActionsSubtitle")}
                  </p>
                </div>
              </div>

              <div className="dashboard-quick-links">
                <Link to="/app/requests/new" className="quick-link-card">
                  <div className="quick-link-title">{t("layout.nav.newRequest")}</div>
                  <div className="quick-link-text">{t("requests.new.description")}</div>
                </Link>

                <Link to="/app/discovery" className="quick-link-card">
                  <div className="quick-link-title">{t("layout.nav.discovery")}</div>
                  <div className="quick-link-text">{t("discovery.description")}</div>
                </Link>

                <Link to="/app/disputes" className="quick-link-card">
                  <div className="quick-link-title">{t("layout.nav.disputes")}</div>
                  <div className="quick-link-text">{t("disputes.description")}</div>
                </Link>

                <Link to="/app/certificates" className="quick-link-card">
                  <div className="quick-link-title">{t("layout.nav.certificates")}</div>
                  <div className="quick-link-text">{t("certificates.description")}</div>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accentClass
}: {
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className={`kpi-card ${accentClass}`}>
      <p className="kpi-label">{label}</p>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function formatDateTime(value: string | undefined, locale: "ar" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
}