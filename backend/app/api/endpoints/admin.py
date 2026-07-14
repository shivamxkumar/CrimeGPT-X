"""Admin Panel Endpoint"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.auth import require_role
from app.models.models import User, AuditLog

router = APIRouter()

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
