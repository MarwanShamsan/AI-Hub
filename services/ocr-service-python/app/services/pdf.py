from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    parts: list[str] = []

    for page in reader.pages:
        page_text = page.extract_text() or ""
        page_text = page_text.strip()
        if page_text:
            parts.append(page_text)

    return "\n\n".join(parts).strip()