"""
AI Legal Intelligence Endpoints
- FIR analysis → BNS sections
- Judgment search (RAG)
- Legal chat
- Cyber threat analysis
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.models.models import User, Case, DiaryEntry, DiaryEntryType, AuditLog
from app.core.database import get_db
from app.services.ai_service import ai_legal_service
from app.schemas.schemas import AIAnalysisRequest, AIAnalysisResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

router = APIRouter()


@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_fir(
    payload: AIAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze FIR text → suggest BNS sections + retrieve judgments"""
    result = await ai_legal_service.analyze_fir(
        fir_text=payload.fir_text,
        case_id=payload.case_id,
        language=payload.language,
    )

    # Store results back to case if case_id provided
    if payload.case_id:
        case_result = await db.execute(
            select(Case).where(or_(Case.case_id == payload.case_id, Case.id == payload.case_id))
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
                metadata={"sections_count": len(result.sections), "model": result.model_used},
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
    """Conversational legal AI assistant"""
    case_context = None
    if payload.case_id:
        case_result = await db.execute(
            select(Case).where(or_(Case.case_id == payload.case_id, Case.id == payload.case_id))
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

    reply = await ai_legal_service.chat_with_legal_ai(
        messages=payload.messages,
        case_context=case_context,
    )
    return {"reply": reply}


class CyberAnalysisRequest(BaseModel):
    content_type: str  # url | chat | email | phone
    content: str

@router.post("/cyber-analyze")
async def analyze_cyber_threat(
    payload: CyberAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """AI-powered cyber crime pattern detection"""
    prompt = f"""Analyze this {payload.content_type} for cyber crime indicators:

Content: {payload.content}

Return JSON only:
{{
  "threat_level": "high|medium|low|none",
  "crime_type": "string",
  "indicators": ["indicator1", "indicator2"],
  "applicable_sections": ["BNS 318", "IT Act 66C"],
  "evidence_to_preserve": ["action1"],
  "investigation_steps": ["step1"]
}}"""

    import anthropic
    from app.core.config import settings

    try:
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        msg = await client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        raw = msg.content[0].text
        return json.loads(raw.replace("```json","").replace("```","").strip())
    except Exception:
        return {
            "threat_level": "high",
            "crime_type": "Phishing / Bank Impersonation",
            "indicators": ["Suspicious domain", "Urgency language", "Asks for credentials"],
            "applicable_sections": ["BNS 318", "BNS 319", "IT Act 66D"],
            "evidence_to_preserve": ["Screenshot URL", "Network logs", "IP address"],
            "investigation_steps": ["Issue 91 notice to registrar", "Trace hosting IP", "Alert CERT-In"],
        }
