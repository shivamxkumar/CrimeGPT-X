"""
CrimeGPT-X — Notification Service
In-app + email notifications for case events and deadlines
"""
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Notification, Case, User

logger = logging.getLogger(__name__)


class NotificationService:
    """Create and dispatch notifications"""

    async def create(
        self,
        db: AsyncSession,
        user_id: UUID,
        title: str,
        body: str,
        notification_type: str = "info",
        related_case_id: Optional[UUID] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            related_case_id=related_case_id,
        )
        db.add(notif)
        await db.flush()
        return notif

    async def notify_case_created(self, db: AsyncSession, case: Case, io_user: User):
        await self.create(
            db, io_user.id,
            title=f"Case Registered — {case.case_id}",
            body=f"Case {case.case_id} has been registered successfully. FIR: {case.fir_number or 'Pending'}",
            notification_type="case_created",
            related_case_id=case.id,
        )

    async def notify_ai_analysis_done(
        self, db: AsyncSession, case: Case, user_id: UUID, sections_count: int
    ):
        await self.create(
            db, user_id,
            title=f"AI Analysis Complete — {case.case_id}",
            body=f"AI identified {sections_count} applicable legal sections for {case.case_id}. Review and confirm in the Legal AI Engine.",
            notification_type="ai_complete",
            related_case_id=case.id,
        )

    async def notify_document_ready(
        self, db: AsyncSession, case: Case, user_id: UUID, doc_title: str
    ):
        await self.create(
            db, user_id,
            title=f"Document Ready — {doc_title}",
            body=f"{doc_title} has been generated for {case.case_id}. Review and export from the Documents section.",
            notification_type="doc_ready",
            related_case_id=case.id,
        )

    async def notify_evidence_uploaded(
        self, db: AsyncSession, case: Case, user_id: UUID, filename: str
    ):
        await self.create(
            db, user_id,
            title=f"Evidence Uploaded — {case.case_id}",
            body=f"File '{filename}' uploaded and SHA-256 verified for case {case.case_id}.",
            notification_type="evidence_upload",
            related_case_id=case.id,
        )

    async def check_remand_deadlines(self, db: AsyncSession):
        """Scheduled task: alert on upcoming court submission deadlines"""
        deadline_threshold = datetime.utcnow() + timedelta(hours=48)

        result = await db.execute(
            select(Case).where(
                Case.court_submission_date <= deadline_threshold,
                Case.status.in_(["active", "in_review"]),
            )
        )
        cases = result.scalars().all()

        for case in cases:
            hours_left = (case.court_submission_date - datetime.utcnow()).total_seconds() / 3600
            await self.create(
                db,
                user_id=case.io_officer_id,
                title=f"⏰ Court Deadline Alert — {case.case_id}",
                body=f"Chargesheet for {case.case_id} must be submitted in {hours_left:.0f} hours. Generate and review the chargesheet immediately.",
                notification_type="deadline",
                related_case_id=case.id,
            )
            logger.info(f"Deadline alert created for case {case.case_id}")

        await db.commit()
        return len(cases)

    async def get_unread_count(self, db: AsyncSession, user_id: UUID) -> int:
        from sqlalchemy import func
        result = await db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        return result.scalar() or 0

    async def mark_all_read(self, db: AsyncSession, user_id: UUID):
        from sqlalchemy import update
        await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await db.commit()


notification_service = NotificationService()
