const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9"
};

export function normalizeDigits(
  value: string
): string {
  return Array.from(value)
    .map((character) =>
      ARABIC_DIGITS[character] ??
      character
    )
    .join("");
}

export function normalizeIdentifier(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  return normalizeDigits(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]/g, "");
}

export function normalizeLegalName(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  return normalizeDigits(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(
      /\blimited liability company\b/g,
      "llc"
    )
    .replace(/\bl\.?\s*l\.?\s*c\.?\b/g, "llc")
    .replace(/شركة ذات مسؤولية محدودة/g, "ذمم")
    .replace(/[^a-z0-9\u0600-\u06ff]/g, "");
}

const COUNTRY_ALIASES: Record<string, string> = {
  yemen: "YE",
  اليمن: "YE",
  ye: "YE",

  "united arab emirates": "AE",
  uae: "AE",
  الإمارات: "AE",
  "الإمارات العربية المتحدة": "AE",
  ae: "AE",

  saudiarabia: "SA",
  السعودية: "SA",
  sa: "SA"
};

export function normalizeCountry(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  const normalized = value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return (
    COUNTRY_ALIASES[normalized] ??
    normalized.toUpperCase()
  );
}

export type ParsedDate = {
  year: number;
  month: number;
  day: number;
  timestamp: number;
};

export function parseDocumentDate(
  rawValue: string | null
): ParsedDate | null {
  if (!rawValue) {
    return null;
  }

  const value = normalizeDigits(rawValue)
    .trim()
    .replace(/[.]/g, "/")
    .replace(/-/g, "/");

  let year: number;
  let month: number;
  let day: number;

  const isoMatch =
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(
      value
    );

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    const dayFirstMatch =
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
        value
      );

    if (!dayFirstMatch) {
      return null;
    }

    day = Number(dayFirstMatch[1]);
    month = Number(dayFirstMatch[2]);
    year = Number(dayFirstMatch[3]);
  }

  const timestamp =
    Date.UTC(year, month - 1, day);

  const parsed =
    new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    timestamp
  };
}

export function utcTodayTimestamp(
  now: Date
): number {
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
}