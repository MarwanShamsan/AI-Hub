from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ocr_service_port: int = 8010
    ocr_languages: str = "eng+ara"
    ocr_temp_dir: str = "/tmp/ocr-service"
    ocr_enable_ocrmypdf: bool = True


settings = Settings()