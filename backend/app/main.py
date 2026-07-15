"""
CrimeGPT-X - AI-Powered Crime Documentation & Legal Intelligence Platform
FastAPI Backend — Ahmedabad Cyber Crime Branch
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CrimeGPT-X API",
    description="AI-Powered Crime Documentation & Legal Intelligence Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Middleware ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.time() - start)
    return response

@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    """Log all API calls for audit trail."""
    response = await call_next(request)
    if request.url.path.startswith("/api/v1") and request.method in ("POST","PUT","DELETE","PATCH"):
        logger.info(
            f"AUDIT | {request.method} {request.url.path} | "
            f"IP:{request.client.host} | Status:{response.status_code}"
        )
    return response

# ── Routes ──────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")

# ── Startup ─────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("CrimeGPT-X API started successfully")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "CrimeGPT-X API", "version": "1.0.0"}

@app.get("/")
async def root():
    return {
        "message": "CrimeGPT-X API",
        "tagline": "From FIR to Arrest – One Intelligent Investigation Platform",
        "docs": "/api/docs"
    }
