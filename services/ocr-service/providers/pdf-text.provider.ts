import pdfParse from "pdf-parse";
import { OcrProvider } from "../domain/ocr-provider";
import { OcrPageResult } from "../types/ocr.types";

export class PdfTextProvider implements OcrProvider {
  async extractFromPdf(buffer: Buffer): Promise<OcrPageResult[]> {
    const result = await pdfParse(buffer);
    const text = (result.text ?? "").trim();

    if (!text) {
      return [];
    }

    return [
      {
        page_number: 1,
        text,
        confidence: 0.92
      }
    ];
  }

  async extractFromImage(_buffer: Buffer): Promise<OcrPageResult[]> {
    return [];
  }
}