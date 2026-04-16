import type { Deal } from "../../types/api";
import { useI18n } from "../../i18n/useI18n";

export function DealTimeline({ deal }: { deal: Deal }) {
  const { t } = useI18n();

  const items = [
    { key: "DEAL_CREATED", label: t("deals.timeline.dealCreated"), show: true },
    {
      key: "INSPECTION_PASSED",
      label: t("deals.timeline.inspectionPassed"),
      show: deal.inspection_passed
    },
    {
      key: "TOKEN_A_ISSUED",
      label: t("deals.timeline.tokenAIssued"),
      show: deal.token_a_issued
    },
    {
      key: "SHIPMENT_VERIFIED",
      label: t("deals.timeline.shipmentVerified"),
      show: deal.shipment_verified
    },
    {
      key: "TOKEN_B_ISSUED",
      label: t("deals.timeline.tokenBIssued"),
      show: deal.token_b_issued
    },
    {
      key: "TIMER_STARTED",
      label: t("deals.timeline.timerStarted"),
      show: deal.timer_started
    },
    {
      key: "TIMER_EXPIRED",
      label: t("deals.timeline.timerExpired"),
      show: deal.timer_expired
    },
    {
      key: "DISPUTE_OPENED",
      label: t("deals.timeline.disputeOpened"),
      show: deal.dispute_open
    },
    {
      key: "TOKEN_C_ISSUED",
      label: t("deals.timeline.tokenCIssued"),
      show: deal.token_c_issued
    },
    {
      key: "DEAL_CLOSED",
      label: t("deals.timeline.dealClosed"),
      show: deal.deal_closed
    }
  ].filter((item) => item.show);

  return (
    <div className="deal-timeline">
      <div className="deal-timeline-header">
        <h3 className="deal-timeline-title">{t("deals.timeline.title")}</h3>
      </div>

      <div className="deal-timeline-list">
        {items.map((item, index) => (
          <div key={item.key} className="deal-timeline-item">
            <div className="deal-timeline-marker-wrap">
              <div className="deal-timeline-marker">{index + 1}</div>
              {index < items.length - 1 ? (
                <div className="deal-timeline-connector" />
              ) : null}
            </div>

            <div className="deal-timeline-card">
              <div className="deal-timeline-item-title">{item.label}</div>
              <div className="deal-timeline-item-code">{item.key}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}