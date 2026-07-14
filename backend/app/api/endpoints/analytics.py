"""Analytics Endpoint"""
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
