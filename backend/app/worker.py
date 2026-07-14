"""
CrimeGPT Celery Worker
Handles: AI analysis jobs, document generation, email notifications
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "crimegpt",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.ai_tasks", "app.tasks.doc_tasks", "app.tasks.notify_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_routes={
        "app.tasks.ai_tasks.*":     {"queue": "ai"},
        "app.tasks.doc_tasks.*":    {"queue": "documents"},
        "app.tasks.notify_tasks.*": {"queue": "notifications"},
        "app.tasks.*":              {"queue": "default"},
    },
    task_time_limit=300,      # 5 minute max per task
    task_soft_time_limit=240, # Soft limit: warn at 4 min
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)
