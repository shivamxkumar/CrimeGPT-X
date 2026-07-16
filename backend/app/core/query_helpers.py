"""Shared query helpers."""
import uuid
from sqlalchemy import or_
from app.models.models import Case


def case_lookup_clause(case_id: str):
    """WHERE clause matching a Case by its human case_id (e.g. "CC/2026/0001")
    or its UUID primary key.

    asyncpg validates every bound parameter against its column's declared type
    eagerly, even for the branch of an OR that won't ultimately match — so
    comparing a non-UUID string against the UUID `Case.id` column raises a
    DataError before Postgres ever evaluates the OR. Only include that branch
    when case_id is actually a valid UUID.
    """
    try:
        uuid.UUID(case_id)
    except (ValueError, AttributeError):
        return Case.case_id == case_id
    return or_(Case.case_id == case_id, Case.id == case_id)
