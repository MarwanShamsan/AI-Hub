import type { Deal } from "../../types/api";
import { useI18n } from "../../i18n/useI18n";

export function DealLifecycle({ deal }: { deal: Deal }) {
  const { t } = useI18n();

  const steps = [
    { key: "created", label: t("deals.lifecycle.created"), active: true },
    {
      key: "inspection",
      label: t("deals.lifecycle.inspectionPassed"),
      active: deal.inspection_passed
    },
    {
      key: "tokenA",
      label: t("deals.lifecycle.tokenAIssued"),
      active: deal.token_a_issued
    },
    {
      key: "shipment",
      label: t("deals.lifecycle.shipmentVerified"),
      active: deal.shipment_verified
    },
    {
      key: "tokenB",
      label: t("deals.lifecycle.tokenBIssued"),
      active: deal.token_b_issued
    },
    {
      key: "timerStarted",
      label: t("deals.lifecycle.timerStarted"),
      active: deal.timer_started
    },
    {
      key: "timerExpired",
      label: t("deals.lifecycle.timerExpired"),
      active: deal.timer_expired
    },
    {
      key: "tokenC",
      label: t("deals.lifecycle.tokenCIssued"),
      active: deal.token_c_issued
    },
    {
      key: "closed",
      label: t("deals.lifecycle.dealClosed"),
      active: deal.deal_closed
    }
  ];

  return (
    <div className="deal-lifecycle">
      {steps.map((step, index) => (
        <div key={step.key} className="deal-lifecycle-item">
          <div
            className={`deal-lifecycle-node ${
              step.active
                ? "deal-lifecycle-node-active"
                : "deal-lifecycle-node-inactive"
            }`}
          >
            <span className="deal-lifecycle-index">{index + 1}</span>
          </div>

          <div className="deal-lifecycle-content">
            <div
              className={`deal-lifecycle-label ${
                step.active
                  ? "deal-lifecycle-label-active"
                  : "deal-lifecycle-label-inactive"
              }`}
            >
              {step.label}
            </div>

            <div className="deal-lifecycle-track">
              <div
                className={`deal-lifecycle-line ${
                  step.active
                    ? "deal-lifecycle-line-active"
                    : "deal-lifecycle-line-inactive"
                }`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}