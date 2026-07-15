"""
CrimeGPT-X Database Models
PostgreSQL schema via SQLAlchemy ORM
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean,
    DateTime, Enum, ForeignKey, JSON, Index, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


# ── Enums ────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    IO = "io"                    # Investigation Officer
    SHO = "sho"                  # Station House Officer / Supervisor
    LEGAL = "legal"              # Legal Advisor
    ADMIN = "admin"              # Administrator

class CaseStatus(str, enum.Enum):
    REGISTERED = "registered"
    ACTIVE = "active"
    IN_REVIEW = "in_review"
    CHARGESHEET = "chargesheet"
    COURT = "court"
    CLOSED = "closed"

class CasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CrimeCategory(str, enum.Enum):
    UPI_FRAUD = "upi_fraud"
    PHISHING = "phishing"
    INVESTMENT_SCAM = "investment_scam"
    WHATSAPP_FRAUD = "whatsapp_fraud"
    SOCIAL_MEDIA = "social_media"
    OTP_FRAUD = "otp_fraud"
    FAKE_APP = "fake_app"
    SEXTORTION = "sextortion"
    RANSOMWARE = "ransomware"
    OTHER = "other"

class EvidenceType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    PDF = "pdf"
    DOCUMENT = "document"
    SCREENSHOT = "screenshot"
    CHAT_EXPORT = "chat_export"
    BANK_STATEMENT = "bank_statement"
    OTHER = "other"

class EvidenceCategory(str, enum.Enum):
    CRITICAL = "critical"
    PRIMARY = "primary"
    SUPPORTING = "supporting"
    CORROBORATIVE = "corroborative"

class DocumentType(str, enum.Enum):
    CHARGESHEET = "chargesheet"
    PURVANI_CHARGESHEET = "purvani_chargesheet"
    REMAND_REQUEST = "remand_request"
    MEDICAL_LETTER = "medical_letter"
    SEIZURE_RECEIPT = "seizure_receipt"
    COURT_CUSTODY = "court_custody"
    PANCHANAMA = "panchanama"
    FACE_ID_FORM = "face_id_form"
    WITNESS_STATEMENT = "witness_statement"
    ARREST_MEMO = "arrest_memo"

class DiaryEntryType(str, enum.Enum):
    FIR_REGISTERED = "fir_registered"
    AI_ANALYSIS = "ai_analysis"
    EVIDENCE_UPLOAD = "evidence_upload"
    WITNESS_STATEMENT = "witness_statement"
    ARREST = "arrest"
    COURT_SUBMISSION = "court_submission"
    DOCUMENT_GENERATED = "document_generated"
    NOTE = "note"
    STATUS_CHANGE = "status_change"


# ── Models ───────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    badge_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    hashed_password = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.IO)
    police_station = Column(String(200), default="Ahmedabad Cyber Crime Branch")
    rank = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    cases_as_io = relationship("Case", back_populates="io_officer", foreign_keys="Case.io_officer_id")
    audit_logs = relationship("AuditLog", back_populates="user")


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(String(30), unique=True, nullable=False, index=True)  # CC/2024/0847
    fir_number = Column(String(50), index=True)
    fir_date = Column(DateTime(timezone=True))
    police_station = Column(String(200), nullable=False)

    # Classification
    crime_category = Column(Enum(CrimeCategory), nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.REGISTERED)
    priority = Column(Enum(CasePriority), default=CasePriority.MEDIUM)

    # Victim
    victim_name = Column(String(200), nullable=False)
    victim_phone = Column(String(20))
    victim_email = Column(String(200))
    victim_address = Column(Text)
    victim_age = Column(Integer)
    amount_defrauded = Column(Float, default=0.0)

    # Accused
    accused_name = Column(String(200), default="Unknown")
    accused_phone = Column(String(20))
    accused_address = Column(Text)
    accused_mode = Column(String(200))  # mode of fraud

    # Witnesses — stored as JSON array
    witnesses = Column(JSONB, default=list)

    # Incident
    incident_description = Column(Text, nullable=False)
    incident_location = Column(String(500))
    incident_date = Column(DateTime(timezone=True))

    # AI Analysis Results
    ai_sections = Column(JSONB, default=list)        # [{section, title, confidence, act}]
    ai_judgments = Column(JSONB, default=list)       # [{title, court, summary, relevance}]
    ai_analysis_raw = Column(Text)
    ai_analyzed_at = Column(DateTime(timezone=True))

    # FIR Upload
    fir_file_path = Column(String(500))
    fir_ocr_text = Column(Text)
    fir_ocr_fields = Column(JSONB, default=dict)

    # Meta
    io_officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True))
    court_submission_date = Column(DateTime(timezone=True))

    # Relations
    io_officer = relationship("User", back_populates="cases_as_io", foreign_keys=[io_officer_id])
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    diary_entries = relationship("DiaryEntry", back_populates="case", cascade="all, delete-orphan", order_by="DiaryEntry.created_at")

    __table_args__ = (
        Index("ix_case_victim_name", "victim_name"),
        Index("ix_case_accused_name", "accused_name"),
        Index("ix_case_category_status", "crime_category", "status"),
    )


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    file_name = Column(String(300), nullable=False)
    original_name = Column(String(300), nullable=False)
    file_path = Column(String(500), nullable=False)  # MinIO path
    file_size = Column(BigInteger, default=0)
    mime_type = Column(String(100))
    evidence_type = Column(Enum(EvidenceType), nullable=False)
    category = Column(Enum(EvidenceCategory), default=EvidenceCategory.PRIMARY)

    # Integrity
    sha256_hash = Column(String(64), nullable=False)
    md5_hash = Column(String(32))
    is_verified = Column(Boolean, default=False)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    verified_at = Column(DateTime(timezone=True))

    # Analysis
    ai_analysis = Column(JSONB, default=dict)    # manipulation detection, entity extraction
    ocr_text = Column(Text)
    tags = Column(ARRAY(String), default=list)
    description = Column(Text)

    # Chain of Custody
    custody_chain = Column(JSONB, default=list)  # [{officer, timestamp, action, notes}]

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    case = relationship("Case", back_populates="evidence")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    generated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    doc_type = Column(Enum(DocumentType), nullable=False)
    title = Column(String(300), nullable=False)
    language = Column(String(10), default="en")  # en, hi, gu

    # File paths
    docx_path = Column(String(500))
    pdf_path = Column(String(500))

    # Content (for editing)
    content_json = Column(JSONB, default=dict)  # structured content
    content_html = Column(Text)                  # rendered HTML

    # AI Generation metadata
    ai_model_used = Column(String(100))
    ai_prompt_tokens = Column(Integer, default=0)
    generation_time_ms = Column(Integer, default=0)

    # Status
    is_reviewed = Column(Boolean, default=False)
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))
    review_notes = Column(Text)

    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    case = relationship("Case", back_populates="documents")


class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    entry_type = Column(Enum(DiaryEntryType), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    entry_metadata = Column("metadata", JSONB, default=dict)
    is_automated = Column(Boolean, default=False)  # True = system-generated

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    case = relationship("Case", back_populates="diary_entries")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    user_badge = Column(String(50))          # denormalized for retention
    user_name = Column(String(150))

    action = Column(String(100), nullable=False)   # LOGIN, CASE_CREATE, DOC_GENERATE, etc.
    resource_type = Column(String(50))             # case, evidence, document, user
    resource_id = Column(String(100))              # UUID or case_id

    ip_address = Column(String(45))
    user_agent = Column(String(300))
    request_method = Column(String(10))
    request_path = Column(String(500))

    success = Column(Boolean, default=True)
    error_detail = Column(Text)
    extra_data = Column(JSONB, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_audit_user", "user_id"),
        Index("ix_audit_action", "action"),
        Index("ix_audit_created", "created_at"),
    )

    # Relations
    user = relationship("User", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    notification_type = Column(String(50))   # deadline, case_update, doc_ready
    related_case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
