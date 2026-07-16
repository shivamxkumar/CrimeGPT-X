"""Analytics Endpoint"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import User, Case, Document, Evidence, AuditLog, CaseStatus, CrimeCategory

router = APIRouter()

@router.get("/overview")
async def analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = (await db.execute(select(func.count(Case.id)))).scalar()
    active = (await db.execute(select(func.count(Case.id)).where(Case.status == CaseStatus.ACTIVE))).scalar()
    closed = (await db.execute(select(func.count(Case.id)).where(Case.status == CaseStatus.CLOSED))).scalar()
    total_docs = (await db.execute(select(func.count(Document.id)))).scalar()
    total_evidence = (await db.execute(select(func.count(Evidence.id)))).scalar()
    amount_result = (await db.execute(select(func.sum(Case.amount_defrauded)))).scalar()

    return {
        "total_cases": total,
        "active_cases": active,
        "closed_cases": closed,
        "total_documents_generated": total_docs,
        "total_evidence_files": total_evidence,
        "total_amount_defrauded": float(amount_result or 0),
    }

@router.get("/crime-distribution")
async def crime_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Case.crime_category, func.count(Case.id).label("count"))
        .group_by(Case.crime_category)
        .order_by(func.count(Case.id).desc())
    )
    return [{"category": row.crime_category.value, "count": row.count} for row in result]

@router.get("/weekly-trend")
async def weekly_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Real case-registration counts per day for the last 7 days."""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(func.date(Case.created_at).label("day"), func.count(Case.id).label("count"))
        .where(Case.created_at >= since)
        .group_by(func.date(Case.created_at))
        .order_by(func.date(Case.created_at))
    )
    return [{"day": str(row.day), "cases": row.count} for row in result]

@router.get("/document-stats")
async def document_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Real document-generation counts grouped by doc type."""
    result = await db.execute(
        select(Document.doc_type, func.count(Document.id).label("count"))
        .group_by(Document.doc_type)
        .order_by(func.count(Document.id).desc())
    )
    return [{"doc_type": row.doc_type.value, "count": row.count} for row in result]
