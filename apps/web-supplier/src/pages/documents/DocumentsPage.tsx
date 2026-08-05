import "./documents.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { EmptyState } from "../../components/common/EmptyState";
import { InfoBanner } from "../../components/common/InfoBanner";
import { PageHero } from "../../components/common/PageHero";
import { SectionCard } from "../../components/common/SectionCard";
import { SupplierDocumentReview } from "../../components/documents/SupplierDocumentReview";
import { useI18n } from "../../i18n";

import {
  getMissingRequiredDocumentTypes,
  getRequiredDocumentsBySupplierType,
  type RequiredDocumentRule
} from "../../lib/supplier-rules";

import { supplierClient } from "../../services/supplier-client";

import {
  SupplierDocumentReviewRecord,
  SupplierDocumentType,
  SupplierProfileRecord
} from "../../types/supplier";

const optionalDocumentOptions: SupplierDocumentType[] = [
  "TAX_REGISTRATION",
  "EXPORT_LICENSE",
  "DISTRIBUTION_AUTHORIZATION",
  "QUALITY_CERTIFICATE",
  "FACTORY_PROFILE",
  "OTHER"
];

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const ACCEPTED_FILES =
  ".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.bmp,.heic,.heif";

type UploadErrors = {
  documentType?: string;
  file?: string;
};

function shortHash(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export default function DocumentsPage() {
  const { t, dir } = useI18n();

  const [profile, setProfile] =
    useState<SupplierProfileRecord | null>(null);

  const [reviews, setReviews] =
    useState<SupplierDocumentReviewRecord[]>([]);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [documentType, setDocumentType] =
    useState<SupplierDocumentType>(
      "QUALITY_CERTIFICATE"
    );

  const [
    optionalIssuingCountry,
    setOptionalIssuingCountry
  ] = useState("");

  const [optionalNotes, setOptionalNotes] =
    useState("");

  const [requiredCountries, setRequiredCountries] =
    useState<
      Partial<
        Record<
          SupplierDocumentType,
          string
        >
      >
    >({});

  const [requiredNotes, setRequiredNotes] =
    useState<
      Partial<
        Record<
          SupplierDocumentType,
          string
        >
      >
    >({});

  const [
    uploadingOptional,
    setUploadingOptional
  ] = useState(false);

  const [
    inlineUploadingType,
    setInlineUploadingType
  ] =
    useState<SupplierDocumentType | null>(
      null
    );

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [uploadErrors, setUploadErrors] =
    useState<UploadErrors>({});

  const inlineFileInputsRef = useRef<
    Partial<
      Record<
        SupplierDocumentType,
        HTMLInputElement | null
      >
    >
  >({});

  const optionalFileInputRef =
    useRef<HTMLInputElement | null>(null);

  const refreshPage =
    useCallback(async (): Promise<void> => {
      const [
        qualificationData,
        reviewData
      ] = await Promise.all([
        supplierClient.getQualification(),
        supplierClient.getDocumentReviews()
      ]);

      setProfile(
        qualificationData.profile
      );

      setReviews(
        reviewData.documents
      );

      setOptionalIssuingCountry(
        (currentValue) =>
          currentValue ||
          qualificationData.profile
            ?.registration_country ||
          ""
      );
    }, []);

  useEffect(() => {
    void refreshPage().catch(
      (loadError: unknown) => {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "DOCUMENTS_LOAD_FAILED";

        setError(message);
      }
    );
  }, [refreshPage]);

  const files = useMemo(
    () =>
      reviews.map(
        (review) => review.file
      ),
    [reviews]
  );

  const requiredRules = useMemo(
    () =>
      getRequiredDocumentsBySupplierType(
        profile?.supplier_type
      ),
    [profile?.supplier_type]
  );

  const requiredTypes = useMemo(
    () =>
      requiredRules.map(
        (rule) => rule.type
      ),
    [requiredRules]
  );

  const optionalOnlyOptions =
    useMemo(
      () =>
        optionalDocumentOptions.filter(
          (option) =>
            !requiredTypes.includes(
              option
            )
        ),
      [requiredTypes]
    );

  useEffect(() => {
    if (
      optionalOnlyOptions.length === 0
    ) {
      return;
    }

    if (
      !optionalOnlyOptions.includes(
        documentType
      )
    ) {
      setDocumentType(
        optionalOnlyOptions[0]
      );
    }
  }, [
    documentType,
    optionalOnlyOptions
  ]);

  const currentReviewByType =
    useMemo(() => {
      const map =
        new Map<
          SupplierDocumentType,
          SupplierDocumentReviewRecord
        >();

      for (const review of reviews) {
        const type =
          review.file.document_type;

        if (!type) {
          continue;
        }

        /*
         * Treat undefined as current for
         * backward compatibility with older
         * uploaded records.
         */
        if (
          review.file.is_current ===
          false
        ) {
          continue;
        }

        if (!map.has(type)) {
          map.set(type, review);
        }
      }

      return map;
    }, [reviews]);

  const optionalReviews =
    useMemo(
      () =>
        reviews.filter((review) => {
          if (
            review.file.is_current ===
            false
          ) {
            return false;
          }

          const type =
            review.file.document_type;

          return (
            !type ||
            !requiredTypes.includes(
              type
            )
          );
        }),
      [requiredTypes, reviews]
    );

  const missingRequiredDocs =
    useMemo(
      () =>
        getMissingRequiredDocumentTypes(
          profile?.supplier_type,
          files
        ),
      [
        profile?.supplier_type,
        files
      ]
    );

  function translateApiError(
    reason: unknown
  ): string {
    const code =
      typeof reason === "string" &&
      reason.trim()
        ? reason.trim()
        : "REQUEST_FAILED";

    const key =
      `documents.errorReason.${code}`;

    const translated = t(key);

    return translated === key
      ? code
      : translated;
  }

  function validateFile(
    file: File | null
  ): string | undefined {
    if (!file) {
      return t(
        "documents.validation.fileRequired"
      );
    }

    if (
      file.size > MAX_FILE_BYTES
    ) {
      return t(
        "documents.validation.fileTooLarge"
      );
    }

    return undefined;
  }

  function getRuleDescription(
    rule: RequiredDocumentRule
  ): string {
    const key =
      `documents.requirementDescription.${rule.type}`;

    const translated = t(key);

    return translated === key
      ? t(rule.descriptionKey)
      : translated;
  }

  async function uploadRequiredDocument(
    type: SupplierDocumentType,
    file: File,
    currentReview:
      | SupplierDocumentReviewRecord
      | null
  ): Promise<void> {
    const fileError =
      validateFile(file);

    if (fileError) {
      setError(fileError);
      return;
    }

    setError(null);
    setSuccess(null);
    setInlineUploadingType(type);

    try {
      const issuingCountry =
        (
          requiredCountries[type] ??
          profile?.registration_country ??
          ""
        ).trim();

      const notes =
        (
          requiredNotes[type] ??
          ""
        ).trim();

      const result =
        await supplierClient.uploadFile({
          file,
          document_type: type,

          issuing_country:
            issuingCountry ||
            undefined,

          supersedes_file_id:
            currentReview?.file.id,

          notes:
            notes || undefined
        });

      await refreshPage();

      setRequiredNotes(
        (current) => ({
          ...current,
          [type]: ""
        })
      );

      setSuccess(
        result.processing_error
          ? t(
              "documents.uploadedExtractionFailed"
            )
          : t(
              "documents.uploadedReviewRequired"
            )
      );
    } catch (uploadError: unknown) {
      setError(
        translateApiError(
          uploadError instanceof Error
            ? uploadError.message
            : uploadError
        )
      );
    } finally {
      setInlineUploadingType(null);

      const input =
        inlineFileInputsRef.current[
          type
        ];

      if (input) {
        input.value = "";
      }
    }
  }

  async function uploadOptionalDocument():
    Promise<void> {
    setError(null);
    setSuccess(null);

    const nextErrors: UploadErrors = {
      documentType:
        documentType
          ? undefined
          : t(
              "documents.validation.documentTypeRequired"
            ),

      file:
        validateFile(selectedFile)
    };

    const filteredErrors =
      Object.fromEntries(
        Object.entries(
          nextErrors
        ).filter(
          ([, value]) =>
            Boolean(value)
        )
      ) as UploadErrors;

    setUploadErrors(
      filteredErrors
    );

    if (
      Object.keys(
        filteredErrors
      ).length > 0 ||
      !selectedFile
    ) {
      return;
    }

    setUploadingOptional(true);

    try {
      const result =
        await supplierClient.uploadFile({
          file: selectedFile,
          document_type:
            documentType,

          issuing_country:
            optionalIssuingCountry
              .trim() ||
            undefined,

          notes:
            optionalNotes.trim() ||
            undefined
        });

      setSelectedFile(null);
      setOptionalNotes("");
      setUploadErrors({});

      if (
        optionalFileInputRef.current
      ) {
        optionalFileInputRef.current.value =
          "";
      }

      await refreshPage();

      setSuccess(
        result.processing_error
          ? t(
              "documents.uploadedExtractionFailed"
            )
          : t(
              "documents.uploadedReviewRequired"
            )
      );
    } catch (uploadError: unknown) {
      setError(
        translateApiError(
          uploadError instanceof Error
            ? uploadError.message
            : uploadError
        )
      );
    } finally {
      setUploadingOptional(false);
    }
  }

  return (
    <div
      className="supplier-documents-page"
      dir={dir}
    >
      <PageHero
        title={t(
          "documents.title"
        )}
        subtitle={t(
          "documents.subtitle"
        )}
      />

      <InfoBanner
        title={t(
          "documents.evidenceNoticeTitle"
        )}
        text={t(
          "documents.evidenceNoticeText"
        )}
        tone="warning"
      />

      {error ? (
        <InfoBanner
          title={t(
            "documents.actionFailed"
          )}
          text={error}
          tone="danger"
        />
      ) : null}

      {success ? (
        <InfoBanner
          title={t(
            "documents.successTitle"
          )}
          text={success}
          tone="success"
        />
      ) : null}

      {missingRequiredDocs.length >
      0 ? (
        <InfoBanner
          title={t(
            "documents.missingRequiredTitle"
          )}
          text={t(
            "documents.missingRequiredText"
          )}
          tone="warning"
        />
      ) : null}

      <SectionCard
        title={t(
          "documents.requiredTitle"
        )}
        subtitle={t(
          "documents.requiredSubtitle"
        )}
      >
        <div className="supplier-required-docs-list">
          {requiredRules.map(
            (rule) => {
              const currentReview =
                currentReviewByType.get(
                  rule.type
                ) ?? null;

              const previousReviews =
                reviews.filter(
                  (review) =>
                    review.file
                      .document_type ===
                      rule.type &&
                    review.file
                      .is_current ===
                      false
                );

              const isUploading =
                inlineUploadingType ===
                rule.type;

              const countryValue =
                requiredCountries[
                  rule.type
                ] ??
                currentReview?.file
                  .issuing_country ??
                profile
                  ?.registration_country ??
                "";

              return (
                <div
                  key={rule.type}
                  className="supplier-required-doc-card"
                >
                  <div className="supplier-required-doc-header">
                    <div className="supplier-required-doc-header-text">
                      <div className="supplier-required-doc-title">
                        {t(
                          `documentType.${rule.type}`
                        )}
                      </div>

                      <div className="supplier-required-doc-text">
                        {getRuleDescription(
                          rule
                        )}
                      </div>
                    </div>

                    <span
                      className={
                        currentReview
                          ? "deal-badge deal-badge-success"
                          : "deal-badge deal-badge-danger"
                      }
                    >
                      {currentReview
                        ? t(
                            `documents.reviewStatus.${currentReview.review_status}`
                          )
                        : t(
                            "documents.required"
                          )}
                    </span>
                  </div>

                  {currentReview ? (
                    <div className="supplier-required-doc-meta">
                      <span>
                        {t(
                          "documents.file"
                        )}
                        :{" "}
                        {
                          currentReview
                            .file
                            .file_name
                        }
                      </span>

                      <span>
                        {t(
                          "documents.issuingCountry"
                        )}
                        :{" "}
                        {currentReview
                          .file
                          .issuing_country ??
                          "-"}
                      </span>

                      <span>
                        SHA-256:{" "}
                        {shortHash(
                          currentReview
                            .file
                            .file_sha256
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="supplier-required-doc-missing">
                      {t(
                        "documents.notUploadedYet"
                      )}
                    </div>
                  )}

                  <div className="supplier-upload-grid-2">
                    <div className="supplier-upload-field">
                      <label className="supplier-upload-label">
                        {t(
                          "documents.issuingCountry"
                        )}
                      </label>

                      <input
                        className="input"
                        value={
                          countryValue
                        }
                        placeholder={t(
                          "documents.issuingCountryPlaceholder"
                        )}
                        onChange={(
                          event
                        ) =>
                          setRequiredCountries(
                            (
                              current
                            ) => ({
                              ...current,
                              [rule.type]:
                                event
                                  .target
                                  .value
                            })
                          )
                        }
                      />
                    </div>

                    <div className="supplier-upload-field">
                      <label className="supplier-upload-label">
                        {t(
                          "documents.notes"
                        )}
                      </label>

                      <input
                        className="input"
                        value={
                          requiredNotes[
                            rule.type
                          ] ?? ""
                        }
                        placeholder={t(
                          "documents.optionalNotesPlaceholder"
                        )}
                        onChange={(
                          event
                        ) =>
                          setRequiredNotes(
                            (
                              current
                            ) => ({
                              ...current,
                              [rule.type]:
                                event
                                  .target
                                  .value
                            })
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="supplier-required-doc-actions">
                    <button
                      type="button"
                      className="dashboard-link-button dashboard-link-button-primary supplier-required-upload-button"
                      disabled={
                        isUploading
                      }
                      onClick={() =>
                        inlineFileInputsRef
                          .current[
                          rule.type
                        ]?.click()
                      }
                    >
                      {isUploading
                        ? t(
                            "documents.uploading"
                          )
                        : currentReview
                          ? t(
                              "documents.uploadNewVersion"
                            )
                          : t(
                              "documents.upload"
                            )}
                    </button>

                    <input
                      ref={(node) => {
                        inlineFileInputsRef.current[
                          rule.type
                        ] = node;
                      }}
                      type="file"
                      accept={
                        ACCEPTED_FILES
                      }
                      hidden
                      onChange={(
                        event
                      ) => {
                        const file =
                          event
                            .target
                            .files?.[0] ??
                          null;

                        if (file) {
                          void uploadRequiredDocument(
                            rule.type,
                            file,
                            currentReview
                          );
                        }
                      }}
                    />
                  </div>

                  {currentReview ? (
                    <SupplierDocumentReview
                      review={
                        currentReview
                      }
                      onSubmitted={
                        refreshPage
                      }
                    />
                  ) : null}

                  {previousReviews.length >
                  0 ? (
                    <details className="supplier-previous-versions">
                      <summary>
                        {t(
                          "documents.previousVersions"
                        )}{" "}
                        (
                        {
                          previousReviews.length
                        }
                        )
                      </summary>

                      <div className="supplier-previous-version-list">
                        {previousReviews.map(
                          (
                            review
                          ) => (
                            <div
                              key={
                                review
                                  .file
                                  .id
                              }
                              className="supplier-previous-version-item"
                            >
                              <strong>
                                {
                                  review
                                    .file
                                    .file_name
                                }
                              </strong>

                              <span>
                                {new Date(
                                  review
                                    .file
                                    .created_at
                                ).toLocaleString()}
                              </span>

                              <span>
                                SHA-256:{" "}
                                {shortHash(
                                  review
                                    .file
                                    .file_sha256
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            }
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t(
          "documents.optionalTitle"
        )}
        subtitle={t(
          "documents.optionalListSubtitle"
        )}
      >
        <div className="supplier-upload-form">
          <div className="supplier-upload-grid-2">
            <div className="supplier-upload-field">
              <label className="supplier-upload-label">
                {t(
                  "documents.documentType"
                )}{" "}
                <span className="required-star">
                  *
                </span>
              </label>

              <select
                className={`input ${
                  uploadErrors.documentType
                    ? "input-invalid"
                    : ""
                }`}
                value={documentType}
                disabled={
                  optionalOnlyOptions.length ===
                  0
                }
                onChange={(
                  event
                ) => {
                  setDocumentType(
                    event.target
                      .value as SupplierDocumentType
                  );

                  setUploadErrors(
                    (current) => ({
                      ...current,
                      documentType:
                        undefined
                    })
                  );
                }}
              >
                {optionalOnlyOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {t(
                        `documentType.${option}`
                      )}
                    </option>
                  )
                )}
              </select>

              {uploadErrors.documentType ? (
                <p className="field-error-text">
                  {
                    uploadErrors.documentType
                  }
                </p>
              ) : null}
            </div>

            <div className="supplier-upload-field">
              <label className="supplier-upload-label">
                {t(
                  "documents.issuingCountry"
                )}
              </label>

              <input
                className="input"
                value={
                  optionalIssuingCountry
                }
                placeholder={t(
                  "documents.issuingCountryPlaceholder"
                )}
                onChange={(
                  event
                ) =>
                  setOptionalIssuingCountry(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="supplier-upload-grid-2">
            <div className="supplier-upload-field">
              <label className="supplier-upload-label">
                {t(
                  "documents.file"
                )}{" "}
                <span className="required-star">
                  *
                </span>
              </label>

              <div
                className={`request-upload-box ${
                  uploadErrors.file
                    ? "upload-box-invalid"
                    : ""
                }`}
              >
                <label className="request-upload-label">
                  {t(
                    "documents.selectFile"
                  )}

                  <input
                    ref={
                      optionalFileInputRef
                    }
                    className="request-upload-input"
                    type="file"
                    accept={
                      ACCEPTED_FILES
                    }
                    onChange={(
                      event
                    ) => {
                      setSelectedFile(
                        event.target
                          .files?.[0] ??
                          null
                      );

                      setUploadErrors(
                        (current) => ({
                          ...current,
                          file: undefined
                        })
                      );
                    }}
                  />
                </label>

                <p className="request-upload-help">
                  {selectedFile
                    ? t(
                        "documents.selectedFile",
                        {
                          file: selectedFile.name
                        }
                      )
                    : t(
                        "documents.chooseFileHelp"
                      )}
                </p>
              </div>

              {uploadErrors.file ? (
                <p className="field-error-text">
                  {uploadErrors.file}
                </p>
              ) : null}
            </div>

            <div className="supplier-upload-field">
              <label className="supplier-upload-label">
                {t(
                  "documents.notes"
                )}
              </label>

              <textarea
                className="textarea"
                value={optionalNotes}
                placeholder={t(
                  "documents.optionalNotesPlaceholder"
                )}
                onChange={(
                  event
                ) =>
                  setOptionalNotes(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="supplier-upload-actions">
            <button
              className="button supplier-upload-action"
              type="button"
              disabled={
                !selectedFile ||
                uploadingOptional ||
                optionalOnlyOptions.length ===
                  0
              }
              onClick={() =>
                void uploadOptionalDocument()
              }
            >
              {uploadingOptional
                ? t(
                    "documents.uploading"
                  )
                : t(
                    "documents.addOptionalDocument"
                  )}
            </button>
          </div>
        </div>

        {optionalReviews.length ===
        0 ? (
          <div className="supplier-empty-state-wrap">
            <EmptyState
              title={t(
                "documents.noOptionalDocsTitle"
              )}
              text={t(
                "documents.noOptionalDocsText"
              )}
            />
          </div>
        ) : (
          <div className="supplier-files-list">
            {optionalReviews.map(
              (review) => (
                <div
                  key={
                    review.file.id
                  }
                  className="supplier-file-card"
                >
                  <div className="supplier-file-title">
                    {review.file
                      .document_type
                      ? t(
                          `documentType.${review.file.document_type}`
                        )
                      : "UNSPECIFIED"}{" "}
                    —{" "}
                    {
                      review.file
                        .file_name
                    }
                  </div>

                  <div className="supplier-file-meta">
                    <span>
                      {
                        review.file
                          .content_type
                      }
                    </span>

                    <span>
                      {
                        review.file
                          .file_size_bytes
                      }{" "}
                      bytes
                    </span>

                    <span>
                      {t(
                        "documents.issuingCountry"
                      )}
                      :{" "}
                      {review.file
                        .issuing_country ??
                        "-"}
                    </span>

                    <span>
                      SHA-256:{" "}
                      {shortHash(
                        review.file
                          .file_sha256
                      )}
                    </span>
                  </div>

                  {review.file.notes ? (
                    <div className="supplier-file-notes">
                      {t(
                        "documents.notes"
                      )}
                      :{" "}
                      {
                        review.file
                          .notes
                      }
                    </div>
                  ) : null}

                  <SupplierDocumentReview
                    review={review}
                    onSubmitted={
                      refreshPage
                    }
                  />
                </div>
              )
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}