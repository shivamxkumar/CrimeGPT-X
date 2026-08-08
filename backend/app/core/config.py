from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import secrets

class Settings(BaseSettings):
    # App
    APP_NAME: str = "CrimeGPT-X"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = secrets.token_urlsafe(32)
    PORT: int = 8000
    UPLOAD_FOLDER: str = "/tmp/crimegpt-uploads"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://crimegpt:crimegpt_pass@db:5432/crimegpt_db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    # Seeds demo users + perf indexes/view on startup if the users table is
    # empty. Safe to leave on — it's a no-op once real users exist. Set to
    # false to disable entirely (e.g. a hardened production deployment).
    SEED_DEMO_DATA: bool = True

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for police shifts

    # AI (Google Gemini)
    GEMINI_API_KEY: str = ""
    AI_MODEL: str = "gemini-3.5-flash"  # or "gemini-3.1-pro-preview" for higher-quality analysis
    AI_MAX_TOKENS: int = 4096

    # ChromaDB — set CHROMA_HOST to talk to a real ChromaDB server (Docker
    # Compose default). Leave CHROMA_HOST empty to fall back to an embedded
    # on-disk client instead — no separate ChromaDB service required, used
    # for free-tier deploys (e.g. Render) that have no room for a 5th service.
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    CHROMA_COLLECTION_JUDGMENTS: str = "landmark_judgments"

    # Object storage — MinIO locally (plain HTTP), or any S3-compatible
    # provider in production (e.g. Cloudflare R2) by pointing MINIO_ENDPOINT
    # at its host and setting MINIO_SECURE=true (R2/S3 require HTTPS).
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "crimegpt_admin"
    MINIO_SECRET_KEY: str = "crimegpt_secret_2024"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_EVIDENCE: str = "evidence"
    MINIO_BUCKET_DOCUMENTS: str = "documents"
    MINIO_BUCKET_FIR: str = "fir-uploads"

    # OCR — tesseract by default (lightweight, no torch). "easyocr" needs
    # the (heavy, torch-based) easyocr package installed separately; not in
    # requirements.txt by default since it doesn't fit free-tier RAM limits.
    OCR_ENGINE: str = "tesseract"  # easyocr | tesseract
    OCR_LANGUAGES: List[str] = ["en", "hi", "gu"]

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://crimegpt.gujaratpolice.gov.in",
    ]

    # Trusted Host header validation (prevents Host header injection).
    # "*" is permissive (matches prior no-op behavior); tighten in production
    # by setting this to the real backend domain(s).
    ALLOWED_HOSTS: List[str] = ["*"]

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

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
