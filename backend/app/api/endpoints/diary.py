"""Case Diary Endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Case, DiaryEntry
from app.schemas.schemas import DiaryEntryCreate, DiaryEntryOut

router = APIRouter()

@router.get("/{case_id}", response_model=list[DiaryEntryOut])
async def get_diary(case_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    case_result = await db.execute(select(Case).where(or_(Case.case_id == case_id, Case.id == case_id)))
    case = case_result.scalar_one_or_none()
    if not case: raise HTTPException(404, "Case not found")
    result = await db.execute(select(DiaryEntry).where(DiaryEntry.case_id == case.id).order_by(DiaryEntry.created_at))
    return [DiaryEntryOut.model_validate(e) for e in result.scalars().all()]

@router.post("/{case_id}", response_model=DiaryEntryOut, status_code=201)
async def add_diary_entry(case_id: str, payload: DiaryEntryCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    case_result = await db.execute(select(Case).where(or_(Case.case_id == case_id, Case.id == case_id)))
    case = case_result.scalar_one_or_none()
    if not case: raise HTTPException(404, "Case not found")
    entry = DiaryEntry(case_id=case.id, created_by_id=current_user.id, is_automated=False, **payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return DiaryEntryOut.model_validate(entry)
