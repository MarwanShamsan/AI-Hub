export type ClassifiedDocumentType =
  | "TRADE_LICENSE"
  | "LEGAL_REGISTRATION"
  | "MANUFACTURING_LICENSE"
  | "EXPORT_LICENSE"
  | "QUALITY_CERTIFICATE"
  | "SUPPLIER_QUALIFICATION_DOCUMENT"
  | "UNKNOWN";

type CandidateType =
  | "TRADE_LICENSE"
  | "LEGAL_REGISTRATION"
  | "MANUFACTURING_LICENSE"
  | "EXPORT_LICENSE"
  | "QUALITY_CERTIFICATE";

type ScoreMap = Record<CandidateType, number>;

const TYPE_PATTERNS: Record<CandidateType, RegExp[]> = {
  TRADE_LICENSE: [
    /\bcommercial\s*license\b/i,
    /\btrade\s*license\b/i,
    /\blicen[cs]e\s*details\b/i,
    /\blicen[cs]e\s*no\b/i,
    /الرخصة\s*التجارية/i,
    /رخصة\s*تجارية/i
  ],
  LEGAL_REGISTRATION: [
    /\bcommercial\s*registration\b/i,
    /\bregistration\s*certificate\b/i,
    /\bcertificate\s*of\s*incorporation\b/i,
    /\bregister\s*no\b/i,
    /السجل\s*التجاري/i,
    /شهادة\s*تسجيل/i,
    /تسجيل\s*تجاري/i
  ],
  MANUFACTURING_LICENSE: [
    /\bmanufacturing\s*license\b/i,
    /\bindustrial\s*license\b/i,
    /\bfactory\s*license\b/i,
    /ترخيص\s*التصنيع/i,
    /ترخيص\s*صناعي/i,
    /رخصة\s*صناعية/i
  ],
  EXPORT_LICENSE: [
    /\bexport\s*license\b/i,
    /\bexport\s*permit\b/i,
    /رخصة\s*تصدير/i,
    /تصريح\s*تصدير/i
  ],
  QUALITY_CERTIFICATE: [
    /\bquality\s*certificate\b/i,
    /\bcertificate\s*of\s*quality\b/i,
    /\biso\s*9001\b/i,
    /\biso\s*14001\b/i,
    /شهادة\s*جودة/i,
    /شهادة\s*مطابقة/i
  ]
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\r/g, "\n")
    .replace(/[^\p{L}\p{N}\s:/.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addScoresFromPatterns(text: string, scores: ScoreMap) {
  (Object.keys(TYPE_PATTERNS) as CandidateType[]).forEach((type) => {
    for (const pattern of TYPE_PATTERNS[type]) {
      if (pattern.test(text)) {
        scores[type] += 1;
      }
    }
  });
}

function addStructuralScores(text: string, scores: ScoreMap) {
  const hasLicenseNo =
    /\blicen[cs]e\s*no\b/i.test(text) ||
    /\bmain\s*licen[cs]e\s*no\b/i.test(text) ||
    /رقم\s*الرخصة/i.test(text);

  const hasRegisterNo =
    /\bregister\s*no\b/i.test(text) ||
    /\bregistration\s*number\b/i.test(text) ||
    /رقم\s*السجل(?:\s*التجاري)?/i.test(text);

  const hasCompanyName =
    /\bcompany\s*name\b/i.test(text) ||
    /\bbusiness\s*name\b/i.test(text) ||
    /اسم\s*الشركة/i.test(text) ||
    /الاسم\s*التجاري/i.test(text);

  const hasIssueDate =
    /\bissue\s*date\b/i.test(text) ||
    /\bdate\s*of\s*issue\b/i.test(text) ||
    /تاريخ\s*الإصدار/i.test(text);

  const hasExpiryDate =
    /\bexpiry\s*date\b/i.test(text) ||
    /\bexpiration\s*date\b/i.test(text) ||
    /تاريخ\s*الانتهاء/i.test(text);

  if (hasLicenseNo) {
    scores.TRADE_LICENSE += 1.5;
    scores.MANUFACTURING_LICENSE += 0.5;
    scores.EXPORT_LICENSE += 0.5;
  }

  if (hasRegisterNo) {
    scores.LEGAL_REGISTRATION += 1.25;
    scores.TRADE_LICENSE += 0.5;
  }

  if (hasCompanyName && hasIssueDate && hasExpiryDate) {
    scores.TRADE_LICENSE += 0.75;
    scores.LEGAL_REGISTRATION += 0.5;
  }

  if (
    /department\s*of\s*econom/i.test(text) ||
    /government\s*of\s*dubai/i.test(text) ||
    /دبي\s*للاقتصاد\s*والسياحة/i.test(text)
  ) {
    scores.TRADE_LICENSE += 1;
  }

  if (
    /\bactivities\b/i.test(text) ||
    /أنشطة\s*الرخصة/i.test(text) ||
    /\blicense\s*members\b/i.test(text)
  ) {
    scores.TRADE_LICENSE += 0.75;
  }
}

function applyHintSoftly(
  hint: string | null | undefined,
  scores: ScoreMap
) {
  if (!hint) return;

  const normalizedHint = hint.toUpperCase() as CandidateType;
  if (!(normalizedHint in scores)) return;

  scores[normalizedHint] += 1.5;
}

function pickBest(scores: ScoreMap): ClassifiedDocumentType {
  const entries = Object.entries(scores) as Array<[CandidateType, number]>;
  entries.sort((a, b) => b[1] - a[1]);

  const [bestType, bestScore] = entries[0];
  const [, secondScore] = entries[1];

  if (bestScore <= 0) {
    return "UNKNOWN";
  }

  if (bestScore - secondScore < 0.5 && bestScore < 2) {
    return "SUPPLIER_QUALIFICATION_DOCUMENT";
  }

  return bestType;
}

export function classifyDocumentType(input: {
  text: string;
  hint?: string | null;
}): ClassifiedDocumentType {
  const normalized = normalizeText(input.text);

  if (!normalized) {
    return "UNKNOWN";
  }

  const scores: ScoreMap = {
    TRADE_LICENSE: 0,
    LEGAL_REGISTRATION: 0,
    MANUFACTURING_LICENSE: 0,
    EXPORT_LICENSE: 0,
    QUALITY_CERTIFICATE: 0
  };

  addScoresFromPatterns(normalized, scores);
  addStructuralScores(normalized, scores);
  applyHintSoftly(input.hint, scores);

  const best = pickBest(scores);

  if (best !== "UNKNOWN") {
    return best;
  }

  return "SUPPLIER_QUALIFICATION_DOCUMENT";
}