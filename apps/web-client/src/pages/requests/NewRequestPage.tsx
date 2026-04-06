import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageSection from "../../components/common/PageSection";
import { RequestFormErrors, RequestFormValues } from "../../features/requests/types";
import {
  hasRequestFormErrors,
  validateRequestForm
} from "../../features/requests/validation";

const INITIAL_VALUES: RequestFormValues = {
  productName: "",
  targetCountry: "",
  quantity: "",
  requirements: ""
};

export default function NewRequestPage() {
  const navigate = useNavigate();

  const [values, setValues] = useState<RequestFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

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
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateRequestForm(values);
    setErrors(nextErrors);

    if (hasRequestFormErrors(nextErrors)) {
      return;
    }

    try {
      setSubmitting(true);

      navigate("/app/requests/success", {
        state: {
          requestDraft: {
            productName: values.productName.trim(),
            targetCountry: values.targetCountry.trim(),
            quantity: values.quantity.trim(),
            requirements: values.requirements.trim()
          }
        }
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageSection
      title="New Sourcing Request"
      description="Create a new sourcing request for AI supplier discovery."
    >
      <form className="stack-md" onSubmit={handleSubmit}>
        <div className="stack-sm">
          <input
            className="input"
            placeholder="Product name"
            value={values.productName}
            onChange={(event) => updateField("productName", event.target.value)}
          />
          {errors.productName ? (
            <p className="error-text">{errors.productName}</p>
          ) : null}
        </div>

        <div className="stack-sm">
          <input
            className="input"
            placeholder="Target country"
            value={values.targetCountry}
            onChange={(event) => updateField("targetCountry", event.target.value)}
          />
          {errors.targetCountry ? (
            <p className="error-text">{errors.targetCountry}</p>
          ) : null}
        </div>

        <div className="stack-sm">
          <input
            className="input"
            placeholder="Quantity"
            value={values.quantity}
            onChange={(event) => updateField("quantity", event.target.value)}
          />
          {errors.quantity ? (
            <p className="error-text">{errors.quantity}</p>
          ) : null}
        </div>

        <div className="stack-sm">
          <textarea
            className="textarea"
            placeholder="Constraints and requirements"
            value={values.requirements}
            onChange={(event) => updateField("requirements", event.target.value)}
          />
          {errors.requirements ? (
            <p className="error-text">{errors.requirements}</p>
          ) : null}
        </div>

        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </PageSection>
  );
}