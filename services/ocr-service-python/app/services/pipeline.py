import base64
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from app.config import settings
from app.schemas import ExtractRequest, ExtractResult
from app.services.pdf import extract_text_from_pdf_bytes


class OcrPipeline:
    def __init__(self) -> None:
        self.languages = settings.ocr_languages
        self.enable_ocrmypdf = settings.ocr_enable_ocrmypdf

    def extract(self, request: ExtractRequest) -> ExtractResult:
        raw_bytes = base64.b64decode(request.file_data_base64)

        content_type = request.content_type.lower().strip()

        if "pdf" in content_type:
            return self._extract_pdf(raw_bytes, request)

        if content_type.startswith("image/"):
            return ExtractResult(
                status="FAILED",
                source_type="OCR_IMAGE",
                extracted_text="",
                extracted_payload={"document_type": "NO_TEXT"},
                confidence_payload={"document_type": 0.0},
                missing_fields=["file_upload"],
                warnings=[
                    "IMAGE_PIPELINE_NOT_ENABLED_YET",
                    "NEXT_STEP_ENABLE_PADDLEOCR",
                ],
            )

        return ExtractResult(
            status="FAILED",
            source_type="MANUAL_MERGE",
            extracted_text="",
            extracted_payload={"document_type": "NO_TEXT"},
            confidence_payload={"document_type": 0.0},
            missing_fields=["file_upload"],
            warnings=["UNSUPPORTED_CONTENT_TYPE"],
        )

    def _extract_pdf(self, raw_bytes: bytes, request: ExtractRequest) -> ExtractResult:
        direct_text = extract_text_from_pdf_bytes(raw_bytes)

        if direct_text:
            return ExtractResult(
                status="PARTIAL",
                source_type="PDF_TEXT",
                extracted_text=direct_text,
                extracted_payload={
                    "document_type": request.document_type_hint
                    or "SUPPLIER_QUALIFICATION_DOCUMENT"
                },
                confidence_payload={
                    "document_type": 0.6 if request.document_type_hint else 0.3
                },
                missing_fields=[],
                warnings=["STRUCTURED_FIELD_PARSER_NOT_ENABLED_YET"],
            )

        if not self.enable_ocrmypdf:
            return ExtractResult(
                status="FAILED",
                source_type="OCR_SCANNED_PDF",
                extracted_text="",
                extracted_payload={"document_type": "NO_TEXT"},
                confidence_payload={"document_type": 0.0},
                missing_fields=["file_upload"],
                warnings=[
                    "SCANNED_PDF_DETECTED",
                    "OCRMYPDF_DISABLED",
                ],
            )

        ocrmypdf_bin = shutil.which("ocrmypdf")
        if not ocrmypdf_bin:
            return ExtractResult(
                status="FAILED",
                source_type="OCR_SCANNED_PDF",
                extracted_text="",
                extracted_payload={"document_type": "NO_TEXT"},
                confidence_payload={"document_type": 0.0},
                missing_fields=["file_upload"],
                warnings=[
                    "SCANNED_PDF_DETECTED",
                    "OCRMYPDF_NOT_INSTALLED",
                ],
            )

        Path(settings.ocr_temp_dir).mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory(dir=settings.ocr_temp_dir) as temp_dir:
            input_pdf = os.path.join(temp_dir, "input.pdf")
            output_pdf = os.path.join(temp_dir, "output.pdf")

            with open(input_pdf, "wb") as f:
                f.write(raw_bytes)

            cmd = [
                ocrmypdf_bin,
                "--skip-text",
                "--rotate-pages",
                "--deskew",
                "-l",
                self.languages,
                input_pdf,
                output_pdf,
            ]

            completed = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False,
            )

            if completed.returncode != 0:
                return ExtractResult(
                    status="FAILED",
                    source_type="OCR_SCANNED_PDF",
                    extracted_text="",
                    extracted_payload={"document_type": "NO_TEXT"},
                    confidence_payload={"document_type": 0.0},
                    missing_fields=["file_upload"],
                    warnings=[
                        "OCRMYPDF_FAILED",
                        completed.stderr.strip() or "UNKNOWN_OCRMYPDF_ERROR",
                    ],
                )

            ocr_text = extract_text_from_pdf_bytes(Path(output_pdf).read_bytes())

            if not ocr_text:
                return ExtractResult(
                    status="FAILED",
                    source_type="UNREADABLE_PDF",
                    extracted_text="",
                    extracted_payload={"document_type": "NO_TEXT"},
                    confidence_payload={"document_type": 0.0},
                    missing_fields=["file_upload"],
                    warnings=["NO_TEXT_EXTRACTED_AFTER_OCRMYPDF"],
                )

            return ExtractResult(
                status="PARTIAL",
                source_type="OCR_SCANNED_PDF",
                extracted_text=ocr_text,
                extracted_payload={
                    "document_type": request.document_type_hint
                    or "SUPPLIER_QUALIFICATION_DOCUMENT"
                },
                confidence_payload={
                    "document_type": 0.7 if request.document_type_hint else 0.4
                },
                missing_fields=[],
                warnings=["STRUCTURED_FIELD_PARSER_NOT_ENABLED_YET"],
            )