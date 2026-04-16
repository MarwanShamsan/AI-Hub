import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageSection from "../../components/common/PageSection";
import { RequestFormErrors, RequestFormValues } from "../../features/requests/types";
import {
  hasRequestFormErrors,
  validateRequestForm
} from "../../features/requests/validation";
import { useI18n } from "../../i18n/useI18n";
import { requestClient } from "../../services/request-client";

const INITIAL_VALUES: RequestFormValues = {
  requestTitle: "",
  destinationCountry: "",
  quantityValue: "",
  quantityUnit: "",
  requestBrief: "",
  preferredSupplierCountry: "",
  certificationsRequired: "",
  packagingRequirements: "",
  shippingPreference: "",
  budgetRange: "",
  targetDeliveryTimeline: ""
};

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [values, setValues] = useState<RequestFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  function updateField<K extends keyof RequestFormValues>(
    key: K,
    value: RequestFormValues[K]
  ) {
    setValues((prev) => ({
      ...prev,
      [key]: value
    }));

    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }

      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (submitError) {
      setSubmitError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateRequestForm(values);
    setErrors(nextErrors);

    if (hasRequestFormErrors(nextErrors)) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const result = await requestClient.createRequest(values);

      navigate("/app/requests/success", {
        state: {
          request: result.request
        }
      });
    } catch (error: any) {
      setSubmitError(error?.message || t("requests.new.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageSection
      title={t("requests.new.title")}
      description={t("requests.new.description")}
    >
      <form className="request-form" onSubmit={handleSubmit}>
        <section className="request-form-section">
          <div className="request-form-section-header">
            <h3 className="request-form-section-title">
              {t("requests.new.sectionBasic")}
            </h3>
            <p className="request-form-section-text">
              {t("requests.new.sectionBasicDescription")}
            </p>
          </div>

          <div className="stack-md">
            <div className="stack-sm">
              <input
                className="input"
                placeholder={t("requests.new.requestTitle")}
                value={values.requestTitle}
                onChange={(event) => updateField("requestTitle", event.target.value)}
              />
              {errors.requestTitle ? (
                <p className="error-text">{errors.requestTitle}</p>
              ) : null}
            </div>

            <div className="stack-sm">
              <input
                className="input"
                placeholder={t("requests.new.destinationCountry")}
                value={values.destinationCountry}
                onChange={(event) =>
                  updateField("destinationCountry", event.target.value)
                }
              />
              {errors.destinationCountry ? (
                <p className="error-text">{errors.destinationCountry}</p>
              ) : null}
            </div>

            <div className="request-form-grid-2">
              <div className="stack-sm">
                <input
                  className="input"
                  placeholder={t("requests.new.quantityValue")}
                  value={values.quantityValue}
                  onChange={(event) =>
                    updateField("quantityValue", event.target.value)
                  }
                />
                {errors.quantityValue ? (
                  <p className="error-text">{errors.quantityValue}</p>
                ) : null}
              </div>

              <div className="stack-sm">
                <input
                  className="input"
                  placeholder={t("requests.new.quantityUnit")}
                  value={values.quantityUnit}
                  onChange={(event) =>
                    updateField("quantityUnit", event.target.value)
                  }
                />
                {errors.quantityUnit ? (
                  <p className="error-text">{errors.quantityUnit}</p>
                ) : null}
              </div>
            </div>

            <div className="stack-sm">
              <textarea
                className="textarea"
                placeholder={t("requests.new.requestBrief")}
                value={values.requestBrief}
                onChange={(event) =>
                  updateField("requestBrief", event.target.value)
                }
              />
              {errors.requestBrief ? (
                <p className="error-text">{errors.requestBrief}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="request-form-section">
          <div className="request-form-more-header">
            <div>
              <h3 className="request-form-section-title">
                {t("requests.new.sectionMore")}
              </h3>
              <p className="request-form-section-text">
                {t("requests.new.sectionMoreDescription")}
              </p>
            </div>

            <button
              className="request-toggle-button"
              type="button"
              onClick={() => setShowMoreDetails((prev) => !prev)}
            >
              {showMoreDetails
                ? t("requests.new.hideMoreDetails")
                : t("requests.new.showMoreDetails")}
            </button>
          </div>

          {showMoreDetails ? (
            <div className="stack-md">
              <input
                className="input"
                placeholder={t("requests.new.preferredSupplierCountry")}
                value={values.preferredSupplierCountry}
                onChange={(event) =>
                  updateField("preferredSupplierCountry", event.target.value)
                }
              />

              <input
                className="input"
                placeholder={t("requests.new.certificationsRequired")}
                value={values.certificationsRequired}
                onChange={(event) =>
                  updateField("certificationsRequired", event.target.value)
                }
              />

              <input
                className="input"
                placeholder={t("requests.new.packagingRequirements")}
                value={values.packagingRequirements}
                onChange={(event) =>
                  updateField("packagingRequirements", event.target.value)
                }
              />

              <input
                className="input"
                placeholder={t("requests.new.shippingPreference")}
                value={values.shippingPreference}
                onChange={(event) =>
                  updateField("shippingPreference", event.target.value)
                }
              />

              <input
                className="input"
                placeholder={t("requests.new.budgetRange")}
                value={values.budgetRange}
                onChange={(event) =>
                  updateField("budgetRange", event.target.value)
                }
              />

              <input
                className="input"
                placeholder={t("requests.new.targetDeliveryTimeline")}
                value={values.targetDeliveryTimeline}
                onChange={(event) =>
                  updateField("targetDeliveryTimeline", event.target.value)
                }
              />
            </div>
          ) : null}
        </section>

        <section className="request-form-section">
          <div className="request-form-section-header">
            <h3 className="request-form-section-title">
              {t("requests.new.sectionAttachments")}
            </h3>
            <p className="request-form-section-text">
              {t("requests.new.sectionAttachmentsDescription")}
            </p>
          </div>

          <div className="request-upload-placeholder">
            {t("requests.new.attachmentsPlaceholder")}
          </div>
        </section>

        {submitError ? (
          <div className="dashboard-error">{submitError}</div>
        ) : null}

        <button className="button" type="submit" disabled={submitting}>
          {submitting ? t("requests.new.submitting") : t("requests.new.submit")}
        </button>
      </form>
    </PageSection>
  );
}