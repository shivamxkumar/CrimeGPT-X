"""
CrimeGPT API v1 — All Route Registrations
"""
from fastapi import APIRouter
from app.api.endpoints import (
    auth, cases, fir, ai_analysis, documents, evidence, diary, analytics, admin, notifications
)

router = APIRouter()

router.include_router(auth.router,          prefix="/auth",          tags=["Authentication"])
router.include_router(cases.router,         prefix="/cases",         tags=["Cases"])
router.include_router(fir.router,           prefix="/fir",           tags=["FIR Upload & OCR"])
router.include_router(ai_analysis.router,   prefix="/ai",            tags=["AI Legal Intelligence"])
router.include_router(documents.router,     prefix="/documents",     tags=["Document Generation"])
router.include_router(evidence.router,      prefix="/evidence",      tags=["Evidence Management"])
router.include_router(diary.router,         prefix="/diary",         tags=["Case Diary"])
router.include_router(analytics.router,     prefix="/analytics",     tags=["Analytics"])
router.include_router(admin.router,         prefix="/admin",         tags=["Administration"])
router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
