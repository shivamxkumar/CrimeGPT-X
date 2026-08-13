/**
 * Demo-mode implementations of the api.ts function groups. Every function
 * here returns an axios-response-shaped `{ data }` Promise so call sites
 * (`.then(r => r.data)`) work unchanged. Real backend calls are never made.
 *
 * Split by intent, not just by HTTP verb:
 *  - Reads (list/get/stats/overview/...) → return the mock dataset.
 *  - Stateless AI compute (analyze/chat/cyber-analyze/judgment-search) →
 *    return good canned/derived results. Nothing persists, so these stay
 *    interactive rather than blocked — it's what makes the demo feel alive.
 *  - True mutations (create/update/delete/upload) → blocked via
 *    blockDemoMutation(), which toasts and rejects. The dataset never changes.
 */
import { demoResponse, blockDemoMutation } from './demoMode'
import {
  DEMO_CASE_LIST, getDemoCaseDetail, getDemoCaseStats,
  getDemoEvidence, getDemoEvidenceItem,
  getDemoDocuments, getDemoDiary, getDemoRecentActivity,
  getDemoOverview, getDemoCrimeDistribution, getDemoWeeklyTrend, getDemoDocumentStats,
  getDemoFullAnalysis, getDemoCyberAnalysis, getDemoChatReply, getDemoJudgmentSearch,
} from './mockData'
import { translateDemoDocument } from './translate'

// ── Cases ────────────────────────────────────────────────────
export const demoCasesAPI = {
  list: (params?: any) => {
    let items = DEMO_CASE_LIST
    if (params) {
      const { q, status, crime_category, priority } = params
      items = items.filter(c => {
        if (q && !`${c.case_id} ${c.victim_name} ${c.accused_name} ${c.fir_number || ''}`.toLowerCase().includes(String(q).toLowerCase())) return false
        if (status && c.status !== status) return false
        if (crime_category && c.crime_category !== crime_category) return false
        if (priority && c.priority !== priority) return false
        return true
      })
    }
    const limit = params?.limit ?? 50
    const sliced = items.slice(0, limit)
    return demoResponse({ items: sliced, total: items.length, skip: 0, limit, has_more: items.length > sliced.length })
  },
  get: (caseId: string) => {
    const c = getDemoCaseDetail(decodeURIComponent(caseId))
    if (!c) return Promise.reject(new Error('Demo case not found'))
    return demoResponse(c)
  },
  create: () => blockDemoMutation('Case creation is disabled in the demo.'),
  update: () => blockDemoMutation('Case updates are disabled in the demo.'),
  stats: () => demoResponse(getDemoCaseStats()),
}

// ── FIR ──────────────────────────────────────────────────────
export const demoFirAPI = {
  upload: () => blockDemoMutation('FIR upload is disabled in the demo — open any sample case to see its OCR results.'),
}

// ── AI ───────────────────────────────────────────────────────
export const demoAiAPI = {
  analyzeFIR: (fir_text: string, case_id?: string) => demoResponse(getDemoFullAnalysis(case_id, fir_text), 900),
  chat: (messages: any[], case_id?: string) => demoResponse({ reply: getDemoChatReply(messages, case_id) }, 700),
  cyberAnalyze: (content_type: string, content: string) => demoResponse(getDemoCyberAnalysis(content_type, content), 900),
}

// ── Judgments ────────────────────────────────────────────────
export const demoJudgmentsAPI = {
  search: (q: string) => demoResponse(getDemoJudgmentSearch(q), 600),
}

// ── Documents ────────────────────────────────────────────────
export const demoDocsAPI = {
  listForCase: (caseId: string) => demoResponse(getDemoDocuments(decodeURIComponent(caseId))),
  generate: (case_id: string, doc_type: string, language = 'en') => {
    const docs = getDemoDocuments(case_id)
    const existing = docs.find(d => d.doc_type === doc_type)
    if (!existing) return blockDemoMutation('This document type has no pre-generated demo content for this case. Try a case with a later status (Chargesheet/Court/Closed) for the full document set.')
    const translated = language === 'en' ? existing : { ...existing, content_html: translateDemoDocument(existing.content_html, language) }
    return demoResponse(translated, 900)
  },
  exportPdf: () => blockDemoMutation('PDF export is disabled in the demo — view the full content in the preview pane.'),
  exportDocx: () => blockDemoMutation('DOCX export is disabled in the demo — view the full content in the preview pane.'),
}

// ── Evidence ─────────────────────────────────────────────────
export const demoEvidenceAPI = {
  upload: () => blockDemoMutation('Evidence upload is disabled in the demo.'),
  list: (caseId: string) => demoResponse(getDemoEvidence(decodeURIComponent(caseId))),
  download: (evidenceId: string) => {
    const ev = getDemoEvidenceItem(evidenceId)
    const text = ev ? `Demo evidence file — original content not stored.\n\nFile: ${ev.original_name}\nSHA-256: ${ev.sha256_hash}\n\nThis is a sample/demo record; no real file is attached.` : 'Demo evidence file.'
    return demoResponse(new Blob([text], { type: 'text/plain' }))
  },
  delete: () => blockDemoMutation('Evidence deletion is disabled in the demo.'),
}

// ── Diary ────────────────────────────────────────────────────
export const demoDiaryAPI = {
  list: (caseId: string) => demoResponse(getDemoDiary(decodeURIComponent(caseId))),
  add: () => blockDemoMutation('Adding diary entries is disabled in the demo.'),
}

// ── Analytics ────────────────────────────────────────────────
export const demoAnalyticsAPI = {
  overview: () => demoResponse(getDemoOverview()),
  crimeDistribution: () => demoResponse(getDemoCrimeDistribution()),
  weeklyTrend: () => demoResponse(getDemoWeeklyTrend()),
  documentStats: () => demoResponse(getDemoDocumentStats()),
}

// ── Admin (not part of the demo persona — always blocked) ─────
export const demoAdminAPI = {
  users: () => blockDemoMutation('Admin features are not available in the demo.'),
  auditLogs: () => blockDemoMutation('Admin features are not available in the demo.'),
  toggleUser: () => blockDemoMutation('Admin features are not available in the demo.'),
  systemStatus: () => blockDemoMutation('Admin features are not available in the demo.'),
}

// ── Notifications ──────────────────────────────────────────────
export const demoNotificationsAPI = {
  list: () => demoResponse([]),
  markRead: () => demoResponse({}),
}

// ── Recent diary activity (dashboard feed) ─────────────────────
export const demoDiaryRecentAPI = {
  recent: (limit = 10) => demoResponse(getDemoRecentActivity(limit)),
}
