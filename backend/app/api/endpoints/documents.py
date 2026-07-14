"""Document Generation Endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Case, Document, DiaryEntry, DiaryEntryType, AuditLog
from app.schemas.schemas import DocGenRequest, DocGenResponse
from app.services.ai_service import ai_legal_service

router = APIRouter()

@router.post("/generate", response_model=DocGenResponse, status_code=201)
async def generate_document(
    payload: DocGenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case_result = await db.execute(
        select(Case).where(or_(Case.case_id == payload.case_id, Case.id == payload.case_id))
    )
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    import time
    start = time.time()
    case_data = {
        "case_id": case.case_id,
        "fir_number": case.fir_number,
        "police_station": case.police_station,
        "victim_name": case.victim_name,
        "victim_address": case.victim_address,
        "victim_phone": case.victim_phone,
        "accused_name": case.accused_name,
        "accused_address": case.accused_address,
        "accused_phone": case.accused_phone,
        "incident_description": case.incident_description,
        "amount_defrauded": case.amount_defrauded,
        "ai_sections": case.ai_sections or [],
        "io_name": current_user.name,
        "io_badge": current_user.badge_number,
    }

    html_content = await ai_legal_service.generate_document(
        doc_type=payload.doc_type.value,
        case_data=case_data,
        language=payload.language,
    )
    elapsed = int((time.time() - start) * 1000)

    doc_titles = {
        "chargesheet": "Chargesheet (आरोप पत्र)",
        "remand_request": "Remand Request Letter",
        "panchanama": "Accused Panchanama (पंचनामा)",
        "seizure_receipt": "Seizure Receipt (जब्ती पावती)",
        "purvani_chargesheet": "Purvani Chargesheet",
        "court_custody": "Court Custody Letter",
        "medical_letter": "Medical Treatment Letter",
        "face_id_form": "Face Identification Form",
    }

    doc = Document(
        case_id=case.id,
        generated_by_id=current_user.id,
        doc_type=payload.doc_type,
        title=doc_titles.get(payload.doc_type.value, payload.doc_type.value),
        language=payload.language,
        content_html=html_content,
        ai_model_used="claude",
        generation_time_ms=elapsed,
    )
    db.add(doc)

    db.add(DiaryEntry(
        case_id=case.id,
        created_by_id=current_user.id,
        entry_type=DiaryEntryType.DOCUMENT_GENERATED,
        title=f"Document Generated: {doc_titles.get(payload.doc_type.value)}",
        is_automated=True,
    ))
    db.add(AuditLog(
        user_id=current_user.id,
        user_badge=current_user.badge_number,
        user_name=current_user.name,
        action="DOC_GENERATE",
        resource_type="document",
        resource_id=case.case_id,
        extra_data={"doc_type": payload.doc_type.value},
    ))
    await db.commit()
    await db.refresh(doc)
    return DocGenResponse.model_validate(doc)


@router.get("/{case_id}")
async def list_documents(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).join(Case).where(
            or_(Case.case_id == case_id, Case.id == case_id)
        ).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return [DocGenResponse.model_validate(d) for d in docs]
