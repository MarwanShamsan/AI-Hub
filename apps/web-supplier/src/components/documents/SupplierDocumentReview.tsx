import {
  useEffect,
  useMemo,
  useState
} from "react";

import { useI18n } from "../../i18n";
import { supplierClient } from "../../services/supplier-client";

import {
  SupplierDocumentDeclarationField,
  SupplierDocumentReviewRecord
} from "../../types/supplier";

type Props = {
  review: SupplierDocumentReviewRecord;
  onSubmitted: () => Promise<void>;
};

type ExtractedField = {
  field_id: string;
  label: string;
  value: string | null;
  confidence: number | null;
};

function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeFieldId(
  label: string,
  index: number
): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9\u0600-\u06ff]+/g,
      "_"
    )
    .replace(/^_+|_+$/g, "");

  /*
   * Azure may return repeated labels,
   * especially in bilingual documents.
   * The index guarantees a unique React key.
   */
  return `${
    normalized || "field"
  }_${index + 1}`;
}

function readText(
  value: unknown
): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (isPlainObject(value)) {
    const content = value.content;

    if (typeof content === "string") {
      return content.trim() || null;
    }
  }

  return null;
}

function readConfidence(
  value: unknown
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  /*
   * Normally Azure returns 0..1.
   * This also safely handles providers
   * that return 0..100.
   */
  const normalized =
    value > 1 && value <= 100
      ? value / 100
      : value;

  return Math.min(
    1,
    Math.max(0, normalized)
  );
}

function deduplicateFields(
  fields: ExtractedField[]
): ExtractedField[] {
  const seen = new Set<string>();

  return fields.filter((field) => {
    const key = [
      field.label.trim().toLowerCase(),
      field.value?.trim().toLowerCase() ?? ""
    ].join("::");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function extractGenericFields(
  value: unknown
): ExtractedField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fields = value
    .map((rawField, index) => {
      if (!isPlainObject(rawField)) {
        return null;
      }

      const label =
        readText(rawField.label) ??
        readText(rawField.key);

      if (!label) {
        return null;
      }

      const field: ExtractedField = {
        field_id: normalizeFieldId(
          label,
          index
        ),

        label,

        value:
          readText(rawField.value) ??
          readText(rawField.content),

        confidence: readConfidence(
          rawField.confidence
        )
      };

      return field;
    })
    .filter(
      (
        field
      ): field is ExtractedField =>
        field !== null
    );

  return deduplicateFields(fields);
}

function extractObjectFields(
  value: unknown
): ExtractedField[] {
  if (!isPlainObject(value)) {
    return [];
  }

  return Object.entries(value)
    .filter(([, fieldValue]) => {
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        !Array.isArray(fieldValue)
      );
    })
    .map(([key, fieldValue], index) => ({
      field_id: normalizeFieldId(
        key,
        index
      ),

      label: key,

      value: readText(fieldValue),

      confidence: null
    }));
}

function extractVisibleFields(
  review: SupplierDocumentReviewRecord
): ExtractedField[] {
  const extraction = review.extraction;

  if (!extraction) {
    return [];
  }

  const payload =
    extraction.extracted_payload ?? {};

  /*
   * Preferred Azure output.
   */
  const genericFields =
    extractGenericFields(
      payload.generic_fields
    );

  if (genericFields.length > 0) {
    return genericFields;
  }

  /*
   * Support a future canonical mapping layer.
   */
  const canonicalFields =
    extractObjectFields(
      payload.canonical_fields
    );

  if (canonicalFields.length > 0) {
    return canonicalFields;
  }

  /*
   * Support payloads that expose fields
   * under a generic "fields" object.
   */
  const mappedFields =
    extractObjectFields(
      payload.fields
    );

  if (mappedFields.length > 0) {
    return mappedFields;
  }

  /*
   * Legacy fallback for the old local parser.
   */
  const ignoredKeys = new Set([
    "provider",
    "model_id",
    "api_version",
    "generic_fields",
    "canonical_fields",
    "fields",
    "tables",
    "pages"
  ]);

  return Object.entries(payload)
    .filter(([key, value]) => {
      return (
        !ignoredKeys.has(key) &&
        value !== undefined &&
        value !== null &&
        typeof value !== "object"
      );
    })
    .map(([key, value], index) => ({
      field_id: normalizeFieldId(
        key,
        index
      ),

      label: key,

      value: readText(value),

      confidence: null
    }));
}

function formatConfidence(
  confidence: number | null
): string {
  if (confidence === null) {
    return "—";
  }

  return `${Math.round(
    confidence * 100
  )}%`;
}

function getStatusLabel(
  status: string,
  isArabic: boolean
): string {
  const labels: Record<
    string,
    {
      ar: string;
      en: string;
    }
  > = {
    PROCESSING: {
      ar: "جارٍ استخراج البيانات",
      en: "Processing"
    },

    PROCESSING_FAILED: {
      ar: "تعذر استخراج البيانات",
      en: "Processing failed"
    },

    REVIEW_REQUIRED: {
      ar: "بحاجة إلى مراجعتك",
      en: "Review required"
    },

    CONFIRMED: {
      ar: "تم تأكيد البيانات",
      en: "Confirmed"
    },

    CORRECTION_SUBMITTED: {
      ar: "تم إرسال تصحيح",
      en: "Correction submitted"
    }
  };

  const label = labels[status];

  if (!label) {
    return status;
  }

  return isArabic
    ? label.ar
    : label.en;
}

export function SupplierDocumentReview({
  review,
  onSubmitted
}: Props) {
  const { locale } = useI18n();

  const isArabic =
    locale === "ar";

  const fields = useMemo(
    () =>
      extractVisibleFields(review),
    [review]
  );

  const initialValues = useMemo(() => {
    const declaredValues =
      new Map<string, string | null>();

    const declarationFields =
      review.declaration
        ?.declared_fields;

    if (
      Array.isArray(
        declarationFields
      )
    ) {
      for (
        const field of
        declarationFields
      ) {
        declaredValues.set(
          field.field_id,
          field.declared_value
        );
      }
    }

    return Object.fromEntries(
      fields.map((field) => [
        field.field_id,

        declaredValues.has(
          field.field_id
        )
          ? declaredValues.get(
              field.field_id
            ) ?? ""
          : field.value ?? ""
      ])
    );
  }, [
    fields,
    review.declaration
  ]);

  const [editing, setEditing] =
    useState(false);

  const [values, setValues] =
    useState<
      Record<string, string>
    >(initialValues);

  const [
    correctionReason,
    setCorrectionReason
  ] = useState("");

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues);
    setEditing(false);
    setCorrectionReason("");
    setError(null);
  }, [initialValues]);

  const extraction =
    review.extraction;

  const payload =
    extraction
      ?.extracted_payload ?? {};

  const provider =
    typeof payload.provider ===
    "string"
      ? payload.provider
      : extraction
        ? "UNKNOWN"
        : null;

  const modelId =
    typeof payload.model_id ===
    "string"
      ? payload.model_id
      : null;

  const declaration =
    review.declaration;

  function resetEditing():
    void {
    setEditing(false);
    setValues(initialValues);
    setCorrectionReason("");
    setError(null);
  }

  function buildDeclaredFields():
    SupplierDocumentDeclarationField[] {
    return fields.map(
      (field) => ({
        field_id:
          field.field_id,

        label:
          field.label,

        extracted_value:
          field.value,

        declared_value:
          values[
            field.field_id
          ]?.trim() || null,

        confidence:
          field.confidence
      })
    );
  }

  async function confirmExtraction():
    Promise<void> {
    if (
      !review.extraction ||
      fields.length === 0
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await supplierClient
        .submitDocumentDeclaration(
          review.file.id,
          {
            declaration_type:
              "CONFIRMED_AS_EXTRACTED",

            declared_fields:
              fields.map(
                (field) => ({
                  field_id:
                    field.field_id,

                  label:
                    field.label,

                  extracted_value:
                    field.value,

                  declared_value:
                    field.value,

                  confidence:
                    field.confidence
                })
              )
          }
        );

      await onSubmitted();
    } catch (
      submitError: unknown
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "DOCUMENT_CONFIRMATION_FAILED"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCorrection():
    Promise<void> {
    if (
      !review.extraction ||
      fields.length === 0
    ) {
      return;
    }

    if (
      !correctionReason.trim()
    ) {
      setError(
        isArabic
          ? "اكتب سبب التصحيح."
          : "Enter a correction reason."
      );

      return;
    }

    const declaredFields =
      buildDeclaredFields();

    const hasChangedValue =
      declaredFields.some(
        (field) =>
          (
            field.declared_value ??
            ""
          ) !==
          (
            field.extracted_value ??
            ""
          )
      );

    if (!hasChangedValue) {
      setError(
        isArabic
          ? "لم يتم تغيير أي قيمة."
          : "No extracted value was changed."
      );

      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await supplierClient
        .submitDocumentDeclaration(
          review.file.id,
          {
            declaration_type:
              "CORRECTION_SUBMITTED",

            declared_fields:
              declaredFields,

            correction_reason:
              correctionReason.trim()
          }
        );

      await onSubmitted();
    } catch (
      submitError: unknown
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "DOCUMENT_CORRECTION_FAILED"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="supplier-inline-extraction">
      <div className="supplier-inline-extraction-block">
        <div className="supplier-inline-extraction-block-title">
          {isArabic
            ? "مراجعة البيانات المستخرجة"
            : "Review extracted information"}
        </div>

        <div className="supplier-inline-extraction-meta">
          <span>
            {isArabic
              ? "الحالة"
              : "Status"}
            :{" "}
            {getStatusLabel(
              review.review_status,
              isArabic
            )}
          </span>

          {provider ? (
            <span>
              {isArabic
                ? "المزوّد"
                : "Provider"}
              : {provider}
            </span>
          ) : null}

          {modelId ? (
            <span>
              {isArabic
                ? "النموذج"
                : "Model"}
              : {modelId}
            </span>
          ) : null}
        </div>
      </div>

      {!extraction ? (
        <div className="supplier-inline-extraction-empty">
          {review.review_status ===
          "PROCESSING_FAILED"
            ? isArabic
              ? "تم رفع الملف، ولكن تعذر استخراج بياناته. ارفع نسخة أوضح."
              : "The file was uploaded, but extraction failed. Upload a clearer version."
            : isArabic
              ? "تم رفع الملف، ويجري انتظار نتيجة الاستخراج."
              : "The file was uploaded and is waiting for extraction."}
        </div>
      ) : fields.length === 0 ? (
        <div className="supplier-inline-extraction-empty">
          {isArabic
            ? "اكتملت المعالجة، ولكن لم يتم العثور على حقول قابلة للمراجعة."
            : "Processing completed, but no reviewable fields were found."}
        </div>
      ) : (
        <>
          <div className="supplier-inline-extraction-grid">
            {fields.map(
              (field) => (
                <div
                  key={
                    field.field_id
                  }
                  className="supplier-inline-extraction-item"
                >
                  <div className="supplier-inline-extraction-label">
                    {field.label}
                  </div>

                  {editing ? (
                    <input
                      className="input"
                      value={
                        values[
                          field.field_id
                        ] ?? ""
                      }
                      onChange={(
                        event
                      ) => {
                        const nextValue =
                          event.target
                            .value;

                        setValues(
                          (
                            current
                          ) => ({
                            ...current,

                            [field.field_id]:
                              nextValue
                          })
                        );
                      }}
                    />
                  ) : (
                    <div className="supplier-inline-extraction-value">
                      {field.value ||
                        "—"}
                    </div>
                  )}

                  <div className="supplier-review-confidence">
                    {isArabic
                      ? "الثقة"
                      : "Confidence"}
                    :{" "}
                    {formatConfidence(
                      field.confidence
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {editing ? (
            <div className="supplier-upload-field">
              <label className="supplier-upload-label">
                {isArabic
                  ? "سبب التصحيح"
                  : "Correction reason"}
              </label>

              <textarea
                className="textarea"
                value={
                  correctionReason
                }
                onChange={(
                  event
                ) =>
                  setCorrectionReason(
                    event.target.value
                  )
                }
                placeholder={
                  isArabic
                    ? "اشرح سبب اختلاف القيمة المعلنة عن نتيجة الاستخراج"
                    : "Explain why the declared value differs from the extracted result"
                }
              />
            </div>
          ) : null}

          {declaration ? (
            <div className="supplier-review-declaration">
              {declaration
                .declaration_type ===
              "CONFIRMED_AS_EXTRACTED"
                ? isArabic
                  ? "تم تأكيد هذه البيانات."
                  : "These fields were confirmed."
                : isArabic
                  ? "تم إرسال تصحيح للمراجعة."
                  : "A correction was submitted for review."}
            </div>
          ) : null}

          {error ? (
            <div className="field-error-text">
              {error}
            </div>
          ) : null}

          <div className="supplier-required-doc-actions">
            {!editing ? (
              <>
                <button
                  type="button"
                  className="dashboard-link-button dashboard-link-button-primary"
                  onClick={() =>
                    void confirmExtraction()
                  }
                  disabled={
                    submitting ||
                    review.review_status ===
                      "CONFIRMED"
                  }
                >
                  {submitting
                    ? isArabic
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : isArabic
                      ? "تأكيد البيانات المستخرجة"
                      : "Confirm extracted information"}
                </button>

                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={() => {
                    setEditing(true);
                    setError(null);
                  }}
                  disabled={submitting}
                >
                  {isArabic
                    ? "الإبلاغ عن قيمة غير صحيحة"
                    : "Report incorrect value"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="dashboard-link-button dashboard-link-button-primary"
                  onClick={() =>
                    void submitCorrection()
                  }
                  disabled={submitting}
                >
                  {submitting
                    ? isArabic
                      ? "جارٍ الإرسال..."
                      : "Submitting..."
                    : isArabic
                      ? "إرسال التصحيح"
                      : "Submit correction"}
                </button>

                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={
                    resetEditing
                  }
                  disabled={submitting}
                >
                  {isArabic
                    ? "إلغاء"
                    : "Cancel"}
                </button>
              </>
            )}
          </div>

          {extraction.extracted_text ? (
            <details className="supplier-review-raw-text">
              <summary>
                {isArabic
                  ? "عرض النص الكامل المستخرج"
                  : "Show full extracted text"}
              </summary>

              <pre className="supplier-pre">
                {
                  extraction
                    .extracted_text
                }
              </pre>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}