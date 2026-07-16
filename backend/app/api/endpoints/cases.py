from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, text
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Case, User, AuditLog, DiaryEntry, DiaryEntryType, CaseStatus
from app.schemas.schemas import (
    CaseCreate, CaseUpdate, CaseOut, CaseListOut, PaginatedResponse
)
from app.core.query_helpers import case_lookup_clause

router = APIRouter()


async def _generate_case_id(db: AsyncSession) -> str:
    """Generate sequential case ID: CC/YYYY/NNNN, race-safe under Postgres via
    an advisory transaction lock scoped to the current year; the SQLite test
    suite has no such lock primitive and just counts (single-threaded tests)."""
    year = datetime.utcnow().year
    prefix = f"CC/{year}/"

    if db.bind.dialect.name == "postgresql":
        await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:key))"), {"key": f"case_seq_{year}"})

    count_result = await db.execute(
        select(func.count(Case.id)).where(Case.case_id.like(f"{prefix}%"))
    )
    seq = (count_result.scalar() or 0) + 1
    return f"{prefix}{str(seq).zfill(4)}"


@router.post("/", response_model=CaseOut, status_code=201)
async def create_case(
    payload: CaseCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = Case(
        case_id=await _generate_case_id(db),
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


# NOTE: this route must be registered AFTER /stats/summary above — its
# {case_id:path} converter is greedy (needed since case_id values like
# "CC/2026/0001" contain slashes) and would otherwise swallow that request.
@router.get("/{case_id:path}", response_model=CaseOut)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Case)
        .where(case_lookup_clause(case_id))
        .options(selectinload(Case.evidence), selectinload(Case.diary_entries), selectinload(Case.documents))
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_out = CaseOut.model_validate(case)
    case_out.evidence_count = len(case.evidence)
    case_out.document_count = len(case.documents)
    case_out.diary_count = len(case.diary_entries)
    case_out.witness_count = len(case.witnesses or [])
    return case_out


@router.patch("/{case_id:path}", response_model=CaseOut)
async def update_case(
    case_id: str,
    payload: CaseUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Case).where(
        case_lookup_clause(case_id)
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
