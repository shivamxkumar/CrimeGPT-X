// ─── CrimeGPT-X Type Definitions ───────────────────────────────

export type UserRole = 'io' | 'sho' | 'legal' | 'admin'
export type CaseStatus = 'registered' | 'active' | 'in_review' | 'chargesheet' | 'court' | 'closed'
export type CasePriority = 'low' | 'medium' | 'high' | 'critical'
export type CrimeCategory =
  | 'upi_fraud' | 'phishing' | 'investment_scam'
  | 'whatsapp_fraud' | 'social_media' | 'otp_fraud'
  | 'fake_app' | 'sextortion' | 'ransomware' | 'other'

export type EvidenceType = 'image'|'video'|'audio'|'pdf'|'document'|'screenshot'|'chat_export'|'bank_statement'|'other'
export type EvidenceCategory = 'critical'|'primary'|'supporting'|'corroborative'
export type DocumentType =
  | 'chargesheet' | 'purvani_chargesheet' | 'remand_request'
  | 'medical_letter' | 'seizure_receipt' | 'court_custody'
  | 'panchanama' | 'face_id_form' | 'witness_statement' | 'arrest_memo'

export type DiaryEntryType =
  | 'fir_registered' | 'ai_analysis' | 'evidence_upload'
  | 'witness_statement' | 'arrest' | 'court_submission'
  | 'document_generated' | 'note' | 'status_change'

// ─── User ────────────────────────────────────────────────────
export interface User {
  id: string
  badge_number: string
  name: string
  email: string
  phone?: string
  role: UserRole
  police_station: string
  rank?: string
  is_active: boolean
  last_login?: string
  created_at: string
}

// ─── Case ────────────────────────────────────────────────────
export interface Case {
  id: string
  case_id: string
  fir_number?: string
  fir_date?: string
  police_station: string
  crime_category: CrimeCategory
  status: CaseStatus
  priority: CasePriority
  victim_name: string
  victim_phone?: string
  victim_address?: string
  victim_age?: number
  amount_defrauded: number
  accused_name: string
  accused_phone?: string
  accused_address?: string
  accused_mode?: string
  witnesses: Witness[]
  incident_description: string
  incident_location?: string
  incident_date?: string
  ai_sections: LegalSection[]
  ai_judgments?: Judgment[]
  ai_analyzed_at?: string
  io_officer_id: string
  created_at: string
  updated_at?: string
}

export interface CaseListItem {
  id: string
  case_id: string
  fir_number?: string
  crime_category: CrimeCategory
  status: CaseStatus
  priority: CasePriority
  victim_name: string
  accused_name: string
  amount_defrauded: number
  created_at: string
}

export interface Witness {
  name: string
  phone?: string
  address?: string
  statement?: string
}

// ─── AI Legal ────────────────────────────────────────────────
export interface LegalSection {
  section: string
  title: string
  description: string
  confidence: number
  act: string
}

export interface Judgment {
  title: string
  court: string
  year?: string
  citation?: string
  summary: string
  legal_relevance: string
  relevance_score: number
}

export interface AIAnalysisResult {
  sections: LegalSection[]
  judgments: Judgment[]
  crime_type_detected: string
  key_facts: string[]
  investigation_recommendations: string[]
  model_used: string
  analysis_time_ms: number
}

// ─── Evidence ────────────────────────────────────────────────
export interface Evidence {
  id: string
  file_name: string
  original_name: string
  file_size: number
  mime_type?: string
  evidence_type: EvidenceType
  category: EvidenceCategory
  sha256_hash: string
  is_verified: boolean
  description?: string
  tags: string[]
  custody_chain: CustodyEntry[]
  created_at: string
}

export interface CustodyEntry {
  officer_id: string
  officer_name: string
  action: string
  timestamp: string
  notes?: string
}

// ─── Document ────────────────────────────────────────────────
export interface Document {
  id: string
  doc_type: DocumentType
  title: string
  content_html: string
  pdf_url?: string
  docx_url?: string
  is_reviewed: boolean
  created_at: string
}

// ─── Diary ───────────────────────────────────────────────────
export interface DiaryEntry {
  id: string
  entry_type: DiaryEntryType
  title: string
  description?: string
  is_automated: boolean
  created_at: string
}

// ─── Analytics ───────────────────────────────────────────────
export interface AnalyticsOverview {
  total_cases: number
  active_cases: number
  closed_cases: number
  total_documents_generated: number
  total_evidence_files: number
  total_amount_defrauded: number
}

// ─── Notifications ───────────────────────────────────────────
export interface Notification {
  id: string
  title: string
  body: string
  type?: string
  is_read: boolean
  created_at: string
}

// ─── UI Helpers ──────────────────────────────────────────────
export const CRIME_CATEGORY_LABELS: Record<CrimeCategory, string> = {
  upi_fraud: 'UPI / Digital Fraud',
  phishing: 'Phishing',
  investment_scam: 'Investment Scam',
  whatsapp_fraud: 'WhatsApp Fraud',
  social_media: 'Social Media Fraud',
  otp_fraud: 'OTP Fraud',
  fake_app: 'Fake App / Website',
  sextortion: 'Sextortion',
  ransomware: 'Ransomware',
  other: 'Other Cyber Crime',
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  registered: 'Registered',
  active: 'Active',
  in_review: 'In Review',
  chargesheet: 'Chargesheet Filed',
  court: 'In Court',
  closed: 'Closed',
}

export const PRIORITY_COLORS: Record<CasePriority, string> = {
  critical: '#ff5252',
  high: '#ff5252',
  medium: '#ffa726',
  low: '#00e676',
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  chargesheet: 'Chargesheet (आरोप पत्र)',
  purvani_chargesheet: 'Purvani Chargesheet',
  remand_request: 'Remand Request Letter',
  medical_letter: 'Medical Treatment Letter',
  seizure_receipt: 'Seizure Receipt (जब्ती पावती)',
  court_custody: 'Court Custody Letter',
  panchanama: 'Accused Panchanama (पंचनामा)',
  face_id_form: 'Face Identification Form',
  witness_statement: 'Witness Statement',
  arrest_memo: 'Arrest Memo',
}
