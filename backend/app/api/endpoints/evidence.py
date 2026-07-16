"""Evidence Upload Endpoint"""
import logging
import tempfile
import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Case, Evidence, EvidenceType, EvidenceCategory, DiaryEntry, DiaryEntryType, AuditLog
from app.schemas.schemas import EvidenceOut
from app.services.evidence_service import evidence_service, EvidenceStorageError
from app.services.ocr_service import ocr_service
from app.services.ai_service import ai_legal_service, AIServiceError
from app.core.query_helpers import case_lookup_clause

logger = logging.getLogger(__name__)
router = APIRouter()

def _infer_type(mime: str) -> EvidenceType:
    if "image" in mime: return EvidenceType.IMAGE
    if "video" in mime: return EvidenceType.VIDEO
    if "audio" in mime: return EvidenceType.AUDIO
    if "pdf" in mime: return EvidenceType.PDF
    return EvidenceType.OTHER


async def _extract_and_analyze(file_data: bytes, mime_type: str, description: str, case: Case) -> tuple[str, dict]:
    """Best-effort OCR + AI relevance analysis. Never fabricates content — on
    failure, returns a real error note instead of canned analysis."""
    ocr_text = ""
    if "image" in mime_type or "pdf" in mime_type:
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(file_data)
                tmp_path = tmp.name
            ocr_result = await ocr_service.process_file(tmp_path, mime_type)
            ocr_text = ocr_result.get("raw_text", "")
        except Exception as e:
            logger.warning(f"Evidence OCR failed: {e}")
        finally:
            if tmp_path:
                os.unlink(tmp_path)

    try:
        analysis = await ai_legal_service.analyze_evidence(
            description=description,
            ocr_text=ocr_text,
            case_context={
                "case_id": case.case_id,
                "crime_category": case.crime_category.value,
                "victim": case.victim_name,
                "accused": case.accused_name,
            },
        )
    except AIServiceError as e:
        logger.warning(f"Evidence AI analysis unavailable: {e}")
        analysis = {"error": f"AI analysis unavailable: {e}"}

    return ocr_text, analysis


@router.post("/{case_id:path}/upload", response_model=EvidenceOut, status_code=201)
async def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    category: str = Form(default="primary"),
    description: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case_result = await db.execute(
        select(Case).where(case_lookup_clause(case_id))
    )
    case = case_result.scalar_one_or_none()
    if not case: raise HTTPException(status_code=404, detail="Case not found")

    file_data = await file.read()
    if len(file_data) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        storage_meta = await evidence_service.upload_evidence(
            case_id=str(case.id),
            file_data=file_data,
            original_filename=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            officer_id=str(current_user.id),
            officer_name=current_user.name,
        )
    except EvidenceStorageError as e:
        raise HTTPException(status_code=503, detail=f"Evidence storage unavailable: {e}")

    ocr_text, ai_analysis = await _extract_and_analyze(
        file_data, file.content_type or "", description, case
    )

    ev = Evidence(
        case_id=case.id,
        uploaded_by_id=current_user.id,
        evidence_type=_infer_type(file.content_type or ""),
        category=EvidenceCategory(category),
        description=description,
        ocr_text=ocr_text or None,
        ai_analysis=ai_analysis,
        **storage_meta,
    )
    db.add(ev)
    db.add(DiaryEntry(
        case_id=case.id,
        created_by_id=current_user.id,
        entry_type=DiaryEntryType.EVIDENCE_UPLOAD,
        title=f"Evidence Uploaded: {file.filename}",
        description=f"SHA-256: {storage_meta['sha256_hash'][:16]}...",
        is_automated=True,
    ))
    db.add(AuditLog(
        user_id=current_user.id, user_badge=current_user.badge_number, user_name=current_user.name,
        action="EVIDENCE_UPLOAD", resource_type="evidence", resource_id=str(case.case_id),
    ))
    await db.commit()
    await db.refresh(ev)
    return EvidenceOut.model_validate(ev)

@router.get("/{case_id:path}")
async def list_evidence(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Evidence).join(Case).where(
            case_lookup_clause(case_id)
        ).order_by(Evidence.created_at.desc())
    )
    return [EvidenceOut.model_validate(e) for e in result.scalars().all()]
