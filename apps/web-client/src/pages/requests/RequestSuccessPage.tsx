import { Link, useLocation, Navigate } from "react-router-dom";
import PageSection from "../../components/common/PageSection";
import { useI18n } from "../../i18n/useI18n";
import type { RequestRecord } from "../../services/request-client";

type RequestSuccessState = {
  request?: RequestRecord;
};

export default function RequestSuccessPage() {
  const { t } = useI18n();
  const location = useLocation();
  const state = location.state as RequestSuccessState | null;
  const request = state?.request;

  if (!request) {
    return <Navigate to="/app/requests/new" replace />;
  }

  const confirmed = request.confirmed_input;

  return (
    <PageSection
      title={t("requests.success.title")}
      description={t("requests.success.savedDescription")}
    >
      <div className="request-success-page">
        <div className="request-success-card">
          <h3 className="request-success-card-title">
            {t("requests.success.summaryTitle")}
          </h3>

          <div className="request-success-summary">
            <SummaryRow
              label={t("requests.success.requestId")}
              value={request.request_id}
            />
            <SummaryRow
              label={t("requests.success.status")}
              value={request.status}
            />
            <SummaryRow
              label={t("requests.success.requestTitle")}
              value={confirmed.request_title}
            />
            <SummaryRow
              label={t("requests.success.destinationCountry")}
              value={confirmed.destination_country}
            />
            <SummaryRow
              label={t("requests.success.quantity")}
              value={`${confirmed.quantity_value} ${confirmed.quantity_unit}`}
            />
            <SummaryRow
              label={t("requests.success.requestBrief")}
              value={confirmed.request_brief}
            />

            {confirmed.preferred_supplier_country ? (
              <SummaryRow
                label={t("requests.success.preferredSupplierCountry")}
                value={confirmed.preferred_supplier_country}
              />
            ) : null}

            {confirmed.certifications_required ? (
              <SummaryRow
                label={t("requests.success.certificationsRequired")}
                value={confirmed.certifications_required}
              />
            ) : null}

            {confirmed.packaging_requirements ? (
              <SummaryRow
                label={t("requests.success.packagingRequirements")}
                value={confirmed.packaging_requirements}
              />
            ) : null}

            {confirmed.shipping_preference ? (
              <SummaryRow
                label={t("requests.success.shippingPreference")}
                value={confirmed.shipping_preference}
              />
            ) : null}

            {confirmed.budget_range ? (
              <SummaryRow
                label={t("requests.success.budgetRange")}
                value={confirmed.budget_range}
              />
            ) : null}

            {confirmed.target_delivery_timeline ? (
              <SummaryRow
                label={t("requests.success.targetDeliveryTimeline")}
                value={confirmed.target_delivery_timeline}
              />
            ) : null}
          </div>
        </div>

        <div className="request-success-actions">
          <Link className="button request-success-button" to="/app/requests">
            {t("requests.success.createAnother")}
          </Link>

          <Link className="button request-success-button" to="/app">
            {t("requests.success.backToDashboard")}
          </Link>
        </div>
      </div>
    </PageSection>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="request-success-row">
      <span className="request-success-label">{label}</span>
      <span className="request-success-value">{value}</span>
    </div>
  );
}