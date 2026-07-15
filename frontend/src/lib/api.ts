/**
 * CrimeGPT-X API Client
 * Axios-based with JWT auth, error handling, and audit-friendly logging
 */
import axios, { AxiosInstance, AxiosError } from 'axios'
import toast from 'react-hot-toast'

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
  list: (params?: any) => api.get('/cases/', { params }),
  get: (id: string) => api.get(`/cases/${id}`),
  create: (data: any) => api.post('/cases/', data),
  update: (id: string, data: any) => api.patch(`/cases/${id}`, data),
  stats: () => api.get('/cases/stats/summary'),
}

// ── FIR ──────────────────────────────────────────────────────
export const firAPI = {
  upload: (file: File) => {
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
    api.post('/ai/analyze', { fir_text, case_id }),
  chat: (messages: any[], case_id?: string) =>
    api.post('/ai/chat', { messages, case_id }),
  cyberAnalyze: (content_type: string, content: string) =>
    api.post('/ai/cyber-analyze', { content_type, content }),
}

// ── Documents ────────────────────────────────────────────────
export const docsAPI = {
  generate: (case_id: string, doc_type: string, language = 'en') =>
    api.post('/documents/generate', { case_id, doc_type, language }),
  listForCase: (case_id: string) => api.get(`/documents/${case_id}`),
}

// ── Evidence ─────────────────────────────────────────────────
export const evidenceAPI = {
  upload: (case_id: string, file: File, category = 'primary', description = '') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    formData.append('description', description)
    return api.post(`/evidence/${case_id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: (case_id: string) => api.get(`/evidence/${case_id}`),
}

// ── Diary ────────────────────────────────────────────────────
export const diaryAPI = {
  list: (case_id: string) => api.get(`/diary/${case_id}`),
  add: (case_id: string, entry: any) => api.post(`/diary/${case_id}`, entry),
}

// ── Analytics ────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  crimeDistribution: () => api.get('/analytics/crime-distribution'),
}

// ── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  users: () => api.get('/admin/users'),
  auditLogs: () => api.get('/admin/audit-logs'),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle-active`),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
}
