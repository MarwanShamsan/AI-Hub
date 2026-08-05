from fastapi import FastAPI
from app.config import settings
from app.schemas import ExtractRequest, ExtractResponse
from app.services.pipeline import OcrPipeline

app = FastAPI(title="ocr-service-python", version="0.1.0")
pipeline = OcrPipeline()


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "ocr-service-python",
    }


@app.post("/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest) -> ExtractResponse:
    result = pipeline.extract(request)
    return ExtractResponse(status="ACCEPTED", result=result)