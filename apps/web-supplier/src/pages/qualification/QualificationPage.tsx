import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  EmptyState
} from "../../components/common/EmptyState";

import {
  InfoBanner
} from "../../components/common/InfoBanner";

import {
  KeyValueList
} from "../../components/common/KeyValueList";

import {
  PageHero
} from "../../components/common/PageHero";

import {
  SectionCard
} from "../../components/common/SectionCard";

import {
  StatusBadge
} from "../../components/common/StatusBadge";

import {
  useI18n
} from "../../i18n";

import {
  getQualificationDecisionLabel,
  getQualificationReasonCodeLabel,
  getQualificationReasonText
} from "../../lib/qualificationReason";

import {
  getMissingRequiredDocumentTypes,
  getProfileCompleteness
} from "../../lib/supplier-rules";

import {
  getSupplierStatusPresentation
} from "../../lib/status";

import {
  supplierClient
} from "../../services/supplier-client";

import {
  SupplierFileRecord,
  SupplierProfileRecord,
  SupplierQualificationReviewRecord,
  SupplierRecord
} from "../../types/supplier";

import "./qualification.css";

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

function formatDecisionDate(
  value: string | null | undefined,
  locale: "ar" | "en"
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

export default function QualificationPage() {
  const {
    t,
    locale
  } = useI18n();

  const [
    supplier,
    setSupplier
  ] =
    useState<SupplierRecord | null>(
      null
    );

  const [
    profile,
    setProfile
  ] =
    useState<SupplierProfileRecord | null>(
      null
    );

  const [
    files,
    setFiles
  ] =
    useState<SupplierFileRecord[]>(
      []
    );

  const [
    latestReview,
    setLatestReview
  ] =
    useState<SupplierQualificationReviewRecord | null>(
      null
    );

  const [
    error,
    setError
  ] =
    useState<string | null>(
      null
    );

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    evaluating,
    setEvaluating
  ] =
    useState(false);

  async function load():
    Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const [
        qualification,
        filesData
      ] = await Promise.all([
        supplierClient
          .getQualification(),

        supplierClient
          .getFiles()
      ]);

      setSupplier(
        qualification.supplier
      );

      setProfile(
        qualification.profile
      );

      setLatestReview(
        qualification.latest_review
      );

      setFiles(
        filesData.files
      );
    } catch (
      loadError: unknown
    ) {
      setError(
        getErrorMessage(
          loadError,
          "SUPPLIER_QUALIFICATION_LOAD_FAILED"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function evaluate():
    Promise<void> {
    setEvaluating(true);
    setError(null);

    try {
      await supplierClient
        .evaluateQualification();

      await load();
    } catch (
      evaluationError: unknown
    ) {
      setError(
        getErrorMessage(
          evaluationError,
          "SUPPLIER_QUALIFICATION_EVALUATION_FAILED"
        )
      );
    } finally {
      setEvaluating(false);
    }
  }

  const statusPresentation =
    getSupplierStatusPresentation(
      supplier
        ?.qualification_status
    );

  const profileState =
    getProfileCompleteness(
      profile
    );

  const missingDocs =
    getMissingRequiredDocumentTypes(
      profile?.supplier_type,
      files
    );

  const qualificationStatus =
    supplier
      ?.qualification_status ??
    null;

  const isApprovedForDiscovery =
    qualificationStatus ===
    "APPROVED_FOR_DISCOVERY";

  const isPendingReview =
    qualificationStatus ===
    "PENDING_REVIEW";

  const isRejected =
    qualificationStatus ===
    "REJECTED_PREDEAL";

  const canRunQualificationReview =
    profileState.complete &&
    missingDocs.length === 0 &&
    !isPendingReview &&
    !isApprovedForDiscovery;

  const supplierReasonText =
    supplier
      ?.last_decision_reason_code
      ? getQualificationReasonText(
          {
            reasonCode:
              supplier
                .last_decision_reason_code,

            reasonText:
              supplier
                .last_decision_reason_text,

            blockingIssues:
              latestReview
                ?.blocking_issues
          },
          t
        )
      : "-";

  const supplierReasonCode =
    getQualificationReasonCodeLabel(
      supplier
        ?.last_decision_reason_code,
      t
    );

  const latestReviewReasonText =
    latestReview
      ? getQualificationReasonText(
          {
            reasonCode:
              latestReview.reason_code,

            reasonText:
              latestReview.reason_text,

            blockingIssues:
              latestReview
                .blocking_issues
          },
          t
        )
      : "-";

  const latestReviewReasonCode =
    getQualificationReasonCodeLabel(
      latestReview
        ?.reason_code,
      t
    );

  const currentStatusLabel =
    getQualificationDecisionLabel(
      qualificationStatus,
      t
    );

  const latestDecisionLabel =
    getQualificationDecisionLabel(
      latestReview
        ?.decision_status,
      t
    );

  return (
    <div className="supplier-qualification-page">
      <PageHero
        title={t(
          "qualification.title"
        )}
        subtitle={t(
          "qualification.subtitle"
        )}
        actions={
          <>
            {canRunQualificationReview ? (
              <button
                type="button"
                className={[
                  "dashboard-link-button",
                  "dashboard-link-button-primary",
                  "supplier-qualification-action"
                ].join(" ")}
                onClick={() => {
                  void evaluate();
                }}
                disabled={
                  evaluating ||
                  loading
                }
              >
                {evaluating
                  ? t(
                      "qualification.evaluating"
                    )
                  : t(
                      "qualification.runReview"
                    )}
              </button>
            ) : null}

            <Link
              className={[
                "dashboard-link-button",
                "supplier-qualification-action"
              ].join(" ")}
              to="/app/documents"
            >
              {t(
                "qualification.openDocuments"
              )}
            </Link>
          </>
        }
      />

      {error ? (
        <InfoBanner
          title={t(
            "qualification.requestFailed"
          )}
          text={error}
          tone="danger"
        />
      ) : null}

      <div className="supplier-qualification-grid">
        <SectionCard
          title={t(
            "qualification.currentStatusTitle"
          )}
          subtitle={t(
            statusPresentation.descriptionKey
          )}
        >
          <div className="supplier-status-block">
            <StatusBadge
              label={t(
                statusPresentation.labelKey
              )}
              tone={
                statusPresentation.tone
              }
            />

            <KeyValueList
              items={[
                {
                  label: t(
                    "qualification.internalStatus"
                  ),
                  value:
                    currentStatusLabel
                },
                {
                  label: t(
                    "qualification.lastReasonCode"
                  ),
                  value:
                    supplierReasonCode
                },
                {
                  label: t(
                    "qualification.lastReasonText"
                  ),
                  value:
                    supplierReasonText
                },
                {
                  label: t(
                    "qualification.latestDecision"
                  ),
                  value:
                    latestDecisionLabel
                }
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard
          title={t(
            "qualification.latestReviewTitle"
          )}
          subtitle={t(
            "qualification.latestReviewSubtitle"
          )}
        >
          {!latestReview ? (
            <EmptyState
              title={t(
                "qualification.noReviewTitle"
              )}
              text={t(
                "qualification.noReviewText"
              )}
            />
          ) : (
            <KeyValueList
              items={[
                {
                  label: t(
                    "qualification.decision"
                  ),
                  value:
                    latestDecisionLabel
                },
                {
                  label: t(
                    "qualification.reasonCode"
                  ),
                  value:
                    latestReviewReasonCode
                },
                {
                  label: t(
                    "qualification.reasonText"
                  ),
                  value:
                    latestReviewReasonText
                },
                {
                  label: t(
                    "qualification.decidedAt"
                  ),
                  value:
                    formatDecisionDate(
                      latestReview
                        .decided_at,
                      locale
                    )
                }
              ]}
            />
          )}
        </SectionCard>
      </div>

      <div className="supplier-qualification-grid">
        <SectionCard
          title={t(
            "qualification.missingProfileTitle"
          )}
          subtitle={t(
            "qualification.missingProfileSubtitle"
          )}
        >
          {profileState
            .missingFields
            .length === 0 ? (
            <EmptyState
              title={t(
                "qualification.profileLooksCompleteTitle"
              )}
              text={t(
                "qualification.profileLooksCompleteText"
              )}
            />
          ) : (
            <ul className="supplier-review-list">
              {profileState
                .missingFields
                .map(
                  (field) => (
                    <li key={field}>
                      {t(
                        `qualificationProfileField.${field}`
                      )}
                    </li>
                  )
                )}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={t(
            "qualification.missingDocumentsTitle"
          )}
          subtitle={t(
            "qualification.missingDocumentsSubtitle"
          )}
        >
          {missingDocs.length === 0 ? (
            <EmptyState
              title={t(
                "qualification.requiredDocsUploadedTitle"
              )}
              text={t(
                "qualification.requiredDocsUploadedText"
              )}
            />
          ) : (
            <ul className="supplier-review-list">
              {missingDocs.map(
                (documentType) => (
                  <li key={documentType}>
                    {t(
                      `documentType.${documentType}`
                    )}
                  </li>
                )
              )}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={t(
          "qualification.nextActionTitle"
        )}
        subtitle={t(
          "qualification.nextActionSubtitle"
        )}
      >
        {!profileState.complete ? (
          <div className="supplier-next-actions">
            <Link
              className="supplier-next-action-card"
              to="/app/profile"
            >
              <div className="supplier-next-action-title">
                {t(
                  "qualification.completeCompanyProfile"
                )}
              </div>

              <div className="supplier-next-action-text">
                {t(
                  "qualification.completeCompanyProfileText"
                )}
              </div>
            </Link>
          </div>
        ) : missingDocs.length > 0 ? (
          <div className="supplier-next-actions">
            <Link
              className="supplier-next-action-card"
              to="/app/documents"
            >
              <div className="supplier-next-action-title">
                {t(
                  "qualification.uploadRequiredDocuments"
                )}
              </div>

              <div className="supplier-next-action-text">
                {t(
                  "qualification.uploadRequiredDocumentsText"
                )}
              </div>
            </Link>
          </div>
        ) : isApprovedForDiscovery ? (
          <div className="supplier-next-actions">
            <div className="supplier-next-action-card">
              <div className="supplier-next-action-title">
                {t(
                  "qualification.approvedNoActionTitle"
                )}
              </div>

              <div className="supplier-next-action-text">
                {t(
                  "qualification.approvedNoActionText"
                )}
              </div>
            </div>
          </div>
        ) : isPendingReview ? (
          <InfoBanner
            title={t(
              "qualification.pendingTitle"
            )}
            text={t(
              "qualification.pendingText"
            )}
            tone="info"
          />
        ) : isRejected ? (
          <div className="supplier-next-actions">
            <Link
              className="supplier-next-action-card"
              to="/app/documents"
            >
              <div className="supplier-next-action-title">
                {t(
                  "qualification.rejectedNextActionTitle"
                )}
              </div>

              <div className="supplier-next-action-text">
                {t(
                  "qualification.rejectedNextActionText"
                )}
              </div>
            </Link>

            <button
              type="button"
              className={[
                "dashboard-link-button",
                "dashboard-link-button-primary",
                "supplier-qualification-action"
              ].join(" ")}
              onClick={() => {
                void evaluate();
              }}
              disabled={
                evaluating ||
                loading
              }
            >
              {evaluating
                ? t(
                    "qualification.evaluating"
                  )
                : t(
                    "qualification.runReviewNow"
                  )}
            </button>
          </div>
        ) : (
          <div className="supplier-qualification-actions">
            <button
              type="button"
              className={[
                "dashboard-link-button",
                "dashboard-link-button-primary",
                "supplier-qualification-action"
              ].join(" ")}
              onClick={() => {
                void evaluate();
              }}
              disabled={
                evaluating ||
                loading
              }
            >
              {evaluating
                ? t(
                    "qualification.evaluating"
                  )
                : t(
                    "qualification.runReviewNow"
                  )}
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}