import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Case, User, AuditLog, DiaryEntry, DiaryEntryType, CaseStatus
from app.schemas.schemas import (
    CaseCreate, CaseUpdate, CaseOut, CaseListOut, PaginatedResponse
)

router = APIRouter()


def _generate_case_id() -> str:
    """Generate sequential case ID: CC/YYYY/NNNN"""
    year = datetime.utcnow().year
    # In production this would use DB sequence; using UUID slice for demo
    seq = str(uuid.uuid4().int)[:4].zfill(4)
    return f"CC/{year}/{seq}"


@router.post("/", response_model=CaseOut, status_code=201)
async def create_case(
    payload: CaseCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = Case(
        case_id=_generate_case_id(),
        io_officer_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(case)
    await db.flush()  # populate case.id (uuid4 default) before it's referenced below

    # Auto-create first diary entry
    db.add(DiaryEntry(
        case_id=case.id,
        created_by_id=current_user.id,
        entry_type=DiaryEntryType.FIR_REGISTERED,
        title="Case Registered",
        description=f"Case registered by {current_user.name}. FIR: {payload.fir_number or 'Pending'}",
        is_automated=True,
    ))

    # Audit
    db.add(AuditLog(
        user_id=current_user.id,
        user_badge=current_user.badge_number,
        user_name=current_user.name,
        action="CASE_CREATE",
        resource_type="case",
        resource_id=case.case_id,
        ip_address=request.client.host,
    ))

    await db.commit()
    await db.refresh(case)
    return CaseOut.model_validate(case)


@router.get("/", response_model=PaginatedResponse)
async def list_cases(
    q: Optional[str] = None,
    crime_category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Case)

    # Role-based filtering: IO sees only own cases
    if current_user.role.value == "io":
        query = query.where(Case.io_officer_id == current_user.id)

    if q:
        query = query.where(
            or_(
                Case.case_id.ilike(f"%{q}%"),
                Case.fir_number.ilike(f"%{q}%"),
                Case.victim_name.ilike(f"%{q}%"),
                Case.accused_name.ilike(f"%{q}%"),
                Case.victim_phone.ilike(f"%{q}%"),
            )
        )
    if crime_category:
        query = query.where(Case.crime_category == crime_category)
    if status:
        query = query.where(Case.status == status)
    if priority:
        query = query.where(Case.priority == priority)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    cases_result = await db.execute(query.offset(skip).limit(limit).order_by(Case.created_at.desc()))
    cases = cases_result.scalars().all()

    return PaginatedResponse(
        items=[CaseListOut.model_validate(c) for c in cases],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Case)
        .where(or_(Case.case_id == case_id, Case.id == case_id))
        .options(selectinload(Case.evidence), selectinload(Case.diary_entries))
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseOut.model_validate(case)


@router.patch("/{case_id}", response_model=CaseOut)
async def update_case(
    case_id: str,
    payload: CaseUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Case).where(
        or_(Case.case_id == case_id, Case.id == case_id)
    ))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(case, key, value)

    if "status" in update_data:
        db.add(DiaryEntry(
            case_id=case.id,
            created_by_id=current_user.id,
            entry_type=DiaryEntryType.STATUS_CHANGE,
            title=f"Status changed to {update_data['status']}",
            is_automated=True,
        ))
        if update_data["status"] == CaseStatus.CLOSED:
            case.closed_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        user_badge=current_user.badge_number,
        user_name=current_user.name,
        action="CASE_UPDATE",
        resource_type="case",
        resource_id=case.case_id,
        ip_address=request.client.host,
        extra_data={"updated_fields": list(update_data.keys())},
    ))
    await db.commit()
    await db.refresh(case)
    return CaseOut.model_validate(case)


@router.get("/stats/summary")
async def case_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard statistics"""
    total = await db.execute(select(func.count(Case.id)))
    active = await db.execute(select(func.count(Case.id)).where(Case.status == "active"))
    closed = await db.execute(select(func.count(Case.id)).where(Case.status == "closed"))
    pending = await db.execute(select(func.count(Case.id)).where(Case.status == "in_review"))

    return {
        "total": total.scalar(),
        "active": active.scalar(),
        "closed": closed.scalar(),
        "pending_review": pending.scalar(),
    }
