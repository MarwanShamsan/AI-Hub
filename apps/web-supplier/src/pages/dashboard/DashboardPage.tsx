import "./dashboard.css";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHero } from "../../components/common/PageHero";
import { InfoBanner } from "../../components/common/InfoBanner";
import { SectionCard } from "../../components/common/SectionCard";
import { OnboardingChecklist } from "../../components/onboarding/OnboardingChecklist";
import { NextActionCard } from "../../components/onboarding/NextActionCard";
import { QualificationSummaryCard } from "../../components/onboarding/QualificationSummaryCard";
import { RequiredDocumentsCard } from "../../components/onboarding/RequiredDocumentsCard";
import { supplierClient } from "../../services/supplier-client";
import {
  SupplierFileRecord,
  SupplierProfileRecord,
  SupplierQualificationReviewRecord,
  SupplierRecord
} from "../../types/supplier";
import {
  getMissingRequiredDocumentTypes,
  getProfileCompleteness
} from "../../lib/supplier-rules";
import { getSupplierStatusPresentation } from "../../lib/status";
import { useI18n } from "../../i18n";

export default function DashboardPage() {
  const { t } = useI18n();

  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [profile, setProfile] = useState<SupplierProfileRecord | null>(null);
  const [files, setFiles] = useState<SupplierFileRecord[]>([]);
  const [latestReview, setLatestReview] =
    useState<SupplierQualificationReviewRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [qualification, filesData] = await Promise.all([
      supplierClient.getQualification(),
      supplierClient.getFiles()
    ]);

    setSupplier(qualification.supplier);
    setProfile(qualification.profile);
    setLatestReview(qualification.latest_review);
    setFiles(filesData.files);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message || "REQUEST_FAILED"));
  }, []);

  const statusPresentation = getSupplierStatusPresentation(
    supplier?.qualification_status
  );

  const profileCompleteness = useMemo(() => {
    return getProfileCompleteness(profile);
  }, [profile]);

  const missingDocs = useMemo(() => {
    return getMissingRequiredDocumentTypes(profile?.supplier_type, files);
  }, [profile?.supplier_type, files]);

  const needsProfileCompletion = profileCompleteness.missingFields.length > 0;
  const needsRequiredDocuments = missingDocs.length > 0;

  const qualificationStatus = supplier?.qualification_status ?? "DRAFT";

  const isReadyForReview = qualificationStatus === "READY_FOR_REVIEW";
  const isPendingReview = qualificationStatus === "PENDING_REVIEW";
  const isApproved = qualificationStatus === "APPROVED_FOR_DISCOVERY";
  const isMissingRequirements = qualificationStatus === "MISSING_REQUIREMENTS";
  const isRejected = qualificationStatus === "REJECTED_PREDEAL";

  const heroActions = (
    <>
      {needsProfileCompletion ? (
        <Link
          className="dashboard-link-button dashboard-link-button-primary"
          to="/app/profile"
        >
          {t("dashboard.completeProfile")}
        </Link>
      ) : null}

      {!needsProfileCompletion && needsRequiredDocuments ? (
        <Link
          className="dashboard-link-button dashboard-link-button-primary"
          to="/app/documents"
        >
          {t("dashboard.uploadDocuments")}
        </Link>
      ) : null}

      {!needsProfileCompletion && !needsRequiredDocuments ? (
        <Link
          className="dashboard-link-button dashboard-link-button-primary"
          to="/app/qualification"
        >
          {t("nextAction.reviewQualificationCta")}
        </Link>
      ) : null}

      <Link className="dashboard-link-button" to="/app/documents">
        {t("dashboard.uploadDocuments")}
      </Link>
    </>
  );

  return (
    <div className="supplier-dashboard-page">
      <PageHero
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={heroActions}
      />

      {error ? (
        <InfoBanner
          title={t("dashboard.loadErrorTitle")}
          text={error}
          tone="danger"
        />
      ) : null}

      {isReadyForReview ? (
        <InfoBanner
          title={t("status.READY_FOR_REVIEW")}
          text={t("statusDescription.READY_FOR_REVIEW")}
          tone="info"
        />
      ) : null}

      {isPendingReview ? (
        <InfoBanner
          title={t("status.PENDING_REVIEW")}
          text={t("statusDescription.PENDING_REVIEW")}
          tone="info"
        />
      ) : null}

      {isMissingRequirements ? (
        <InfoBanner
          title={t("status.MISSING_REQUIREMENTS")}
          text={t("statusDescription.MISSING_REQUIREMENTS")}
          tone="warning"
        />
      ) : null}

      {isApproved ? (
        <InfoBanner
          title={t("status.APPROVED_FOR_DISCOVERY")}
          text={t("statusDescription.APPROVED_FOR_DISCOVERY")}
          tone="success"
        />
      ) : null}

      {isRejected ? (
        <InfoBanner
          title={t("status.REJECTED_PREDEAL")}
          text={t("statusDescription.REJECTED_PREDEAL")}
          tone="danger"
        />
      ) : null}

      <div className="supplier-dashboard-kpis">
        <div className="supplier-kpi-card">
          <div className="supplier-kpi-label">
            {t("dashboard.currentStatus")}
          </div>
          <div className="supplier-kpi-value">
            {t(statusPresentation.labelKey)}
          </div>
        </div>

        <div className="supplier-kpi-card">
          <div className="supplier-kpi-label">
            {t("dashboard.supplierType")}
          </div>
          <div className="supplier-kpi-value">
            {profile?.supplier_type
              ? t(`supplierType.${profile.supplier_type}`)
              : "-"}
          </div>
        </div>

        <div className="supplier-kpi-card">
          <div className="supplier-kpi-label">
            {t("dashboard.missingProfileFields")}
          </div>
          <div className="supplier-kpi-value">
            {profileCompleteness.missingFields.length}
          </div>
        </div>

        <div className="supplier-kpi-card">
          <div className="supplier-kpi-label">
            {t("dashboard.missingRequiredDocuments")}
          </div>
          <div className="supplier-kpi-value">{missingDocs.length}</div>
        </div>
      </div>

      <div className="supplier-dashboard-grid">
        <SectionCard
          title={t("dashboard.onboardingChecklistTitle")}
          subtitle={t("dashboard.onboardingChecklistSubtitle")}
        >
          <OnboardingChecklist
            profile={profile}
            files={files}
            qualificationStatus={supplier?.qualification_status}
          />
        </SectionCard>

        <div className="supplier-dashboard-side">
          <NextActionCard
            profile={profile}
            files={files}
            qualificationStatus={supplier?.qualification_status}
          />

          <QualificationSummaryCard
            supplier={supplier}
            latestReview={latestReview}
          />
        </div>
      </div>

      <div className="supplier-dashboard-full">
        <RequiredDocumentsCard
          supplierType={profile?.supplier_type}
          files={files}
        />
      </div>
    </div>
  );
}