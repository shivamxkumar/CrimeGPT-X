from pydantic_settings import BaseSettings
from typing import List
import secrets

class Settings(BaseSettings):
    # App
    APP_NAME: str = "CrimeGPT"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = secrets.token_urlsafe(32)

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://crimegpt:crimegpt_pass@db:5432/crimegpt_db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for police shifts

    # AI
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "claude-sonnet-4-20250514"
    AI_MAX_TOKENS: int = 4096

    # ChromaDB
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION_JUDGMENTS: str = "landmark_judgments"
    CHROMA_COLLECTION_BNS: str = "bns_sections"

    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "crimegpt_admin"
    MINIO_SECRET_KEY: str = "crimegpt_secret_2024"
    MINIO_BUCKET_EVIDENCE: str = "evidence"
    MINIO_BUCKET_DOCUMENTS: str = "documents"
    MINIO_BUCKET_FIR: str = "fir-uploads"

    # OCR
    OCR_ENGINE: str = "easyocr"  # easyocr | tesseract
    OCR_LANGUAGES: List[str] = ["en", "hi", "gu"]

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://crimegpt.gujaratpolice.gov.in",
    ]

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: List[str] = [
        "application/pdf",
        "image/jpeg", "image/png", "image/tiff",
        "audio/mpeg", "video/mp4",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    # Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
