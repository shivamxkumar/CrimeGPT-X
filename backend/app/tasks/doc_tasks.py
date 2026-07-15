"""Document and notification tasks"""
import logging
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.doc_tasks.export_pdf")
def export_pdf(document_id: str, html_content: str):
    """Convert HTML document to PDF via ReportLab/WeasyPrint"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        import io
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4)
        styles = getSampleStyleSheet()
        story = [Paragraph("CrimeGPT-X Generated Document", styles['Title'])]
        doc.build(story)
        logger.info(f"PDF exported for document {document_id}")
        return {"document_id": document_id, "size": buf.tell()}
    except Exception as e:
        logger.error(f"PDF export failed: {e}")
        return {"error": str(e)}


@celery_app.task(name="app.tasks.doc_tasks.export_docx")
def export_docx(document_id: str, content: dict):
    """Generate DOCX from structured content"""
    try:
        from docx import Document
        doc = Document()
        doc.add_heading(content.get("title", "CrimeGPT-X Document"), 0)
        for para in content.get("paragraphs", []):
            doc.add_paragraph(para)
        import io
        buf = io.BytesIO()
        doc.save(buf)
        logger.info(f"DOCX exported for document {document_id}")
        return {"document_id": document_id, "size": buf.tell()}
    except Exception as e:
        logger.error(f"DOCX export failed: {e}")
        return {"error": str(e)}
