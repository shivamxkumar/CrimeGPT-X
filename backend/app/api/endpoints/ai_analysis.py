"""
AI Legal Intelligence Endpoints
- FIR analysis → BNS/BNSS sections, entities, timeline, risk assessment
- Judgment search (RAG)
- Legal chat (question answering)
- Cyber threat analysis
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.models.models import User, Case, DiaryEntry, DiaryEntryType, AuditLog
from app.core.database import get_db
from app.services.ai_service import ai_legal_service, AIServiceError, NO_JUDGMENTS_MESSAGE
from app.schemas.schemas import AIAnalysisRequest, AIAnalysisResponse, Judgment
from app.core.query_helpers import case_lookup_clause
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

router = APIRouter()


@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_fir(
    payload: AIAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze FIR text → BNS/BNSS sections, entities, timeline, risk, judgments"""
    try:
        result = await ai_legal_service.analyze_fir(
            fir_text=payload.fir_text,
            case_id=payload.case_id,
            language=payload.language,
        )
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    # Store results back to case if case_id provided
    if payload.case_id:
        case_result = await db.execute(
            select(Case).where(case_lookup_clause(payload.case_id))
        )
        case = case_result.scalar_one_or_none()
        if case:
            case.ai_sections = [s.model_dump() for s in result.sections]
            case.ai_judgments = [j.model_dump() for j in result.judgments]
            case.ai_analysis_raw = payload.fir_text
            from datetime import datetime
            case.ai_analyzed_at = datetime.utcnow()

            db.add(DiaryEntry(
                case_id=case.id,
                created_by_id=current_user.id,
                entry_type=DiaryEntryType.AI_ANALYSIS,
                title="AI Legal Analysis Complete",
                description=f"AI identified {len(result.sections)} applicable sections. "
                            f"Crime type: {result.crime_type_detected}",
                is_automated=True,
                entry_metadata={"sections_count": len(result.sections), "model": result.model_used},
            ))

            db.add(AuditLog(
                user_id=current_user.id,
                user_badge=current_user.badge_number,
                user_name=current_user.name,
                action="AI_ANALYSIS",
                resource_type="case",
                resource_id=case.case_id,
            ))
            await db.commit()

    return result


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    case_id: Optional[str] = None

@router.post("/chat")
async def legal_chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Conversational legal AI assistant (question answering)"""
    case_context = None
    if payload.case_id:
        case_result = await db.execute(
            select(Case).where(case_lookup_clause(payload.case_id))
        )
        case = case_result.scalar_one_or_none()
        if case:
            case_context = {
                "case_id": case.case_id,
                "crime_category": case.crime_category.value,
                "victim": case.victim_name,
                "accused": case.accused_name,
                "amount": case.amount_defrauded,
                "ai_sections": case.ai_sections,
            }

    try:
        reply = await ai_legal_service.chat_with_legal_ai(
            messages=payload.messages,
            case_context=case_context,
        )
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=f"AI chat failed: {e}")
    return {"reply": reply}


@router.get("/judgments/search")
async def search_judgments(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
):
    """Real semantic search over the ingested judgments corpus (RAG)."""
    try:
        judgments, message = await ai_legal_service.search_judgments(query=q)
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=f"Judgment search failed: {e}")
    return {"judgments": judgments, "message": message}


class CyberAnalysisRequest(BaseModel):
    content_type: str  # url | chat | email | phone
    content: str

@router.post("/cyber-analyze")
async def analyze_cyber_threat(
    payload: CyberAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """AI-powered cyber crime pattern detection"""
    try:
        return await ai_legal_service.analyze_cyber_content(payload.content_type, payload.content)
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=f"Cyber analysis failed: {e}")
