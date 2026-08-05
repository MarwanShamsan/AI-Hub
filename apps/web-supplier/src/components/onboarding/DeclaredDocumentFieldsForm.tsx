import { ChangeEvent } from "react";
import { useI18n } from "../../i18n";
import {
  SupplierDeclaredPayload,
  SupplierDocumentType
} from "../../types/supplier";
import { getSupplierDocumentFields } from "../../lib/supplier-document-fields";

type Props = {
  documentType: SupplierDocumentType;
  value: SupplierDeclaredPayload;
  onChange: (next: SupplierDeclaredPayload) => void;
};

export function DeclaredDocumentFieldsForm({
  documentType,
  value,
  onChange
}: Props) {
  const { t } = useI18n();
  const fields = getSupplierDocumentFields(documentType);

  function updateField(key: string, nextValue: string) {
    onChange({
      ...value,
      [key]: nextValue || null
    });
  }

  return (
    <div className="supplier-declared-fields" dir="rtl">
      {fields.map((field) => (
        <div key={field.key} className="supplier-upload-field">
          <label className="supplier-upload-label">
            {t(field.labelKey)}
            {field.required ? <span className="required-star"> *</span> : null}
          </label>

          <input
            className="input"
            type={field.type === "date" ? "date" : "text"}
            dir={field.type === "date" ? "ltr" : "auto"}
            value={value[field.key] ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateField(field.key, e.target.value)
            }
          />
        </div>
      ))}
    </div>
  );
}