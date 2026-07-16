"""
Pydantic Schemas — CrimeGPT-X API
Request / Response models with validation
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID
from app.models.models import (
    UserRole, CaseStatus, CasePriority, CrimeCategory,
    EvidenceType, EvidenceCategory, DocumentType, DiaryEntryType
)


# ── Auth ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    badge_number: str = Field(..., min_length=5, max_length=50)
    password: str = Field(..., min_length=6)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserOut"

class UserCreate(BaseModel):
    badge_number: str = Field(..., min_length=5, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.IO
    police_station: str = "Ahmedabad Cyber Crime Branch"
    rank: Optional[str] = None

class UserOut(BaseModel):
    id: UUID
    badge_number: str
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    police_station: str
    rank: Optional[str] = None
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Case ─────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    fir_number: Optional[str] = None
    fir_date: Optional[datetime] = None
    police_station: str = "Ahmedabad Cyber Crime Branch"
    crime_category: CrimeCategory
    priority: CasePriority = CasePriority.MEDIUM

    victim_name: str = Field(..., min_length=2)
    victim_phone: Optional[str] = None
    victim_email: Optional[EmailStr] = None
    victim_address: Optional[str] = None
    victim_age: Optional[int] = Field(None, ge=1, le=120)
    amount_defrauded: float = Field(default=0.0, ge=0)

    accused_name: str = "Unknown"
    accused_phone: Optional[str] = None
    accused_address: Optional[str] = None
    accused_mode: Optional[str] = None

    witnesses: List[Dict[str, Any]] = []
    incident_description: str = Field(..., min_length=20)
    incident_location: Optional[str] = None
    incident_date: Optional[datetime] = None

    @field_validator('victim_email', mode='before')
    @classmethod
    def _empty_email_to_none(cls, v):
        return v or None

class CaseUpdate(BaseModel):
    fir_number: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    crime_category: Optional[CrimeCategory] = None
    victim_phone: Optional[str] = None
    victim_email: Optional[EmailStr] = None
    victim_address: Optional[str] = None
    amount_defrauded: Optional[float] = None
    accused_name: Optional[str] = None
    accused_phone: Optional[str] = None
    accused_address: Optional[str] = None
    accused_mode: Optional[str] = None
    incident_description: Optional[str] = None
    incident_location: Optional[str] = None
    witnesses: Optional[List[Dict[str, Any]]] = None

class CaseOut(BaseModel):
    id: UUID
    case_id: str
    fir_number: Optional[str] = None
    fir_date: Optional[datetime] = None
    police_station: str
    crime_category: CrimeCategory
    status: CaseStatus
    priority: CasePriority
    victim_name: str
    victim_phone: Optional[str] = None
    victim_address: Optional[str] = None
    amount_defrauded: float
    accused_name: str
    accused_phone: Optional[str] = None
    incident_description: str
    incident_location: Optional[str] = None
    incident_date: Optional[datetime] = None
    fir_ocr_text: Optional[str] = None
    fir_ocr_fields: Dict[str, Any] = {}
    ai_sections: List[Dict[str, Any]]
    ai_analyzed_at: Optional[datetime] = None
    io_officer_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    evidence_count: int = 0
    document_count: int = 0
    diary_count: int = 0
    witness_count: int = 0

    class Config:
        from_attributes = True

class CaseListOut(BaseModel):
    id: UUID
    case_id: str
    fir_number: Optional[str] = None
    crime_category: CrimeCategory
    status: CaseStatus
    priority: CasePriority
    victim_name: str
    accused_name: str
    amount_defrauded: float
    created_at: datetime

    class Config:
        from_attributes = True

class CaseSearchQuery(BaseModel):
    q: Optional[str] = None
    crime_category: Optional[CrimeCategory] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    officer_id: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=200)


# ── AI Analysis ──────────────────────────────────────────────

class AIAnalysisRequest(BaseModel):
    fir_text: str = Field(..., min_length=50)
    case_id: Optional[str] = None
    language: str = "en"

class LegalSection(BaseModel):
    section: str
    title: str
    description: str
    confidence: float = Field(..., ge=0, le=100)
    act: str  # BNS, BNSS, IT Act, BSA

class Judgment(BaseModel):
    title: str
    court: str
    year: Optional[str] = None
    citation: Optional[str] = None
    summary: str
    legal_relevance: str
    relevance_score: float = Field(..., ge=0, le=1)

class ExtractedEntity(BaseModel):
    name: str
    details: Optional[str] = None

class ExtractedEntities(BaseModel):
    victims: List[ExtractedEntity] = []
    suspects: List[ExtractedEntity] = []
    witnesses: List[ExtractedEntity] = []

class TimelineEvent(BaseModel):
    date: Optional[str] = None
    description: str

class RiskAssessment(BaseModel):
    level: str  # low | medium | high | critical
    score: float = Field(..., ge=0, le=100)
    factors: List[str] = []

class AIAnalysisResponse(BaseModel):
    sections: List[LegalSection]
    judgments: List[Judgment]
    judgments_message: Optional[str] = None
    crime_type_detected: str
    key_facts: List[str]
    entities: ExtractedEntities
    timeline: List[TimelineEvent]
    risk_assessment: RiskAssessment
    investigation_recommendations: List[str]
    model_used: str
    analysis_time_ms: int


# ── Document Generation ──────────────────────────────────────

class DocGenRequest(BaseModel):
    case_id: str
    doc_type: DocumentType
    language: str = "en"
    extra_fields: Optional[Dict[str, Any]] = {}

class DocGenResponse(BaseModel):
    id: UUID
    doc_type: DocumentType
    title: str
    content_html: str
    pdf_url: Optional[str] = None
    docx_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Evidence ─────────────────────────────────────────────────

class EvidenceOut(BaseModel):
    id: UUID
    file_name: str
    original_name: str
    file_size: int
    mime_type: Optional[str] = None
    evidence_type: EvidenceType
    category: EvidenceCategory
    sha256_hash: str
    is_verified: bool
    description: Optional[str] = None
    ocr_text: Optional[str] = None
    ai_analysis: Dict[str, Any] = {}
    tags: List[str]
    custody_chain: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Diary ─────────────────────────────────────────────────────

class DiaryEntryCreate(BaseModel):
    entry_type: DiaryEntryType
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    metadata: Dict[str, Any] = {}

class DiaryEntryOut(BaseModel):
    id: UUID
    entry_type: DiaryEntryType
    title: str
    description: Optional[str] = None
    is_automated: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Pagination ───────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    skip: int
    limit: int
    has_more: bool
