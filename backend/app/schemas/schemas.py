"""
Pydantic Schemas — CrimeGPT API
Request / Response models with validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
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
    phone: Optional[str]
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.IO
    police_station: str = "Ahmedabad Cyber Crime Branch"
    rank: Optional[str]

class UserOut(BaseModel):
    id: UUID
    badge_number: str
    name: str
    email: str
    phone: Optional[str]
    role: UserRole
    police_station: str
    rank: Optional[str]
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Case ─────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    fir_number: Optional[str]
    fir_date: Optional[datetime]
    police_station: str = "Ahmedabad Cyber Crime Branch"
    crime_category: CrimeCategory
    priority: CasePriority = CasePriority.MEDIUM

    victim_name: str = Field(..., min_length=2)
    victim_phone: Optional[str]
    victim_email: Optional[EmailStr]
    victim_address: Optional[str]
    victim_age: Optional[int] = Field(None, ge=1, le=120)
    amount_defrauded: float = Field(default=0.0, ge=0)

    accused_name: str = "Unknown"
    accused_phone: Optional[str]
    accused_address: Optional[str]
    accused_mode: Optional[str]

    witnesses: List[Dict[str, Any]] = []
    incident_description: str = Field(..., min_length=20)
    incident_location: Optional[str]
    incident_date: Optional[datetime]

class CaseUpdate(BaseModel):
    fir_number: Optional[str]
    status: Optional[CaseStatus]
    priority: Optional[CasePriority]
    crime_category: Optional[CrimeCategory]
    victim_phone: Optional[str]
    victim_email: Optional[EmailStr]
    victim_address: Optional[str]
    amount_defrauded: Optional[float]
    accused_name: Optional[str]
    accused_phone: Optional[str]
    accused_address: Optional[str]
    accused_mode: Optional[str]
    incident_description: Optional[str]
    incident_location: Optional[str]
    witnesses: Optional[List[Dict[str, Any]]]

class CaseOut(BaseModel):
    id: UUID
    case_id: str
    fir_number: Optional[str]
    fir_date: Optional[datetime]
    police_station: str
    crime_category: CrimeCategory
    status: CaseStatus
    priority: CasePriority
    victim_name: str
    victim_phone: Optional[str]
    victim_address: Optional[str]
    amount_defrauded: float
    accused_name: str
    accused_phone: Optional[str]
    incident_description: str
    incident_location: Optional[str]
    incident_date: Optional[datetime]
    ai_sections: List[Dict[str, Any]]
    ai_analyzed_at: Optional[datetime]
    io_officer_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class CaseListOut(BaseModel):
    id: UUID
    case_id: str
    fir_number: Optional[str]
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
    q: Optional[str]
    crime_category: Optional[CrimeCategory]
    status: Optional[CaseStatus]
    priority: Optional[CasePriority]
    officer_id: Optional[UUID]
    date_from: Optional[datetime]
    date_to: Optional[datetime]
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=200)


# ── AI Analysis ──────────────────────────────────────────────

class AIAnalysisRequest(BaseModel):
    fir_text: str = Field(..., min_length=50)
    case_id: Optional[str]
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
    year: Optional[str]
    citation: Optional[str]
    summary: str
    legal_relevance: str
    relevance_score: float = Field(..., ge=0, le=1)

class AIAnalysisResponse(BaseModel):
    sections: List[LegalSection]
    judgments: List[Judgment]
    crime_type_detected: str
    key_facts: List[str]
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
    pdf_url: Optional[str]
    docx_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Evidence ─────────────────────────────────────────────────

class EvidenceOut(BaseModel):
    id: UUID
    file_name: str
    original_name: str
    file_size: int
    mime_type: Optional[str]
    evidence_type: EvidenceType
    category: EvidenceCategory
    sha256_hash: str
    is_verified: bool
    description: Optional[str]
    tags: List[str]
    custody_chain: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Diary ─────────────────────────────────────────────────────

class DiaryEntryCreate(BaseModel):
    entry_type: DiaryEntryType
    title: str = Field(..., min_length=3)
    description: Optional[str]
    metadata: Dict[str, Any] = {}

class DiaryEntryOut(BaseModel):
    id: UUID
    entry_type: DiaryEntryType
    title: str
    description: Optional[str]
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
