"""Notification tasks — email + in-app alerts"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.worker import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.notify_tasks.send_email")
def send_email(to: str, subject: str, body: str, html_body: str = None):
    """Send email notification"""
    if not settings.SMTP_USER:
        logger.warning("Email not configured — skipping")
        return {"skipped": True}
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[CrimeGPT-X] {subject}"
        msg["From"] = settings.SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return {"sent": True, "to": to}
    except Exception as e:
        logger.error(f"Email failed: {e}")
        return {"error": str(e)}


@celery_app.task(name="app.tasks.notify_tasks.send_deadline_alerts")
def send_deadline_alerts():
    """Periodic task — check for upcoming court deadlines and create real alerts"""
    import asyncio
    from datetime import datetime
    from app.core.database import AsyncSessionLocal
    from app.services.notification_service import notification_service

    async def _run():
        async with AsyncSessionLocal() as db:
            return await notification_service.check_remand_deadlines(db)

    logger.info("Checking for upcoming case deadlines...")
    count = asyncio.run(_run())
    logger.info(f"Created {count} deadline alert(s)")
    return {"alerts_created": count, "timestamp": datetime.utcnow().isoformat()}
