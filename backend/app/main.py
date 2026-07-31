"""
CrimeGPT-X - AI-Powered Crime Documentation & Legal Intelligence Platform
FastAPI Backend — Ahmedabad Cyber Crime Branch
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import time
import logging

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.rate_limit import limiter
from app.core.seed import run_bootstrap
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
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

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
    if settings.SEED_DEMO_DATA:
        async with AsyncSessionLocal() as db:
            await run_bootstrap(db)
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
