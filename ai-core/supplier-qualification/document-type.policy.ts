import type {
  QualificationFinding,
  SupplierQualificationDocument
} from "./types";

const TYPE_PATTERNS = {
  LEGAL_REGISTRATION: [
    /commercial registration/i,
    /company registration/i,
    /السجل التجاري/,
    /تسجيل الشركة/
  ],

  TRADE_LICENSE: [
    /trade license/i,
    /commercial license/i,
    /business license/i,
    /رخصة تجارية/,
    /الرخصة التجارية/
  ],

  MANUFACTURING_LICENSE: [
    /industrial license/i,
    /manufacturing license/i,
    /industrial permit/i,
    /رخصة صناعية/,
    /ترخيص صناعي/,
    /تصنيع/,
    /مصنع/
  ]
} as const;

export function validateDocumentType(
  document: SupplierQualificationDocument
): QualificationFinding[] {
  const patterns =
    TYPE_PATTERNS[
      document.document_type as
        keyof typeof TYPE_PATTERNS
    ];

  if (!patterns) {
    return [];
  }

  const text =
    document.extraction_text ?? "";

  const matched =
    patterns.some((pattern) =>
      pattern.test(text)
    );

  if (matched) {
    return [];
  }

  return [
    {
      code:
        "DOCUMENT_TYPE_MISMATCH",
      severity: "BLOCKING",
      document_type:
        document.document_type,
      file_id: document.file_id,
      message:
        "محتوى الوثيقة لا يثبت نوع الوثيقة المطلوب."
    }
  ];
}