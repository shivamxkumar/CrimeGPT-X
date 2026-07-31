"""
Document Generation Endpoint
Renders legal documents via Jinja2 templates (fast path) with Gemini as the
fallback for doc types without a template. Supports on-demand PDF/DOCX export.
"""
import asyncio
import io
import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Case, Document, Evidence, DiaryEntry, DiaryEntryType, AuditLog
from app.schemas.schemas import DocGenRequest, DocGenResponse
from app.services.ai_service import ai_legal_service, AIServiceError
from app.services.doc_render_service import render_document
from app.services.multilingual_service import multilingual_service
from app.tasks.doc_tasks import render_pdf, render_docx
from app.core.query_helpers import case_lookup_clause
from app.core.http_helpers import content_disposition

router = APIRouter()

DOC_TITLES = {
    "chargesheet": "Chargesheet (आरोप पत्र)",
    "purvani_chargesheet": "Purvani Chargesheet",
    "remand_request": "Remand Request Letter",
    "medical_letter": "Medical Treatment Letter",
    "seizure_receipt": "Seizure Receipt (जब्ती पावती)",
    "court_custody": "Court Custody Letter",
    "panchanama": "Accused Panchanama (पंचनामा)",
    "face_id_form": "Face Identification Form",
    "witness_statement": "Witness Statement",
    "arrest_memo": "Arrest Memo",
}


async def _get_case_or_404(db: AsyncSession, case_id: str) -> Case:
    case_result = await db.execute(
        select(Case).where(case_lookup_clause(case_id))
    )
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


async def _build_case_data(db: AsyncSession, case: Case, current_user: User) -> dict:
    evidence_result = await db.execute(select(Evidence).where(Evidence.case_id == case.id))
    evidence_items = [
        {
            "original_name": e.original_name,
            "mime_type": e.mime_type,
            "sha256_hash": e.sha256_hash,
            "is_verified": e.is_verified,
            "description": e.description,
        }
        for e in evidence_result.scalars().all()
    ]

    return {
        "case_id": case.case_id,
        "fir_number": case.fir_number,
        "police_station": case.police_station,
        "victim_name": case.victim_name,
        "victim_address": case.victim_address,
        "victim_phone": case.victim_phone,
        "accused_name": case.accused_name,
        "accused_address": case.accused_address,
        "accused_phone": case.accused_phone,
        "accused_mode": case.accused_mode,
        "incident_description": case.incident_description,
        "incident_location": case.incident_location,
        "amount_defrauded": case.amount_defrauded,
        "ai_sections": case.ai_sections or [],
        "evidence_items": evidence_items,
        "io_name": current_user.name,
        "io_badge": current_user.badge_number,
    }


@router.post("/generate", response_model=DocGenResponse, status_code=201)
async def generate_document(
    payload: DocGenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = await _get_case_or_404(db, payload.case_id)
    start = time.time()
    case_data = await _build_case_data(db, case, current_user)

    # Step 1: Try Jinja2 template render (fast, always available, no AI call needed)
    try:
        html_content = render_document(payload.doc_type.value, case_data)
        ai_model_used = "jinja2"
    except ValueError:
        # Step 2: Fall back to Gemini generation for doc types without a template
        try:
            html_content = await ai_legal_service.generate_document(
                doc_type=payload.doc_type.value,
                case_data=case_data,
                language=payload.language,
            )
        except AIServiceError as e:
            raise HTTPException(status_code=502, detail=f"Document generation failed: {e}")
        ai_model_used = "gemini"

    if payload.language != "en":
        html_content = await multilingual_service.translate_document(html_content, payload.language)

    elapsed = int((time.time() - start) * 1000)
    title = DOC_TITLES.get(payload.doc_type.value, payload.doc_type.value)

    doc = Document(
        case_id=case.id,
        generated_by_id=current_user.id,
        doc_type=payload.doc_type,
        title=title,
        language=payload.language,
        content_html=html_content,
        ai_model_used=ai_model_used,
        generation_time_ms=elapsed,
    )
    db.add(doc)

    db.add(DiaryEntry(
        case_id=case.id,
        created_by_id=current_user.id,
        entry_type=DiaryEntryType.DOCUMENT_GENERATED,
        title=f"Document Generated: {title}",
        description=f"Generated in {elapsed}ms using {ai_model_used}",
        is_automated=True,
        entry_metadata={"doc_type": payload.doc_type.value, "generation_ms": elapsed},
    ))

    db.add(AuditLog(
        user_id=current_user.id,
        user_badge=current_user.badge_number,
        user_name=current_user.name,
        action="DOC_GENERATE",
        resource_type="document",
        resource_id=case.case_id,
        extra_data={"doc_type": payload.doc_type.value, "language": payload.language},
    ))

    await db.commit()
    await db.refresh(doc)
    return DocGenResponse.model_validate(doc)


@router.get("/by-case/{case_id:path}")
async def list_documents(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).join(Case).where(
            case_lookup_clause(case_id)
        ).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return [DocGenResponse.model_validate(d) for d in docs]


@router.get("/{doc_id}/html")
async def get_document_html(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return raw HTML for document preview"""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return HTMLResponse(content=doc.content_html or "<p>No content</p>")


@router.get("/{doc_id}/export/pdf")
async def export_document_pdf(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Render the document's real HTML content to PDF and stream it back."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.content_html:
        raise HTTPException(status_code=422, detail="Document has no content to export")

    try:
        # WeasyPrint's HTML->PDF layout/render is CPU-heavy and synchronous —
        # run it off the event loop so it doesn't stall every other request.
        pdf_bytes = await asyncio.to_thread(render_pdf, doc.content_html)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PDF export failed: {e}")

    filename = f"{doc.title.replace(' ', '_')}_{doc.id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": content_disposition(filename)},
    )


@router.get("/{doc_id}/export/docx")
async def export_document_docx(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Render the document's real HTML content to DOCX and stream it back."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.content_html:
        raise HTTPException(status_code=422, detail="Document has no content to export")

    try:
        docx_bytes = await asyncio.to_thread(render_docx, doc.title, doc.content_html)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DOCX export failed: {e}")

    filename = f"{doc.title.replace(' ', '_')}_{doc.id}.docx"
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": content_disposition(filename)},
    )
