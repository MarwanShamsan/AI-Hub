import type {
  ConfirmedDocumentField
} from "./types";

import {
  normalizeIdentifier
} from "./normalization";

const FIELD_ALIASES = {
  legal_name: [
    "company name",
    "business name",
    "legal name",
    "اسم الشركة",
    "الاسم التجاري",
    "اسم المنشأة"
  ],

  registration_number: [
    "register no",
    "registration number",
    "commercial registration no",
    "license no",
    "رقم السجل",
    "رقم السجل التجاري",
    "رقم الرخصة"
  ],

  issue_date: [
    "issue date",
    "date of issue",
    "تاريخ الإصدار",
    "تاريخ القيد"
  ],

  expiry_date: [
    "expiry date",
    "expiration date",
    "valid until",
    "تاريخ الانتهاء",
    "تاريخ انتهاء الصلاحية"
  ],

  country: [
    "country",
    "issuing country",
    "country of issue",
    "الدولة",
    "دولة الإصدار"
  ]
} as const;

export type CanonicalDocumentField =
  keyof typeof FIELD_ALIASES;

function normalizeLabel(
  value: string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[.:/\\_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function findDocumentField(
  fields: ConfirmedDocumentField[],
  canonicalField: CanonicalDocumentField
): ConfirmedDocumentField | null {
  const aliases =
    FIELD_ALIASES[canonicalField].map(
      normalizeLabel
    );

  for (const field of fields) {
    const normalizedLabel =
      normalizeLabel(field.label);

    if (
      aliases.some(
        (alias) =>
          normalizedLabel === alias ||
          normalizedLabel.endsWith(alias)
      )
    ) {
      return field;
    }
  }

  /*
   * احتياط عند وجود field_id موحد.
   */
  for (const field of fields) {
    const normalizedId =
      normalizeIdentifier(field.field_id);

    if (
      normalizedId ===
      normalizeIdentifier(canonicalField)
    ) {
      return field;
    }
  }

  return null;
}