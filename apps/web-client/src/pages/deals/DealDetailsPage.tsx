import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { queryClient } from "../../services/query-client";
import type { Deal, Timer } from "../../types/api";
import { DealLifecycle } from "../../components/deals/DealLifecycle";
import { DealTimeline } from "../../components/deals/DealTimeline";
import { TimerCard } from "../../components/deals/TimerCard";
import { useI18n } from "../../i18n/useI18n";

export default function DealDetailsPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { t, locale } = useI18n();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [timer, setTimer] = useState<Timer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!dealId) {
        setError(t("deals.details.missingDealId"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const dealRes = await queryClient.getDeal(dealId);
        if (!active) return;
        setDeal(dealRes.deal);

        try {
          const timerRes = await queryClient.getTimer(dealId);
          if (!active) return;
          setTimer(timerRes.timer);
        } catch {
          if (!active) return;
          setTimer(null);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e.message || t("deals.details.failed"));
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
  }, [dealId, t]);

  if (loading) {
    return <div className="dashboard-loading">{t("deals.details.loading")}</div>;
  }

  if (error) {
    return (
      <div className="deal-details-page">
        <Link to="/app/deals" className="deal-details-back-link">
          {t("common.backToDeals")}
        </Link>
        <div className="dashboard-error">{error}</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="deal-details-page">
        <Link to="/app/deals" className="deal-details-back-link">
          {t("common.backToDeals")}
        </Link>
        <div className="dashboard-empty">{t("deals.details.notFound")}</div>
      </div>
    );
  }

  return (
    <div className="deal-details-page">
      <section className="deal-details-hero">
        <div className="deal-details-hero-main">
          <Link to="/app/deals" className="deal-details-back-link">
            {t("common.backToDeals")}
          </Link>

          <h1 className="deal-details-title">{deal.deal_title}</h1>
          <p className="deal-details-subtitle">
            {t("deals.details.lastEvent")}: {deal.last_event_type}
          </p>
        </div>

        <div className="deal-details-status-card">
          <div className="deal-details-status-row">
            <span className="deal-details-status-label">
              {t("deals.details.status")}
            </span>

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

          <div className="deal-details-meta">
            <div>
              <span className="deal-details-meta-label">
                {t("deals.details.lastEventAt")}
              </span>
              <span className="deal-details-meta-value">
                {formatDateTime(deal.last_event_at, locale)}
              </span>
            </div>

            <div>
              <span className="deal-details-meta-label">
                {t("deals.details.updatedAt")}
              </span>
              <span className="deal-details-meta-value">
                {formatDateTime(deal.updated_at, locale)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="deal-details-panel">
        <div className="deal-details-panel-header">
          <h2 className="deal-details-panel-title">
            {t("deals.details.lifecycle")}
          </h2>
        </div>
        <DealLifecycle deal={deal} />
      </section>

      <section className="deal-details-grid">
        <div className="deal-details-panel">
          <div className="deal-details-panel-header">
            <h2 className="deal-details-panel-title">
              {t("deals.details.summary")}
            </h2>
          </div>

          <div className="deal-summary-list">
            <SummaryRow label={t("deals.details.dealId")} value={deal.deal_id} />
            <SummaryRow label={t("deals.details.buyerId")} value={deal.buyer_id} />
            <SummaryRow
              label={t("deals.details.supplierId")}
              value={deal.supplier_id}
            />
            <SummaryRow
              label={t("deals.details.currency")}
              value={deal.currency || "—"}
            />
            <SummaryRow
              label={t("deals.details.inspectionPassed")}
              value={toYesNo(deal.inspection_passed, t)}
            />
            <SummaryRow
              label={t("deals.details.shipmentVerified")}
              value={toYesNo(deal.shipment_verified, t)}
            />
            <SummaryRow
              label={t("deals.details.disputeOpen")}
              value={toYesNo(deal.dispute_open, t)}
            />
            <SummaryRow
              label={t("deals.details.dealClosed")}
              value={toYesNo(deal.deal_closed, t)}
            />
          </div>
        </div>

        <div className="deal-details-panel">
          <div className="deal-details-panel-header">
            <h2 className="deal-details-panel-title">
              {t("deals.details.tokens")}
            </h2>
          </div>

          <div className="deal-summary-list">
            <SummaryRow
              label={t("deals.details.tokenAIssued")}
              value={toYesNo(deal.token_a_issued, t)}
            />
            <SummaryRow
              label={t("deals.details.tokenBIssued")}
              value={toYesNo(deal.token_b_issued, t)}
            />
            <SummaryRow
              label={t("deals.details.tokenCIssued")}
              value={toYesNo(deal.token_c_issued, t)}
            />
          </div>
        </div>
      </section>

      <section className="deal-details-grid">
        <div className="deal-details-panel">
          <TimerCard timer={timer} />
        </div>

        <div className="deal-details-panel">
          <DealTimeline deal={deal} />
        </div>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="deal-summary-row">
      <span className="deal-summary-label">{label}</span>
      <span className="deal-summary-value">{value}</span>
    </div>
  );
}

function toYesNo(value: boolean, t: (key: string) => string) {
  return value ? t("common.yes") : t("common.no");
}

function formatDateTime(value: string | null | undefined, locale: "ar" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
}