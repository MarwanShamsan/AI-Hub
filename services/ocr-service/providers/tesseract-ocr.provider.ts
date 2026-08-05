import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createWorker } from "tesseract.js";
import pdfPoppler from "pdf-poppler";
import { OcrProvider } from "../domain/ocr-provider";
import { OcrPageResult } from "../types/ocr.types";
import {
  createImageVariants,
  PreprocessedImageVariant
} from "./image-preprocessor";

type PopplerConvertOptions = {
  format: "png";
  out_dir: string;
  out_prefix: string;
  page?: number | null;
};

type RecognizeCandidate = {
  text: string;
  confidence?: number;
  score: number;
  image_variant: string;
  page_segmentation_mode: string;
};

type ImageInput = string | Buffer;

async function ensureDir(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, {
    recursive: true
  });
}

async function listPngFiles(
  directoryPath: string,
  prefix: string
): Promise<string[]> {
  const entries = await fs.readdir(directoryPath);

  return entries
    .filter(
      (name) =>
        name.startsWith(prefix) &&
        name.toLowerCase().endsWith(".png")
    )
    .sort((first, second) =>
      first.localeCompare(second, undefined, {
        numeric: true
      })
    )
    .map((name) => path.join(directoryPath, name));
}

async function cleanupDir(directoryPath: string): Promise<void> {
  await fs.rm(directoryPath, {
    recursive: true,
    force: true
  });
}

function normalizeArabicAndPersianDigits(text: string): string {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return text.replace(/[٠-٩۰-۹]/g, (character) => {
    const arabicIndex = arabicDigits.indexOf(character);

    if (arabicIndex >= 0) {
      return String(arabicIndex);
    }

    const persianIndex = persianDigits.indexOf(character);

    if (persianIndex >= 0) {
      return String(persianIndex);
    }

    return character;
  });
}

function normalizeOcrText(text: string): string {
  return normalizeArabicAndPersianDigits(text)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/licen[cs]e\s*no\.?/gi, "License No")
    .replace(
      /main\s*licen[cs]e\s*no\.?/gi,
      "Main License No"
    )
    .replace(/register\s*no\.?/gi, "Register No")
    .replace(
      /registration\s*number/gi,
      "Registration Number"
    )
    .replace(/company\s*name/gi, "Company Name")
    .replace(/business\s*name/gi, "Business Name")
    .replace(/issue\s*date/gi, "Issue Date")
    .replace(/date\s*of\s*issue/gi, "Issue Date")
    .replace(/expiry\s*date/gi, "Expiry Date")
    .replace(/expiration\s*date/gi, "Expiry Date")
    .replace(/date\s*of\s*expiry/gi, "Expiry Date")
    .replace(
      /issuing\s*authority/gi,
      "Issuing Authority"
    )
    .replace(/issued\s*by/gi, "Issued By")
    .replace(
      /dep\.?\s*of\s*economic\s*development/gi,
      "Department of Economic Development"
    )
    .replace(
      /department\s*of\s*economy\s*and\s*tourism/gi,
      "Department of Economy and Tourism"
    )
    .replace(/\buae\b/gi, "United Arab Emirates")
    .replace(/\s+:\s+/g, ": ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function calculateReadableCharacterRatio(text: string): number {
  const characters = [...text].filter(
    (character) => !/\s/u.test(character)
  );

  if (characters.length === 0) {
    return 0;
  }

  const readableCharacters = characters.filter((character) =>
    /[\p{L}\p{N}:./\-]/u.test(character)
  );

  return readableCharacters.length / characters.length;
}

function scoreRecognizedText(
  text: string,
  confidence?: number
): number {
  const normalized = text.toLowerCase();

  const signals = [
    /company\s*name/i,
    /business\s*name/i,
    /license\s*no/i,
    /main\s*license\s*no/i,
    /register\s*no/i,
    /registration\s*number/i,
    /issue\s*date/i,
    /expiry\s*date/i,
    /department\s*of\s*econom/i,
    /government\s*of\s*dubai/i,
    /commercial\s*license/i,
    /trade\s*license/i,
    /الرخصة\s*التجارية/i,
    /اسم\s*الشركة/i,
    /الاسم\s*التجاري/i,
    /رقم\s*الرخصة/i,
    /رقم\s*السجل/i,
    /تاريخ\s*الإصدار/i,
    /تاريخ\s*الانتهاء/i,
    /جهة\s*الإصدار/i
  ];

  let signalScore = 0;

  for (const signal of signals) {
    if (signal.test(normalized)) {
      signalScore += 1;
    }
  }

  const textLength = normalized.replace(/\s+/g, "").length;

  const lengthScore =
    textLength > 500
      ? 3
      : textLength > 250
        ? 2
        : textLength > 120
          ? 1
          : textLength > 40
            ? 0.5
            : 0;

  const normalizedConfidence =
    typeof confidence === "number"
      ? Math.min(1, Math.max(0, confidence))
      : 0;

  const confidenceScore = normalizedConfidence * 4;

  const readableRatio =
    calculateReadableCharacterRatio(normalized);

  const readabilityScore = readableRatio * 2;

  const dateCount = countMatches(
    normalized,
    /\b(?:\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})\b/g
  );

  const numericCodeCount = countMatches(
    normalized,
    /\b\d{5,12}\b/g
  );

  const structuredValueScore =
    Math.min(dateCount, 3) * 0.4 +
    Math.min(numericCodeCount, 4) * 0.3;

  const suspiciousCharacterCount = countMatches(
    normalized,
    /[^\p{L}\p{N}\s:.,/()\-]/gu
  );

  const suspiciousCharacterPenalty =
    Math.min(suspiciousCharacterCount / 30, 2);

  return (
    signalScore +
    lengthScore +
    confidenceScore +
    readabilityScore +
    structuredValueScore -
    suspiciousCharacterPenalty
  );
}

function parsePageSegmentationModes(): string[] {
  const configuredModes =
    process.env.OCR_PSM_MODES?.trim();

  if (!configuredModes) {
    return ["3", "6", "11"];
  }

  const modes = configuredModes
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return modes.length > 0
    ? [...new Set(modes)]
    : ["3", "6", "11"];
}

export class TesseractOcrProvider implements OcrProvider {
  private readonly languages: string;
  private readonly psmModes: string[];

  constructor() {
    this.languages =
      process.env.OCR_LANGUAGES?.trim() ||
      "eng+ara";

    this.psmModes = parsePageSegmentationModes();
  }

  async extractFromPdf(
    buffer: Buffer
  ): Promise<OcrPageResult[]> {
    const temporaryRoot = path.join(
      os.tmpdir(),
      `ai-hub-ocr-${randomUUID()}`
    );

    const pdfPath = path.join(
      temporaryRoot,
      "input.pdf"
    );

    const outputDirectory = path.join(
      temporaryRoot,
      "pages"
    );

    const outputPrefix = "page";

    await ensureDir(outputDirectory);
    await fs.writeFile(pdfPath, buffer);

    try {
      const options: PopplerConvertOptions = {
        format: "png",
        out_dir: outputDirectory,
        out_prefix: outputPrefix,
        page: null
      };

      await pdfPoppler.convert(pdfPath, options);

      const imagePaths = await listPngFiles(
        outputDirectory,
        outputPrefix
      );

      if (imagePaths.length === 0) {
        return [];
      }

      return await this.extractFromImageInputs(
        imagePaths
      );
    } finally {
      await cleanupDir(temporaryRoot);
    }
  }

  async extractFromImage(
    buffer: Buffer
  ): Promise<OcrPageResult[]> {
    return await this.extractFromImageInputs([
      buffer
    ]);
  }

  private async extractFromImageInputs(
    inputs: ImageInput[]
  ): Promise<OcrPageResult[]> {
    const worker = await createWorker(
      this.languages
    );

    const workerAny = worker as any;

    try {
      const results: OcrPageResult[] = [];

      await workerAny.setParameters?.({
        preserve_interword_spaces: "1",
        user_defined_dpi: "300"
      });

      for (
        let index = 0;
        index < inputs.length;
        index += 1
      ) {
        const inputBuffer =
          await this.readImageInput(inputs[index]);

        const variants =
          await this.prepareImageVariants(
            inputBuffer
          );

        const best =
          await this.recognizeWithBestPass(
            workerAny,
            variants
          );

        if (!best.text.trim()) {
          continue;
        }

        results.push({
          page_number: index + 1,
          text: best.text,
          confidence: best.confidence
        });
      }

      return results;
    } finally {
      await worker.terminate();
    }
  }

  private async readImageInput(
    input: ImageInput
  ): Promise<Buffer> {
    if (Buffer.isBuffer(input)) {
      return input;
    }

    return await fs.readFile(input);
  }

  private async prepareImageVariants(
    input: Buffer
  ): Promise<PreprocessedImageVariant[]> {
    try {
      return await createImageVariants(input);
    } catch {
      // Keep OCR available even if Sharp cannot process
      // an unusual image format.
      return [
        {
          name: "NORMALIZED_COLOR",
          buffer: input
        }
      ];
    }
  }

  private async recognizeWithBestPass(
    worker: any,
    variants: PreprocessedImageVariant[]
  ): Promise<{
    text: string;
    confidence?: number;
  }> {
    const candidates: RecognizeCandidate[] = [];

    for (const variant of variants) {
      for (const psm of this.psmModes) {
        try {
          await worker.setParameters?.({
            tessedit_pageseg_mode: psm,
            preserve_interword_spaces: "1",
            user_defined_dpi: "300"
          });

          const recognized =
            await worker.recognize(
              variant.buffer as any
            );

          const rawText = String(
            recognized?.data?.text ?? ""
          ).trim();

          const normalizedText =
            normalizeOcrText(rawText);

          const rawConfidence =
            recognized?.data?.confidence;

          const confidence =
            typeof rawConfidence === "number"
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    rawConfidence / 100
                  )
                )
              : undefined;

          candidates.push({
            text: normalizedText,
            confidence,
            score: scoreRecognizedText(
              normalizedText,
              confidence
            ),
            image_variant: variant.name,
            page_segmentation_mode: psm
          });
        } catch {
          // A failed OCR pass must not prevent the
          // remaining variants and PSM modes from running.
        }
      }
    }

    if (candidates.length === 0) {
      return {
        text: "",
        confidence: undefined
      };
    }

    candidates.sort(
      (first, second) =>
        second.score - first.score
    );

    const best = candidates[0];

    return {
      text: best.text,
      confidence: best.confidence
    };
  }
}