import { Link } from "react-router-dom";
import {
  SupplierFileRecord,
  SupplierProfileRecord,
  SupplierQualificationStatus
} from "../../types/supplier";
import {
  getMissingRequiredDocumentTypes,
  getProfileCompleteness
} from "../../lib/supplier-rules";
import { SectionCard } from "../common/SectionCard";
import { useI18n } from "../../i18n";

type Props = {
  profile: SupplierProfileRecord | null;
  files: SupplierFileRecord[];
  qualificationStatus: SupplierQualificationStatus | null | undefined;
};

export function NextActionCard({
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

  let title = t("nextAction.defaultTitle");
  let text = t("nextAction.defaultText");
  let href = "/app/profile";
  let cta = t("nextAction.defaultCta");

  if (!profileState.complete) {
    title = t("nextAction.completeProfileTitle");
    text = t("nextAction.completeProfileText");
    href = "/app/profile";
    cta = t("nextAction.completeProfileCta");
  } else if (missingDocs.length > 0) {
    title = t("nextAction.uploadDocumentsTitle");
    text = t("nextAction.uploadDocumentsText");
    href = "/app/documents";
    cta = t("nextAction.uploadDocumentsCta");
  } else if (
    qualificationStatus === "READY_FOR_REVIEW" ||
    qualificationStatus === "PENDING_REVIEW" ||
    qualificationStatus === "MISSING_REQUIREMENTS" ||
    qualificationStatus === "REJECTED_PREDEAL"
  ) {
    title = t("nextAction.reviewQualificationTitle");
    text = t("nextAction.reviewQualificationText");
    href = "/app/qualification";
    cta = t("nextAction.reviewQualificationCta");
  } else if (qualificationStatus === "APPROVED_FOR_DISCOVERY") {
    title = t("nextAction.qualifiedTitle");
    text = t("nextAction.qualifiedText");
    href = "/app/qualification";
    cta = t("nextAction.qualifiedCta");
  }

  return (
    <SectionCard title={title} subtitle={text}>
      <Link
        className="dashboard-link-button dashboard-link-button-primary"
        to={href}
      >
        {cta}
      </Link>
    </SectionCard>
  );
}