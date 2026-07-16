"""Case Diary Endpoint"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Case, DiaryEntry
from app.schemas.schemas import DiaryEntryCreate, DiaryEntryOut
from app.core.query_helpers import case_lookup_clause

router = APIRouter()

@router.get("/recent")
async def get_recent_diary_entries(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recent diary entries across cases visible to the current user (real activity feed)."""
    query = select(DiaryEntry, Case.case_id).join(Case, DiaryEntry.case_id == Case.id)
    if current_user.role.value == "io":
        query = query.where(Case.io_officer_id == current_user.id)
    query = query.order_by(DiaryEntry.created_at.desc()).limit(limit)

    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": str(entry.id),
            "case_id": case_id,
            "entry_type": entry.entry_type.value,
            "title": entry.title,
            "description": entry.description,
            "is_automated": entry.is_automated,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
        }
        for entry, case_id in rows
    ]

@router.get("/{case_id:path}", response_model=list[DiaryEntryOut])
async def get_diary(case_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    case_result = await db.execute(select(Case).where(case_lookup_clause(case_id)))
    case = case_result.scalar_one_or_none()
    if not case: raise HTTPException(404, "Case not found")
    result = await db.execute(select(DiaryEntry).where(DiaryEntry.case_id == case.id).order_by(DiaryEntry.created_at))
    return [DiaryEntryOut.model_validate(e) for e in result.scalars().all()]

@router.post("/{case_id:path}", response_model=DiaryEntryOut, status_code=201)
async def add_diary_entry(case_id: str, payload: DiaryEntryCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    case_result = await db.execute(select(Case).where(case_lookup_clause(case_id)))
    case = case_result.scalar_one_or_none()
    if not case: raise HTTPException(404, "Case not found")
    data = payload.model_dump()
    data["entry_metadata"] = data.pop("metadata")
    entry = DiaryEntry(case_id=case.id, created_by_id=current_user.id, is_automated=False, **data)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return DiaryEntryOut.model_validate(entry)
