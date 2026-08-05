import { classifyDocumentType } from "./document-classifier";

type ParsedSupplierDocument = {
  extractedPayload: Record<string, unknown>;
  confidencePayload: Record<string, number>;
  missingFields: string[];
  warnings: string[];
};

type DocumentType =
  | "TRADE_LICENSE"
  | "LEGAL_REGISTRATION"
  | "MANUFACTURING_LICENSE"
  | "EXPORT_LICENSE"
  | "QUALITY_CERTIFICATE"
  | "SUPPLIER_QUALIFICATION_DOCUMENT"
  | "UNKNOWN";

type FieldAliasMap = {
  legalName: string[];
  businessName: string[];
  registrationNumber: string[];
  licenseNumber: string[];
  certificateReference: string[];
  issueDate: string[];
  expiryDate: string[];
  issuingAuthority: string[];
};

const FIELD_ALIASES: FieldAliasMap = {
  legalName: [
    "company name",
    "legal name",
    "اسم الشركة",
    "الاسم القانوني"
  ],
  businessName: [
    "business name",
    "trade name",
    "الاسم التجاري",
    "اسم المنشأة"
  ],
  registrationNumber: [
    "register no",
    "register no.",
    "registration number",
    "commercial register no",
    "commercial register",
    "رقم السجل",
    "رقم السجل التجاري"
  ],
  licenseNumber: [
    "license no",
    "license no.",
    "licence no",
    "licence no.",
    "main license no",
    "main license no.",
    "رقم الرخصة",
    "رقم الرخصة الأم"
  ],
  certificateReference: [
    "certificate reference",
    "certificate no",
    "certificate no.",
    "مرجع الشهادة",
    "رقم الشهادة"
  ],
  issueDate: [
    "issue date",
    "date of issue",
    "issued on",
    "تاريخ الإصدار",
    "تاريخ الاصدار"
  ],
  expiryDate: [
    "expiry date",
    "expiration date",
    "valid until",
    "date of expiry",
    "تاريخ الانتهاء"
  ],
  issuingAuthority: [
    "issuing authority",
    "issued by",
    "authority",
    "جهة الإصدار",
    "الجهة المصدرة"
  ]
};

const DOCUMENT_TYPE_SIGNALS: Record<DocumentType, string[]> = {
  TRADE_LICENSE: [
    "commercial license",
    "trade license",
    "license details",
    "الرخصة التجارية",
    "رخصة تجارية"
  ],
  LEGAL_REGISTRATION: [
    "commercial registration",
    "registration certificate",
    "certificate of incorporation",
    "السجل التجاري",
    "شهادة تسجيل",
    "تسجيل تجاري"
  ],
  MANUFACTURING_LICENSE: [
    "manufacturing license",
    "industrial license",
    "factory license",
    "ترخيص التصنيع",
    "رخصة صناعية",
    "ترخيص صناعي"
  ],
  EXPORT_LICENSE: [
    "export license",
    "export permit",
    "رخصة تصدير",
    "تصريح تصدير"
  ],
  QUALITY_CERTIFICATE: [
    "quality certificate",
    "certificate of quality",
    "iso 9001",
    "شهادة جودة",
    "شهادة مطابقة"
  ],
  SUPPLIER_QUALIFICATION_DOCUMENT: [],
  UNKNOWN: []
};

const HARD_STOP_SECTION_PATTERNS = [
  /license\s*members/i,
  /license\s*activities/i,
  /address\s*\/?/i,
  /receipt\s*no/i,
  /print\s*date/i,
  /phone\s*no/i,
  /fax\s*no/i,
  /mobile\s*no/i,
  /email/i,
  /p\.?\s*o\.?\s*box/i,
  /الأطراف/i,
  /أنشطة\s*الرخصة/i,
  /العنوان/i,
  /رقم\s*الإيصال/i,
  /تاريخ\s*الطباعة/i,
  /هاتف/i,
  /فاكس/i,
  /البريد\s*الإلكتروني/i,
  /صندوق\s*بريد/i
];

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function flattenText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:/.\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanupValue(value: string | null): string | null {
  if (!value) return null;

  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/^[\s:.\-\/|]+/, "")
    .replace(/[\s:.\-\/|]+$/, "")
    .trim();

  return cleaned || null;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function normalizeDate(dateText: string | null): string | null {
  if (!dateText) return null;

  const cleaned = dateText.trim();

  const ddmmyyyy = cleaned.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm}-${dd}`;
  }

  const yyyymmdd = cleaned.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    return `${yyyy}-${mm}-${dd}`;
  }

  return cleaned;
}

function getUsefulLines(text: string): string[] {
  return normalizeWhitespace(text)
    .split("\n")
    .map((line) => cleanupValue(line) ?? "")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function trimToCoreDocumentLines(lines: string[]): string[] {
  if (lines.length === 0) return [];

  let stopIndex = lines.length;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (HARD_STOP_SECTION_PATTERNS.some((pattern) => pattern.test(line))) {
      stopIndex = index;
      break;
    }
  }

  return lines.slice(0, stopIndex);
}

function collectWindow(lines: string[], index: number, radius = 1): string[] {
  const from = Math.max(0, index - radius);
  const to = Math.min(lines.length - 1, index + radius);
  return lines.slice(from, to + 1);
}

function hasAlias(text: string, aliases: string[]): boolean {
  const normalized = normalizeSearchText(text);
  return aliases.some((alias) => normalized.includes(normalizeSearchText(alias)));
}

function buildStopAliases(): string[] {
  return uniqueStrings([
    ...FIELD_ALIASES.legalName,
    ...FIELD_ALIASES.businessName,
    ...FIELD_ALIASES.registrationNumber,
    ...FIELD_ALIASES.licenseNumber,
    ...FIELD_ALIASES.certificateReference,
    ...FIELD_ALIASES.issueDate,
    ...FIELD_ALIASES.expiryDate,
    ...FIELD_ALIASES.issuingAuthority
  ]);
}

function cutAtNextAlias(value: string, stopAliases: string[]): string {
  let result = value;

  for (const alias of stopAliases) {
    const regex = new RegExp(`\\s+${escapeRegex(alias)}\\s*[:\\-]?\\s*`, "i");
    const match = regex.exec(result);
    if (match) {
      result = result.slice(0, match.index);
    }
  }

  return result;
}

function sanitizeNameValue(value: string | null): string | null {
  if (!value) return null;

  let cleaned = value
    .replace(/\blicense\b/gi, "")
    .replace(/\bcategory\b/gi, "")
    .replace(/\bregister\b/gi, "")
    .replace(/\bissue\s*date\b/gi, "")
    .replace(/\bexpiry\s*date\b/gi, "")
    .replace(/\bmain\s*license\s*no\b/gi, "")
    .replace(/\blicen[cs]e\s*no\b/gi, "")
    .replace(/\bdepartment\s*of\s*economic\s*development\b/gi, "")
    .replace(/\bdepartment\s*of\s*economy\s*and\s*tourism\b/gi, "")
    .replace(/رقم\s*الرخصة/gi, "")
    .replace(/رقم\s*السجل/gi, "")
    .replace(/تاريخ\s*الإصدار/gi, "")
    .replace(/تاريخ\s*الانتهاء/gi, "")
    .replace(/فئة\s*الرخصة/gi, "")
    .replace(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g, "")
    .replace(/\b\d{5,12}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedCleaned =
    cleanupValue(cleaned);

  if (!normalizedCleaned) {
    return null;
  }

  if (normalizedCleaned.length < 3) {
    return null;
  }

  if (
    /^[\d\s./-]+$/.test(
      normalizedCleaned
    )
  ) {
    return null;
  }

  return normalizedCleaned;
}

function extractValueAfterAlias(
  text: string,
  aliases: string[],
  stopAliases: string[]
): string | null {
  for (const alias of aliases) {
    const regex = new RegExp(`${escapeRegex(alias)}\\s*[:\\-]?\\s*(.+)$`, "i");
    const match = text.match(regex);
    if (match?.[1]) {
      const candidate = cleanupValue(cutAtNextAlias(match[1], stopAliases));
      if (candidate) return candidate;
    }
  }

  return null;
}

function extractTextFromLines(
  lines: string[],
  aliases: string[],
  stopAliases: string[],
  sanitizer?: (value: string | null) => string | null
): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!hasAlias(line, aliases)) {
      continue;
    }

    const sameLine = extractValueAfterAlias(line, aliases, stopAliases);
    const sanitizedSameLine = sanitizer ? sanitizer(sameLine) : sameLine;
    if (sanitizedSameLine) return sanitizedSameLine;

    const neighbors = collectWindow(lines, index, 1);
    for (const candidateLine of neighbors) {
      if (candidateLine === line) continue;
      if (hasAlias(candidateLine, stopAliases)) continue;

      const candidate = cleanupValue(candidateLine);
      const sanitizedCandidate = sanitizer ? sanitizer(candidate) : candidate;
      if (sanitizedCandidate) return sanitizedCandidate;
    }
  }

  return null;
}

function collectAllDates(text: string): string[] {
  const matches =
    text.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b|\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b/g) ??
    [];
  return uniquePreserveOrder(matches.map((value) => normalizeDate(value) ?? value));
}

function collectAllNumericCodes(text: string): string[] {
  const matches = text.match(/\b\d{5,12}\b/g) ?? [];
  return uniquePreserveOrder(matches);
}

function extractNumberAfterAlias(line: string, aliases: string[]): string | null {
  for (const alias of aliases) {
    const regex = new RegExp(
      `${escapeRegex(alias)}\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9/\\-]{3,})`,
      "i"
    );
    const match = line.match(regex);
    if (match?.[1]) {
      return cleanupValue(match[1]);
    }
  }

  return null;
}

function extractNumericFieldFromLines(
  lines: string[],
  aliases: string[]
): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!hasAlias(line, aliases)) {
      continue;
    }

    const sameLine = extractNumberAfterAlias(line, aliases);
    if (sameLine && /\d{5,}/.test(sameLine)) return sameLine;

    const neighbors = collectWindow(lines, index, 1);
    for (const neighbor of neighbors) {
      const match = neighbor.match(/\b[A-Z0-9][A-Z0-9/\\-]{3,}\b/g);
      if (match?.length) {
        const filtered = match
          .map((value) => cleanupValue(value))
          .filter(Boolean) as string[];

        const bestNumeric = filtered.find((value) => /\d{5,}/.test(value));
        if (bestNumeric) return bestNumeric;
      }
    }
  }

  return null;
}

function extractDateAfterAlias(line: string, aliases: string[]): string | null {
  for (const alias of aliases) {
    const regex = new RegExp(
      `${escapeRegex(alias)}\\s*[:\\-]?\\s*(\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{2}[\\/\\-]\\d{2})`,
      "i"
    );
    const match = line.match(regex);
    if (match?.[1]) {
      return normalizeDate(match[1]);
    }
  }

  return null;
}

function extractDateFieldFromLines(
  lines: string[],
  aliases: string[]
): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!hasAlias(line, aliases)) {
      continue;
    }

    const sameLine = extractDateAfterAlias(line, aliases);
    if (sameLine) return sameLine;

    const neighbors = collectWindow(lines, index, 1);
    for (const neighbor of neighbors) {
      const match = neighbor.match(
        /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/
      );
      if (match?.[1]) {
        return normalizeDate(match[1]);
      }
    }
  }

  return null;
}

function detectIssuer(lines: string[], stopAliases: string[]): string | null {
  const generic = extractTextFromLines(
    lines,
    FIELD_ALIASES.issuingAuthority,
    stopAliases
  );
  if (generic) return generic;

  const flatText = flattenText(lines.join("\n"));

  if (/department of economy and tourism/i.test(flatText)) {
    return "Department of Economy and Tourism";
  }

  if (/department of economic development/i.test(flatText)) {
    return "Department of Economic Development";
  }

  if (/government of dubai/i.test(flatText)) {
    return "Government of Dubai";
  }

  if (/dubai economy and tourism/i.test(flatText) || /دبي للاقتصاد والسياحة/i.test(flatText)) {
    return "Dubai Economy and Tourism";
  }

  return null;
}

function detectCountry(lines: string[], issuer: string | null): string | null {
  const headerText = flattenText(lines.slice(0, 10).join("\n"));

  if (
    issuer &&
    /dubai|economy|tourism/i.test(issuer)
  ) {
    return "United Arab Emirates";
  }

  if (
    /united arab emirates/i.test(headerText) ||
    /\buae\b/i.test(headerText) ||
    /government of dubai/i.test(headerText) ||
    /dubai/i.test(headerText) ||
    /الإمارات العربية المتحدة/i.test(headerText) ||
    /دبي/i.test(headerText)
  ) {
    return "United Arab Emirates";
  }

  if (/saudi arabia/i.test(headerText) || /السعودية/i.test(headerText)) {
    return "Saudi Arabia";
  }

  if (/yemen/i.test(headerText) || /اليمن/i.test(headerText)) {
    return "Yemen";
  }

  return null;
}

function scoreDocumentTypes(
  flatText: string,
  hint?: string | null
): Record<DocumentType, number> {
  const scores: Record<DocumentType, number> = {
    TRADE_LICENSE: 0,
    LEGAL_REGISTRATION: 0,
    MANUFACTURING_LICENSE: 0,
    EXPORT_LICENSE: 0,
    QUALITY_CERTIFICATE: 0,
    SUPPLIER_QUALIFICATION_DOCUMENT: 0,
    UNKNOWN: 0
  };

  (Object.keys(DOCUMENT_TYPE_SIGNALS) as DocumentType[]).forEach((docType) => {
    if (docType === "SUPPLIER_QUALIFICATION_DOCUMENT" || docType === "UNKNOWN") {
      return;
    }

    for (const signal of DOCUMENT_TYPE_SIGNALS[docType]) {
      if (flatText.toLowerCase().includes(signal.toLowerCase())) {
        scores[docType] += 1;
      }
    }
  });

  if (hint) {
    const hinted = hint.toUpperCase() as DocumentType;
    if (hinted in scores) {
      scores[hinted] += 1.25;
    }
  }

  return scores;
}

function chooseDocumentType(flatText: string, hint?: string | null): DocumentType {
  const classified = classifyDocumentType({ text: flatText, hint });
  if (classified !== "SUPPLIER_QUALIFICATION_DOCUMENT" && classified !== "UNKNOWN") {
    return classified as DocumentType;
  }

  const scores = scoreDocumentTypes(flatText, hint);
  const entries = Object.entries(scores) as Array<[DocumentType, number]>;
  entries.sort((a, b) => b[1] - a[1]);

  const [bestType, bestScore] = entries[0];
  if (bestScore <= 0) {
    return classified as DocumentType;
  }

  return bestType;
}

function pickFallbackLicenseNumber(
  allCodes: string[],
  excludedCodes: string[]
): string | null {
  return (
    allCodes.find(
      (code) =>
        !excludedCodes.includes(code) &&
        code.length >= 6 &&
        code.length <= 8
    ) ?? null
  );
}

function sortDatesAscending(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b));
}

export function parseSupplierDocument(
  text: string,
  hint?: string | null
): ParsedSupplierDocument {
  const normalizedText = normalizeWhitespace(text);
  const allLines = getUsefulLines(normalizedText);
  const coreLines = trimToCoreDocumentLines(allLines);
  const flatText = flattenText(coreLines.join("\n"));
  const stopAliases = buildStopAliases();

  const documentType = chooseDocumentType(flatText, hint);

  const legalName =
    extractTextFromLines(
      coreLines,
      FIELD_ALIASES.legalName,
      stopAliases,
      sanitizeNameValue
    ) ??
    extractTextFromLines(
      coreLines,
      FIELD_ALIASES.businessName,
      stopAliases,
      sanitizeNameValue
    );

  const issueDate = extractDateFieldFromLines(coreLines, FIELD_ALIASES.issueDate);
  const expiryDate = extractDateFieldFromLines(coreLines, FIELD_ALIASES.expiryDate);

  const licenseNumber = extractNumericFieldFromLines(
    coreLines,
    FIELD_ALIASES.licenseNumber
  );

  const registrationNumber = extractNumericFieldFromLines(
    coreLines,
    FIELD_ALIASES.registrationNumber
  );

  const allCodes = collectAllNumericCodes(flatText);
  const allDates = sortDatesAscending(collectAllDates(flatText));

  const fallbackLicenseNumber =
    licenseNumber ??
    pickFallbackLicenseNumber(allCodes, []);

  const fallbackRegisterNumber =
    registrationNumber ??
    allCodes.find(
      (code) =>
        code !== fallbackLicenseNumber &&
        code.length >= 6 &&
        code.length <= 8
    ) ??
    null;

  const fallbackIssueDate =
    issueDate ??
    (allDates.length >= 2 ? allDates[0] : allDates[0] ?? null);

  const fallbackExpiryDate =
    expiryDate ??
    (allDates.length >= 2 ? allDates[allDates.length - 1] : null);

  const issuingAuthority = detectIssuer(coreLines, stopAliases);
  const countryHint = detectCountry(coreLines, issuingAuthority);

  const extractedPayload: Record<string, unknown> = {
    document_type: documentType,
    legal_name: legalName,
    registration_number: fallbackRegisterNumber ?? fallbackLicenseNumber,
    certificate_reference: fallbackLicenseNumber,
    issue_date: fallbackIssueDate,
    expiry_date: fallbackExpiryDate,
    issuing_authority: issuingAuthority,
    country_hint: countryHint
  };

  const confidencePayload: Record<string, number> = {
    document_type:
      documentType === "UNKNOWN"
        ? 0.2
        : hint && documentType === hint
          ? 0.95
          : 0.84,
    legal_name: legalName ? 0.82 : 0.0,
    registration_number:
      (fallbackRegisterNumber ?? fallbackLicenseNumber) ? 0.8 : 0.0,
    certificate_reference: fallbackLicenseNumber ? 0.84 : 0.0,
    issue_date: fallbackIssueDate ? 0.76 : 0.0,
    expiry_date: fallbackExpiryDate ? 0.76 : 0.0,
    issuing_authority: issuingAuthority ? 0.8 : 0.0,
    country_hint: countryHint ? 0.82 : 0.0
  };

  const missingFields = Object.entries(extractedPayload)
    .filter(([, value]) => value === null || value === undefined || value === "")
    .map(([key]) => key);

  const warnings: string[] = [];

  if (documentType === "UNKNOWN") {
    warnings.push("DOCUMENT_TYPE_COULD_NOT_BE_CLASSIFIED");
  }

  if (!legalName) {
    warnings.push("LEGAL_NAME_NOT_FOUND");
  }

  if (!(fallbackRegisterNumber ?? fallbackLicenseNumber)) {
    warnings.push("REGISTRATION_OR_LICENSE_NUMBER_NOT_FOUND");
  }

  if (!fallbackIssueDate) {
    warnings.push("ISSUE_DATE_NOT_FOUND");
  }

  if (!fallbackExpiryDate) {
    warnings.push("EXPIRY_DATE_NOT_FOUND");
  }

  return {
    extractedPayload,
    confidencePayload,
    missingFields,
    warnings
  };
}