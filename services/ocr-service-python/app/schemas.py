from typing import Any, Literal

from pydantic import BaseModel, Field


SourceType = Literal[
    "PDF_TEXT",
    "OCR_SCANNED_PDF",
    "OCR_IMAGE",
    "MANUAL_MERGE",
    "UNREADABLE_PDF",
]

ResultStatus = Literal["SUCCEEDED", "FAILED", "PARTIAL"]


class ExtractRequest(BaseModel):
    file_name: str
    content_type: str
    file_data_base64: str
    document_type_hint: str | None = None
    language_hints: list[str] = Field(default_factory=list)


class ExtractResult(BaseModel):
    status: ResultStatus
    source_type: SourceType
    extracted_text: str
    extracted_payload: dict[str, Any]
    confidence_payload: dict[str, float]
    missing_fields: list[str]
    warnings: list[str]


class ExtractResponse(BaseModel):
    status: Literal["ACCEPTED"]
    result: ExtractResult