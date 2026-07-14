"""AI analysis background tasks"""
import asyncio
import logging
from app.worker import celery_app
from app.services.ai_service import ai_legal_service

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, name="app.tasks.ai_tasks.analyze_fir_async")
def analyze_fir_async(self, case_id: str, fir_text: str, user_id: str):
    """Background FIR analysis — triggered after FIR upload"""
    try:
        result = asyncio.run(
            ai_legal_service.analyze_fir(fir_text=fir_text, case_id=case_id)
        )
        logger.info(f"AI analysis complete for case {case_id}: {len(result.sections)} sections")
        return {
            "case_id": case_id,
            "sections_count": len(result.sections),
            "crime_type": result.crime_type_detected,
        }
    except Exception as exc:
        logger.error(f"AI analysis failed for {case_id}: {exc}")
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(bind=True, max_retries=2, name="app.tasks.ai_tasks.generate_doc_async")
def generate_doc_async(self, case_id: str, doc_type: str, case_data: dict, user_id: str):
    """Background document generation"""
    try:
        html = asyncio.run(
            ai_legal_service.generate_document(doc_type=doc_type, case_data=case_data)
        )
        logger.info(f"Document {doc_type} generated for case {case_id}")
        return {"case_id": case_id, "doc_type": doc_type, "html_length": len(html)}
    except Exception as exc:
        logger.error(f"Doc generation failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
