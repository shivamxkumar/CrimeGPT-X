"""Notifications Endpoint"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Notification

router = APIRouter()

@router.get("/")
async def get_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50)
    )
    notifs = result.scalars().all()
    return [{"id": str(n.id), "title": n.title, "body": n.body, "type": n.notification_type, "is_read": n.is_read, "created_at": str(n.created_at)} for n in notifs]

@router.patch("/{notif_id}/read")
async def mark_read(notif_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id))
    n = result.scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return {"status": "ok"}
