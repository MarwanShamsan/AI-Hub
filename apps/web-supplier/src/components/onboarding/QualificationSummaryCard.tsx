import {
  SupplierQualificationReviewRecord,
  SupplierRecord
} from "../../types/supplier";
import { getSupplierStatusPresentation } from "../../lib/status";
import { KeyValueList } from "../common/KeyValueList";
import { SectionCard } from "../common/SectionCard";
import { StatusBadge } from "../common/StatusBadge";
import { useI18n } from "../../i18n";

type Props = {
  supplier: SupplierRecord | null;
  latestReview: SupplierQualificationReviewRecord | null;
};

function formatLatestReviewDecision(
  latestReview: SupplierQualificationReviewRecord | null,
  t: (key: string) => string
): string {
  if (!latestReview?.decision_status) {
    return "-";
  }

  switch (latestReview.decision_status) {
    case "MISSING_REQUIREMENTS":
      return t("status.MISSING_REQUIREMENTS");
    case "APPROVED_FOR_DISCOVERY":
      return t("status.APPROVED_FOR_DISCOVERY");
    case "REJECTED_PREDEAL":
      return t("status.REJECTED_PREDEAL");
    default:
      return latestReview.decision_status;
  }
}

export function QualificationSummaryCard({
  supplier,
  latestReview
}: Props) {
  const { t } = useI18n();

  const presentation = getSupplierStatusPresentation(
    supplier?.qualification_status
  );

  return (
    <SectionCard
      title={t("qualificationSummary.title")}
      subtitle={t(presentation.descriptionKey)}
    >
      <div style={{ marginBottom: 16 }}>
        <StatusBadge
          label={t(presentation.labelKey)}
          tone={presentation.tone}
        />
      </div>

      <KeyValueList
        items={[
          {
            label: t("qualificationSummary.currentStatus"),
            value: supplier?.qualification_status
              ? t(`status.${supplier.qualification_status}`)
              : "-"
          },
          {
            label: t("qualificationSummary.lastReasonCode"),
            value: supplier?.last_decision_reason_code ?? "-"
          },
          {
            label: t("qualificationSummary.lastReasonText"),
            value: supplier?.last_decision_reason_text ?? "-"
          },
          {
            label: t("qualificationSummary.latestReviewDecision"),
            value: formatLatestReviewDecision(latestReview, t)
          }
        ]}
      />
    </SectionCard>
  );
}