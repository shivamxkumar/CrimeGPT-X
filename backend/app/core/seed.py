"""Post-migration bootstrap: demo users, perf indexes, and a reporting view.

Runs after Base.metadata.create_all on backend startup — not as a Postgres
docker-entrypoint-initdb.d script, since that runs before any application
tables exist (and, on Railway's managed Postgres, never runs at all).
Everything here is idempotent so it's safe to run on every startup.
"""
import logging

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import hash_password
from app.models.models import User, UserRole

logger = logging.getLogger(__name__)

DEMO_PASSWORD = "demo1234"

DEMO_USERS = [
    dict(badge_number="AHM-24-IO-047", name="SI Rajesh Sharma",
         email="rajesh.sharma@gujaratpolice.gov.in", phone="9825100047",
         role=UserRole.IO, police_station="Ahmedabad Cyber Crime Branch", rank="Sub-Inspector"),
    dict(badge_number="AHM-23-SHO-012", name="DySP Amit Patel",
         email="amit.patel@gujaratpolice.gov.in", phone="9825100012",
         role=UserRole.SHO, police_station="Ahmedabad Cyber Crime Branch", rank="Deputy Superintendent"),
    dict(badge_number="LEG-24-001", name="Adv. Priya Mehta",
         email="priya.mehta@gujaratpolice.gov.in", phone="9825100001",
         role=UserRole.LEGAL, police_station="Legal Cell, HQ", rank="Legal Advisor"),
    dict(badge_number="ADM-24-001", name="Admin Saurabh Shah",
         email="admin@gujaratpolice.gov.in", phone="9825100000",
         role=UserRole.ADMIN, police_station="HQ Gandhinagar", rank="System Administrator"),
    dict(badge_number="AHM-24-IO-053", name="SI Anita Verma",
         email="anita.verma@gujaratpolice.gov.in", phone="9825100053",
         role=UserRole.IO, police_station="Ahmedabad Cyber Crime Branch", rank="Sub-Inspector"),
]

PERF_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_cases_fts ON cases
USING gin(to_tsvector('english', coalesce(victim_name,'') || ' ' || coalesce(accused_name,'') || ' ' || coalesce(incident_description,'')));
CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_diary_case ON diary_entries(case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
"""

REPORTING_VIEW = """
CREATE OR REPLACE VIEW v_active_cases_summary AS
SELECT
    c.case_id,
    c.fir_number,
    c.crime_category,
    c.status,
    c.priority,
    c.victim_name,
    c.accused_name,
    c.amount_defrauded,
    u.name AS io_name,
    c.created_at,
    (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) AS evidence_count,
    (SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id) AS document_count
FROM cases c
JOIN users u ON c.io_officer_id = u.id
WHERE c.status != 'CLOSED';
"""


async def seed_demo_users(db: AsyncSession) -> None:
    existing = await db.execute(select(func.count()).select_from(User))
    if existing.scalar_one() > 0:
        return
    hashed = hash_password(DEMO_PASSWORD)
    for u in DEMO_USERS:
        db.add(User(hashed_password=hashed, is_active=True, is_verified=True, is_demo=True, **u))
    await db.commit()
    logger.info(f"Seeded {len(DEMO_USERS)} demo users (badge / password: <badge> / {DEMO_PASSWORD})")


async def create_perf_indexes_and_views(db: AsyncSession) -> None:
    for statement in PERF_INDEXES.strip().split(";"):
        statement = statement.strip()
        if statement:
            await db.execute(text(statement))
    await db.execute(text(REPORTING_VIEW))
    await db.commit()


async def run_bootstrap(db: AsyncSession) -> None:
    try:
        await create_perf_indexes_and_views(db)
    except Exception as e:
        await db.rollback()
        logger.warning(f"Skipping perf indexes/view bootstrap: {e}")
    try:
        await seed_demo_users(db)
    except Exception as e:
        await db.rollback()
        logger.warning(f"Skipping demo user seed: {e}")
