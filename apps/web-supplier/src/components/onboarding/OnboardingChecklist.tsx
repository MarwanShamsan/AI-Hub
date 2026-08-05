import {
  SupplierFileRecord,
  SupplierProfileRecord,
  SupplierQualificationStatus
} from "../../types/supplier";
import {
  getMissingRequiredDocumentTypes,
  getProfileCompleteness
} from "../../lib/supplier-rules";
import { getSupplierStatusPresentation } from "../../lib/status";
import { StatusBadge } from "../common/StatusBadge";
import { useI18n } from "../../i18n";

type Props = {
  profile: SupplierProfileRecord | null;
  files: SupplierFileRecord[];
  qualificationStatus: SupplierQualificationStatus | null | undefined;
};

export function OnboardingChecklist({
  profile,
  files,
  qualificationStatus
}: Props) {
  const { t } = useI18n();

  const profileState = getProfileCompleteness(profile);
  const missingDocs = getMissingRequiredDocumentTypes(
    profile?.supplier_type,
    files
  );
  const statusView = getSupplierStatusPresentation(qualificationStatus);

  const steps = [
    {
      title: t("onboardingChecklist.accountCreatedTitle"),
      done: true,
      detail: t("onboardingChecklist.accountCreatedDetail")
    },
    {
      title: t("onboardingChecklist.completeProfileTitle"),
      done: profileState.complete,
      detail: profileState.complete
        ? t("onboardingChecklist.completeProfileDoneDetail")
        : t("onboardingChecklist.completeProfileMissingDetail", {
            fields: profileState.missingFields.join(", ")
          })
    },
    {
      title: t("onboardingChecklist.uploadDocumentsTitle"),
      done: missingDocs.length === 0,
      detail:
        missingDocs.length === 0
          ? t("onboardingChecklist.uploadDocumentsDoneDetail")
          : t("onboardingChecklist.uploadDocumentsMissingDetail", {
              documents: missingDocs
                .map((doc) => t(`documentType.${doc}`))
                .join(", ")
            })
    },
    {
      title: t("onboardingChecklist.reviewTitle"),
      done: qualificationStatus === "APPROVED_FOR_DISCOVERY",
      detail: t(statusView.descriptionKey)
    }
  ];

  return (
    <div className="deal-lifecycle">
      {steps.map((step, index) => (
        <div key={step.title} className="deal-lifecycle-item">
          <div
            className={
              step.done
                ? "deal-lifecycle-node deal-lifecycle-node-active"
                : "deal-lifecycle-node deal-lifecycle-node-inactive"
            }
          >
            <span className="deal-lifecycle-index">{index + 1}</span>
          </div>

          <div className="deal-lifecycle-content">
            <div
              className={
                step.done
                  ? "deal-lifecycle-label deal-lifecycle-label-active"
                  : "deal-lifecycle-label deal-lifecycle-label-inactive"
              }
            >
              {step.title}
            </div>

            <div className="muted">{step.detail}</div>

            {index === steps.length - 1 ? (
              <StatusBadge
                label={t(statusView.labelKey)}
                tone={statusView.tone}
              />
            ) : null}

            {index < steps.length - 1 ? (
              <div className="deal-lifecycle-track">
                <div
                  className={
                    step.done
                      ? "deal-lifecycle-line deal-lifecycle-line-active"
                      : "deal-lifecycle-line deal-lifecycle-line-inactive"
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}