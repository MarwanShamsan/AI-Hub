import {
  findDocumentField
} from "./document-fields";

import {
  normalizeCountry,
  normalizeIdentifier,
  normalizeLegalName,
  parseDocumentDate,
  utcTodayTimestamp
} from "./normalization";

import type {
  QualificationFinding,
  SupplierQualificationDocument,
  SupplierQualificationProfile
} from "./types";

export function validateSupplierDocument(
  input: {
    profile: SupplierQualificationProfile;
    document: SupplierQualificationDocument;
    now: Date;
  }
): QualificationFinding[] {
  const {
    profile,
    document,
    now
  } = input;

  const findings:
    QualificationFinding[] = [];

  const blocking = (
    code: QualificationFinding["code"],
    message: string,
    details?: Partial<QualificationFinding>
  ) => {
    findings.push({
      code,
      severity: "BLOCKING",
      document_type:
        document.document_type,
      file_id: document.file_id,
      message,
      ...details
    });
  };

  if (!document.file_sha256) {
    blocking(
      "FILE_HASH_MISSING",
      "لا توجد بصمة SHA-256 للوثيقة."
    );
  }

  if (!document.extraction_id) {
    blocking(
      "DOCUMENT_EXTRACTION_MISSING",
      "لم يكتمل استخراج بيانات الوثيقة."
    );

    return findings;
  }

  if (!document.declaration_type) {
    blocking(
      "DOCUMENT_REVIEW_REQUIRED",
      "يجب تأكيد أو تصحيح البيانات المستخرجة."
    );

    return findings;
  }

  if (
    document.declaration_extraction_id !==
    document.extraction_id
  ) {
    blocking(
      "STALE_DOCUMENT_DECLARATION",
      "التأكيد مرتبط باستخراج قديم."
    );
  }

  const legalNameField =
    findDocumentField(
      document.fields,
      "legal_name"
    );

  const registrationField =
    findDocumentField(
      document.fields,
      "registration_number"
    );

  const issueDateField =
    findDocumentField(
      document.fields,
      "issue_date"
    );

  const expiryDateField =
    findDocumentField(
      document.fields,
      "expiry_date"
    );

  if (!legalNameField?.value) {
    blocking(
      "DOCUMENT_FIELD_MISSING",
      "اسم المنشأة غير موجود في الوثيقة.",
      {
        field_id: "legal_name"
      }
    );
  } else if (
    normalizeLegalName(
      legalNameField.value
    ) !==
    normalizeLegalName(
      profile.legal_name
    )
  ) {
    blocking(
      "LEGAL_NAME_MISMATCH",
      "اسم المنشأة في الوثيقة لا يطابق ملف المورد.",
      {
        field_id:
          legalNameField.field_id,
        expected: profile.legal_name,
        actual:
          legalNameField.value
      }
    );
  }

  if (
    registrationField?.value &&
    profile.registration_number &&
    normalizeIdentifier(
      registrationField.value
    ) !==
      normalizeIdentifier(
        profile.registration_number
      )
  ) {
    blocking(
      "REGISTRATION_NUMBER_MISMATCH",
      "رقم التسجيل في الوثيقة لا يطابق ملف المورد.",
      {
        field_id:
          registrationField.field_id,
        expected:
          profile.registration_number,
        actual:
          registrationField.value
      }
    );
  }

  if (
    document.issuing_country &&
    profile.registration_country &&
    normalizeCountry(
      document.issuing_country
    ) !==
      normalizeCountry(
        profile.registration_country
      )
  ) {
    blocking(
      "ISSUING_COUNTRY_MISMATCH",
      "دولة إصدار الوثيقة لا تطابق دولة تسجيل المورد.",
      {
        expected:
          profile.registration_country,
        actual:
          document.issuing_country
      }
    );
  }

  const today =
    utcTodayTimestamp(now);

  const issueDate =
    parseDocumentDate(
      issueDateField?.value ?? null
    );

  const expiryDate =
    parseDocumentDate(
      expiryDateField?.value ?? null
    );

  if (
    issueDateField?.value &&
    !issueDate
  ) {
    blocking(
      "INVALID_ISSUE_DATE",
      "تعذر تفسير تاريخ إصدار الوثيقة.",
      {
        actual:
          issueDateField.value
      }
    );
  }

  if (
    expiryDateField?.value &&
    !expiryDate
  ) {
    blocking(
      "INVALID_EXPIRY_DATE",
      "تعذر تفسير تاريخ انتهاء الوثيقة.",
      {
        actual:
          expiryDateField.value
      }
    );
  }

  if (
    issueDate &&
    issueDate.timestamp > today
  ) {
    blocking(
      "ISSUE_DATE_IN_FUTURE",
      "تاريخ إصدار الوثيقة يقع في المستقبل."
    );
  }

  if (
    issueDate &&
    expiryDate &&
    issueDate.timestamp >
      expiryDate.timestamp
  ) {
    blocking(
      "ISSUE_DATE_AFTER_EXPIRY",
      "تاريخ الإصدار يأتي بعد تاريخ الانتهاء."
    );
  }

  if (
    expiryDate &&
    expiryDate.timestamp < today
  ) {
    blocking(
      "DOCUMENT_EXPIRED",
      "الوثيقة منتهية الصلاحية.",
      {
        actual:
          expiryDateField?.value ??
          null
      }
    );
  }

  return findings;
}