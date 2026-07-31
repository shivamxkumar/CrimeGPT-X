"""Admin Panel Endpoint"""
import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text as sqltext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.core.database import get_db
from app.core.auth import require_role
from app.models.models import User, AuditLog

router = APIRouter()


async def _check_service(fn) -> str:
    try:
        await fn()
        return "online"
    except Exception:
        return "offline"


@router.get("/system-status")
async def system_status(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Real infrastructure introspection — no fabricated metrics."""

    async def _check_redis():
        import redis.asyncio as aioredis
        client = aioredis.from_url(settings.REDIS_URL)
        try:
            await client.ping()
        finally:
            await client.aclose()

    async def _check_minio():
        from app.services.evidence_service import evidence_service
        minio = await asyncio.to_thread(evidence_service._get_minio)
        if not minio:
            raise RuntimeError("MinIO not configured")
        await asyncio.to_thread(minio.list_buckets)

    async def _check_chroma():
        from app.services.ai_service import get_chroma
        await get_chroma()

    services = {
        "postgresql": await _check_service(lambda: db.execute(sqltext("SELECT 1"))),
        "redis": await _check_service(_check_redis),
        "object_storage": await _check_service(_check_minio),
        "vector_db_chromadb": await _check_service(_check_chroma),
        "gemini_api_key_configured": "configured" if settings.GEMINI_API_KEY else "missing",
    }

    since_hour = datetime.now(timezone.utc) - timedelta(hours=1)
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar()
    requests_last_hour = (await db.execute(
        select(func.count(AuditLog.id)).where(AuditLog.created_at >= since_hour)
    )).scalar()

    return {
        "services": services,
        "active_users": active_users,
        "audit_events_last_hour": requests_last_hour,
        "ai_model": settings.AI_MODEL,
    }

@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "sho")),
):
    result = await db.execute(select(User).offset(skip).limit(limit).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [{"id": str(u.id), "badge": u.badge_number, "name": u.name, "role": u.role.value, "is_active": u.is_active, "last_login": str(u.last_login)} for u in users]

@router.get("/audit-logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    result = await db.execute(select(AuditLog).offset(skip).limit(limit).order_by(AuditLog.created_at.desc()))
    logs = result.scalars().all()
    return [{"id": str(l.id), "user": l.user_name, "badge": l.user_badge, "action": l.action, "resource": l.resource_type, "resource_id": l.resource_id, "ip": l.ip_address, "created_at": str(l.created_at), "success": l.success} for l in logs]

@router.patch("/users/{user_id}/toggle-active")
async def toggle_user(user_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_role("admin"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    await db.commit()
    return {"user_id": user_id, "is_active": user.is_active}
