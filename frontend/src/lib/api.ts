/**
 * CrimeGPT-X API Client
 * Axios-based with JWT auth, error handling, and audit-friendly logging
 */
import axios, { AxiosInstance, AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { isDemoMode } from './demo/demoMode'
import {
  demoCasesAPI, demoFirAPI, demoAiAPI, demoJudgmentsAPI, demoDocsAPI,
  demoEvidenceAPI, demoDiaryAPI, demoAnalyticsAPI, demoAdminAPI,
  demoNotificationsAPI, demoDiaryRecentAPI,
} from './demo/demoApi'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,  // 60s for AI operations
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('crimegpt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// FastAPI validation errors (422) return `detail` as an array of {type,loc,msg,...}
// objects rather than a string — normalize whatever shape it is into plain text so
// toast.error() never receives a non-string/ReactNode (which would crash rendering).
function extractErrorMessage(detail: unknown, fallback: string): string {
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'string' ? d : (d as any)?.msg || JSON.stringify(d)))
      .join('; ')
  }
  if (typeof detail === 'object') return (detail as any).msg || JSON.stringify(detail)
  return String(detail)
}

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('crimegpt_token')
        window.location.href = '/login'
      }
    }
    const message = extractErrorMessage((error.response?.data as any)?.detail, error.message || 'Request failed')
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (badge_number: string, password: string) =>
    api.post('/auth/login', { badge_number, password }),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ── Cases ─────────────────────────────────────────────────────
export const casesAPI = {
  list: (params?: any) => isDemoMode() ? demoCasesAPI.list(params) : api.get('/cases/', { params }),
  get: (id: string) => isDemoMode() ? demoCasesAPI.get(id) : api.get(`/cases/${id}`),
  create: (data: any) => isDemoMode() ? demoCasesAPI.create() : api.post('/cases/', data),
  update: (id: string, data: any) => isDemoMode() ? demoCasesAPI.update() : api.patch(`/cases/${id}`, data),
  stats: () => isDemoMode() ? demoCasesAPI.stats() : api.get('/cases/stats/summary'),
}

// ── FIR ──────────────────────────────────────────────────────
export const firAPI = {
  upload: (file: File) => {
    if (isDemoMode()) return demoFirAPI.upload()
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/fir/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ── AI ───────────────────────────────────────────────────────
export const aiAPI = {
  analyzeFIR: (fir_text: string, case_id?: string) =>
    isDemoMode() ? demoAiAPI.analyzeFIR(fir_text, case_id) : api.post('/ai/analyze', { fir_text, case_id }),
  chat: (messages: any[], case_id?: string) =>
    isDemoMode() ? demoAiAPI.chat(messages, case_id) : api.post('/ai/chat', { messages, case_id }),
  cyberAnalyze: (content_type: string, content: string) =>
    isDemoMode() ? demoAiAPI.cyberAnalyze(content_type, content) : api.post('/ai/cyber-analyze', { content_type, content }),
}

// ── Judgments (RAG) ────────────────────────────────────────────
export const judgmentsAPI = {
  search: (q: string) => isDemoMode() ? demoJudgmentsAPI.search(q) : api.get('/ai/judgments/search', { params: { q } }),
}

// ── Documents ────────────────────────────────────────────────
export const docsAPI = {
  generate: (case_id: string, doc_type: string, language = 'en') =>
    isDemoMode() ? demoDocsAPI.generate(case_id, doc_type, language) : api.post('/documents/generate', { case_id, doc_type, language }),
  listForCase: (case_id: string) => isDemoMode() ? demoDocsAPI.listForCase(case_id) : api.get(`/documents/by-case/${case_id}`),
  exportPdf: (doc_id: string) => isDemoMode() ? demoDocsAPI.exportPdf() : api.get(`/documents/${doc_id}/export/pdf`, { responseType: 'blob' }),
  exportDocx: (doc_id: string) => isDemoMode() ? demoDocsAPI.exportDocx() : api.get(`/documents/${doc_id}/export/docx`, { responseType: 'blob' }),
}

// ── Evidence ─────────────────────────────────────────────────
export const evidenceAPI = {
  upload: (case_id: string, file: File, category = 'primary', description = '') => {
    if (isDemoMode()) return demoEvidenceAPI.upload()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    formData.append('description', description)
    return api.post(`/evidence/${case_id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: (case_id: string) => isDemoMode() ? demoEvidenceAPI.list(case_id) : api.get(`/evidence/${case_id}`),
  download: (evidence_id: string) => isDemoMode() ? demoEvidenceAPI.download(evidence_id) : api.get(`/evidence/item/${evidence_id}/download`, { responseType: 'blob' }),
  delete: (evidence_id: string) => isDemoMode() ? demoEvidenceAPI.delete() : api.delete(`/evidence/item/${evidence_id}`),
}

// ── Diary ────────────────────────────────────────────────────
export const diaryAPI = {
  list: (case_id: string) => isDemoMode() ? demoDiaryAPI.list(case_id) : api.get(`/diary/${case_id}`),
  add: (case_id: string, entry: any) => isDemoMode() ? demoDiaryAPI.add() : api.post(`/diary/${case_id}`, entry),
}

// ── Analytics ────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => isDemoMode() ? demoAnalyticsAPI.overview() : api.get('/analytics/overview'),
  crimeDistribution: () => isDemoMode() ? demoAnalyticsAPI.crimeDistribution() : api.get('/analytics/crime-distribution'),
  weeklyTrend: () => isDemoMode() ? demoAnalyticsAPI.weeklyTrend() : api.get('/analytics/weekly-trend'),
  documentStats: () => isDemoMode() ? demoAnalyticsAPI.documentStats() : api.get('/analytics/document-stats'),
}

// ── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  users: () => isDemoMode() ? demoAdminAPI.users() : api.get('/admin/users'),
  auditLogs: () => isDemoMode() ? demoAdminAPI.auditLogs() : api.get('/admin/audit-logs'),
  toggleUser: (id: string) => isDemoMode() ? demoAdminAPI.toggleUser() : api.patch(`/admin/users/${id}/toggle-active`),
  systemStatus: () => isDemoMode() ? demoAdminAPI.systemStatus() : api.get('/admin/system-status'),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsAPI = {
  list: () => isDemoMode() ? demoNotificationsAPI.list() : api.get('/notifications/'),
  markRead: (id: string) => isDemoMode() ? demoNotificationsAPI.markRead() : api.patch(`/notifications/${id}/read`),
}

// ── Diary ─────────────────────────────────────────────────────
export const diaryRecentAPI = {
  recent: (limit = 10) => isDemoMode() ? demoDiaryRecentAPI.recent(limit) : api.get('/diary/recent', { params: { limit } }),
}
