import { OcrProvider } from "../domain/ocr-provider";
import { OcrPageResult } from "../types/ocr.types";

export class NoopOcrProvider implements OcrProvider {
  async extractFromPdf(_buffer: Buffer): Promise<OcrPageResult[]> {
    return [];
  }

  async extractFromImage(_buffer: Buffer): Promise<OcrPageResult[]> {
    return [];
  }
}