import { OcrPageResult } from "../types/ocr.types";

export interface OcrProvider {
  extractFromPdf(buffer: Buffer): Promise<OcrPageResult[]>;
  extractFromImage(buffer: Buffer): Promise<OcrPageResult[]>;
}