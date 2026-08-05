import "./profile.css";
import { useI18n } from "../../i18n";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHero } from "../../components/common/PageHero";
import { InfoBanner } from "../../components/common/InfoBanner";
import { SectionCard } from "../../components/common/SectionCard";
import { supplierClient } from "../../services/supplier-client";
import {
  SupplierProfileRecord,
  SupplierRecord,
  SupplierType
} from "../../types/supplier";
import { getProfileCompleteness } from "../../lib/supplier-rules";
import { getSupplierStatusPresentation } from "../../lib/status";

type FormState = {
  supplier_type: SupplierType;
  legal_name: string;
  registration_number: string;
  registration_country: string;
  business_category: string;
  product_categories: string;
  operational_contact_name: string;
  operational_contact_email: string;
  operational_contact_phone: string;
  declared_license_expiry_date: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(value: string) {
  return value.trim().length === 0;
}

export default function ProfilePage() {
  const { t } = useI18n();

  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [form, setForm] = useState<FormState>({
    supplier_type: "manufacturer",
    legal_name: "",
    registration_number: "",
    registration_country: "",
    business_category: "",
    product_categories: "",
    operational_contact_name: "",
    operational_contact_email: "",
    operational_contact_phone: "",
    declared_license_expiry_date: ""
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    supplierClient
      .getProfile()
      .then((data) => {
        setSupplier(data.supplier);
        hydrate(data.profile);
      })
      .catch((err) => setError(err.message || "PROFILE_LOAD_FAILED"));
  }, []);

  function hydrate(profile: SupplierProfileRecord | null) {
    if (!profile) return;

    setForm({
      supplier_type: profile.supplier_type ?? "manufacturer",
      legal_name: profile.legal_name ?? "",
      registration_number: profile.registration_number ?? "",
      registration_country: profile.registration_country ?? "",
      business_category: profile.business_category ?? "",
      product_categories: profile.product_categories.join(", "),
      operational_contact_name: profile.operational_contact_name ?? "",
      operational_contact_email: profile.operational_contact_email ?? "",
      operational_contact_phone: profile.operational_contact_phone ?? "",
      declared_license_expiry_date: profile.declared_license_expiry_date ?? ""
    });
  }

  function validateField(name: keyof FormState, value: string | SupplierType): string | undefined {
    switch (name) {
      case "supplier_type":
        return value ? undefined : "Supplier type is required.";

      case "legal_name":
        if (isBlank(String(value))) return "Legal name is required.";
        if (String(value).trim().length < 2) return "Legal name is too short.";
        return undefined;

      case "registration_number":
        if (isBlank(String(value))) return "Registration number is required.";
        if (String(value).trim().length < 2) {
          return "Registration number is too short.";
        }
        return undefined;

      case "registration_country":
        if (isBlank(String(value))) return "Registration country is required.";
        return undefined;

      case "operational_contact_email":
        if (isBlank(String(value))) return "Contact email is required.";
        if (!EMAIL_REGEX.test(String(value).trim())) {
          return "Enter a valid email address.";
        }
        return undefined;

      case "declared_license_expiry_date":
        if (!String(value).trim()) return undefined;
        if (!DATE_REGEX.test(String(value).trim())) {
          return "Use YYYY-MM-DD format.";
        }
        return undefined;

      default:
        return undefined;
    }
  }

  function validateForm(current: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    (
      [
        "supplier_type",
        "legal_name",
        "registration_number",
        "registration_country",
        "operational_contact_email",
        "declared_license_expiry_date"
      ] as Array<keyof FormState>
    ).forEach((field) => {
      const message = validateField(field, current[field]);
      if (message) nextErrors[field] = message;
    });

    return nextErrors;
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    const next = { ...form, [field]: value };
    setForm(next);

    if (touched[field]) {
      const message = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: message
      }));
    }
  }

  function markTouched(field: keyof FormState) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const message = validateField(field, form[field]);
    setErrors((prev) => ({
      ...prev,
      [field]: message
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setTouched({
      supplier_type: true,
      legal_name: true,
      registration_number: true,
      registration_country: true,
      business_category: true,
      product_categories: true,
      operational_contact_name: true,
      operational_contact_email: true,
      operational_contact_phone: true,
      declared_license_expiry_date: true
    });

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    try {
      const payload = {
        supplier_type: form.supplier_type,
        legal_name: form.legal_name.trim(),
        registration_number: form.registration_number.trim(),
        registration_country: form.registration_country.trim(),
        operational_contact_email: form.operational_contact_email.trim(),
        ...(form.business_category.trim()
          ? { business_category: form.business_category.trim() }
          : {}),
        ...(form.product_categories.trim()
          ? {
              product_categories: form.product_categories
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            }
          : {}),
        ...(form.operational_contact_name.trim()
          ? { operational_contact_name: form.operational_contact_name.trim() }
          : {}),
        ...(form.operational_contact_phone.trim()
          ? { operational_contact_phone: form.operational_contact_phone.trim() }
          : {}),
        ...(form.declared_license_expiry_date.trim()
          ? {
              declared_license_expiry_date:
                form.declared_license_expiry_date.trim()
            }
          : {})
      };

      const data = await supplierClient.updateProfile(payload);

      setSupplier(data.supplier);
      hydrate(data.profile);
      setSuccess(t("profile.updatedSuccessfully"));
    } catch (err: any) {
      setError(err.message || "PROFILE_UPDATE_FAILED");
    }
  }

  const completeness = getProfileCompleteness({
    supplier_id: "",
    tenant_id: "",
    supplier_type: form.supplier_type,
    legal_name: form.legal_name || null,
    registration_number: form.registration_number || null,
    registration_country: form.registration_country || null,
    business_category: form.business_category || null,
    product_categories: form.product_categories
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    operational_contact_name: form.operational_contact_name || null,
    operational_contact_email: form.operational_contact_email || null,
    operational_contact_phone: form.operational_contact_phone || null,
    declared_license_expiry_date: form.declared_license_expiry_date || null,
    created_at: "",
    updated_at: ""
  });

  const statusPresentation = getSupplierStatusPresentation(
    supplier?.qualification_status
  );

  const hasClientErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors]
  );

  return (
    <div className="supplier-profile-page">
      <PageHero
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
        actions={
          <Link className="dashboard-link-button" to="/app/documents">
            {t("profile.openDocuments")}
          </Link>
        }
      />

      {error ? (
        <InfoBanner title={t("profile.updateFailed")} text={error} tone="danger" />
      ) : null}

      {success ? (
        <InfoBanner title={t("profile.saved")} text={success} tone="success" />
      ) : null}

      {!completeness.complete ? (
        <InfoBanner
          title={t("profile.incompleteTitle")}
          text={t("profile.incompleteText", {
            fields: completeness.missingFields.join(", ")
          })}
          tone="warning"
        />
      ) : null}

      <form onSubmit={onSubmit} className="supplier-profile-form">
        <SectionCard
          title={t("profile.businessIdentityTitle")}
          subtitle={t("profile.businessIdentitySubtitle")}
        >
          <div className="supplier-profile-grid-2">
            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.supplierType")} <span className="required-star">*</span>
              </label>
              <select
                className={`input ${errors.supplier_type ? "input-invalid" : ""}`}
                value={form.supplier_type}
                onChange={(e) =>
                  setField("supplier_type", e.target.value as SupplierType)
                }
                onBlur={() => markTouched("supplier_type")}
              >
                <option value="manufacturer">{t("supplierType.manufacturer")}</option>
                <option value="trading_company">{t("supplierType.trading_company")}</option>
                <option value="exporter">{t("supplierType.exporter")}</option>
                <option value="distributor">{t("supplierType.distributor")}</option>
                <option value="other">{t("supplierType.other")}</option>
              </select>
              {errors.supplier_type ? (
                <p className="field-error-text">{errors.supplier_type}</p>
              ) : null}
            </div>

            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.legalName")} <span className="required-star">*</span>
              </label>
              <input
                className={`input ${errors.legal_name ? "input-invalid" : ""}`}
                value={form.legal_name}
                onChange={(e) => setField("legal_name", e.target.value)}
                onBlur={() => markTouched("legal_name")}
                placeholder={t("profile.placeholderLegalName")}
              />
              {errors.legal_name ? (
                <p className="field-error-text">{errors.legal_name}</p>
              ) : null}
            </div>
          </div>

          <div className="supplier-profile-grid-2">
            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.registrationNumber")} <span className="required-star">*</span>
              </label>
              <input
                className={`input ${errors.registration_number ? "input-invalid" : ""}`}
                value={form.registration_number}
                onChange={(e) => setField("registration_number", e.target.value)}
                onBlur={() => markTouched("registration_number")}
                placeholder={t("profile.placeholderRegistrationNumber")}
              />
              {errors.registration_number ? (
                <p className="field-error-text">{errors.registration_number}</p>
              ) : null}
            </div>

            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.registrationCountry")} <span className="required-star">*</span>
              </label>
              <input
                className={`input ${errors.registration_country ? "input-invalid" : ""}`}
                value={form.registration_country}
                onChange={(e) => setField("registration_country", e.target.value)}
                onBlur={() => markTouched("registration_country")}
                placeholder={t("profile.placeholderRegistrationCountry")}
              />
              {errors.registration_country ? (
                <p className="field-error-text">{errors.registration_country}</p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t("profile.businessOperationsTitle")}
          subtitle={t("profile.businessOperationsSubtitle")}
        >
          <div className="supplier-profile-grid-2">
            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.businessCategory")}
              </label>
              <input
                className="input"
                value={form.business_category}
                onChange={(e) => setField("business_category", e.target.value)}
                placeholder={t("profile.placeholderBusinessCategory")}
              />
            </div>

            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.productCategories")}
              </label>
              <input
                className="input"
                value={form.product_categories}
                onChange={(e) => setField("product_categories", e.target.value)}
                placeholder={t("profile.placeholderProductCategories")}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t("profile.operationalContactTitle")}
          subtitle={t("profile.operationalContactSubtitle")}
        >
          <div className="supplier-profile-grid-2">
            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.contactName")}
              </label>
              <input
                className="input"
                value={form.operational_contact_name}
                onChange={(e) =>
                  setField("operational_contact_name", e.target.value)
                }
                placeholder={t("profile.placeholderContactName")}
              />
            </div>

            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.contactEmail")} <span className="required-star">*</span>
              </label>
              <input
                type="email"
                className={`input ${errors.operational_contact_email ? "input-invalid" : ""}`}
                value={form.operational_contact_email}
                onChange={(e) =>
                  setField("operational_contact_email", e.target.value)
                }
                onBlur={() => markTouched("operational_contact_email")}
                placeholder={t("profile.placeholderContactEmail")}
              />
              {errors.operational_contact_email ? (
                <p className="field-error-text">{errors.operational_contact_email}</p>
              ) : null}
            </div>
          </div>

          <div className="supplier-profile-grid-2">
            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.contactPhone")}
              </label>
              <input
                className="input"
                value={form.operational_contact_phone}
                onChange={(e) =>
                  setField("operational_contact_phone", e.target.value)
                }
                placeholder={t("profile.placeholderContactPhone")}
              />
            </div>

            <div className="supplier-field">
              <label className="supplier-field-label">
                {t("profile.declaredLicenseExpiryDate")}
              </label>
              <input
                type="date"
                className={`input ${errors.declared_license_expiry_date ? "input-invalid" : ""}`}
                value={form.declared_license_expiry_date}
                onChange={(e) =>
                  setField("declared_license_expiry_date", e.target.value)
                }
                onBlur={() => markTouched("declared_license_expiry_date")}
                placeholder={t("profile.placeholderDate")}
              />
              {errors.declared_license_expiry_date ? (
                <p className="field-error-text">{errors.declared_license_expiry_date}</p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <div className="supplier-page-actions">
          <button
            type="submit"
            className="button supplier-page-primary-button"
            disabled={hasClientErrors}
          >
            {t("profile.saveButton")}
          </button>
        </div>
      </form>

      <SectionCard
        title={t("profile.currentStateTitle")}
        subtitle={t("profile.currentStateSubtitle")}
      >
        <div className="supplier-summary-list">
          <div className="supplier-summary-row">
            <div className="supplier-summary-label">
              {t("profile.qualificationStatus")}
            </div>
            <div className="supplier-summary-value">
              {t(statusPresentation.labelKey)}
            </div>
          </div>

          <div className="supplier-summary-row">
            <div className="supplier-summary-label">
              {t("profile.lastReasonCode")}
            </div>
            <div className="supplier-summary-value">
              {supplier?.last_decision_reason_code ?? "-"}
            </div>
          </div>

          <div className="supplier-summary-row">
            <div className="supplier-summary-label">
              {t("profile.lastReasonText")}
            </div>
            <div className="supplier-summary-value">
              {supplier?.last_decision_reason_text ?? "-"}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}