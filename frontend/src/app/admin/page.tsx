'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Spinner, Alert } from '@/components/ui'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Shield, Activity, Settings, Users } from 'lucide-react'

type AdminTab = 'users' | 'audit' | 'config' | 'system'

const MOCK_USERS = [
  { id: '1', badge: 'AHM-24-IO-047', name: 'SI Rajesh Sharma',   role: 'io',    station: 'Cyber Crime',    last_login: '2024-06-12T09:00:00Z', is_active: true },
  { id: '2', badge: 'AHM-23-SHO-012', name: 'DySP Amit Patel',   role: 'sho',   station: 'Cyber Crime',    last_login: '2024-06-12T08:30:00Z', is_active: true },
  { id: '3', badge: 'LEG-24-001',      name: 'Adv. Priya Mehta', role: 'legal', station: 'Legal Cell HQ',  last_login: '2024-06-11T14:00:00Z', is_active: true },
  { id: '4', badge: 'ADM-24-001',      name: 'Admin Saurabh Shah', role: 'admin', station: 'HQ Gandhinagar', last_login: '2024-06-12T07:45:00Z', is_active: true },
  { id: '5', badge: 'AHM-24-IO-053',   name: 'SI Anita Verma',   role: 'io',    station: 'Cyber Crime',    last_login: '2024-06-10T10:00:00Z', is_active: true },
]

const MOCK_AUDIT = [
  { id:'1', user:'SI Rajesh Sharma', badge:'AHM-24-IO-047', action:'DOC_GENERATE',   resource:'case', resource_id:'CC/2024/0847', ip:'10.0.1.42', created_at:'2024-06-12T14:32:11Z', success:true },
  { id:'2', user:'SI Rajesh Sharma', badge:'AHM-24-IO-047', action:'EVIDENCE_UPLOAD',resource:'evidence', resource_id:'CC/2024/0841', ip:'10.0.1.42', created_at:'2024-06-12T13:45:09Z', success:true },
  { id:'3', user:'SI Anita Verma',   badge:'AHM-24-IO-053', action:'CASE_UPDATE',    resource:'case', resource_id:'CC/2024/0839', ip:'10.0.1.53', created_at:'2024-06-12T11:20:44Z', success:true },
  { id:'4', user:'SI Rajesh Sharma', badge:'AHM-24-IO-047', action:'AI_ANALYSIS',    resource:'case', resource_id:'CC/2024/0847', ip:'10.0.1.42', created_at:'2024-06-12T09:00:02Z', success:true },
  { id:'5', user:'DySP Amit Patel',  badge:'AHM-23-SHO-012', action:'LOGIN',          resource:'auth', resource_id:'—',            ip:'10.0.1.12', created_at:'2024-06-12T08:30:15Z', success:true },
  { id:'6', user:'Unknown',          badge:'—',              action:'LOGIN_FAILED',   resource:'auth', resource_id:'—',            ip:'203.0.113.42', created_at:'2024-06-11T23:15:00Z', success:false },
]

const roleBadge: Record<string, string> = {
  io:'badge-blue', sho:'badge-purple', legal:'badge-cyan', admin:'badge-red'
}
const actionColor: Record<string, string> = {
  DOC_GENERATE:'badge-green', EVIDENCE_UPLOAD:'badge-blue', CASE_UPDATE:'badge-amber',
  AI_ANALYSIS:'badge-purple', LOGIN:'badge-green', LOGIN_FAILED:'badge-red', CASE_CREATE:'badge-cyan',
}

const SYSTEM_SERVICES = [
  { name: 'AI Engine (Claude)', status: 'online' },
  { name: 'OCR Service (EasyOCR)', status: 'online' },
  { name: 'Vector DB (ChromaDB)', status: 'online' },
  { name: 'PostgreSQL', status: 'online' },
  { name: 'MinIO Storage', status: 'online' },
  { name: 'Redis Cache', status: 'online' },
  { name: 'Email Service (SMTP)', status: 'degraded' },
  { name: 'Celery Worker', status: 'online' },
]

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users')

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.users().then(r => r.data),
    placeholderData: MOCK_USERS,
  })
  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminAPI.auditLogs().then(r => r.data),
    placeholderData: MOCK_AUDIT,
  })

  const tabs: { id: AdminTab; icon: any; label: string }[] = [
    { id: 'users',  icon: Users,    label: 'User Management' },
    { id: 'audit',  icon: Activity, label: 'Audit Logs' },
    { id: 'config', icon: Settings, label: 'Configuration' },
    { id: 'system', icon: Shield,   label: 'System Status' },
  ]

  return (
    <AppShell>
      <PageHeader title="Administration Panel" subtitle="User management, audit logs, system configuration">
        <button className="btn-primary text-sm">+ Add Officer</button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.07] mb-5">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={14} />{t.label}
            </button>
          )
        })}
      </div>

      {/* Users */}
      {tab === 'users' && (
        <div className="card animate-slide-in">
          <table className="w-full">
            <thead><tr className="tbl-head">
              <th>Name</th><th>Badge ID</th><th>Role</th><th>Station</th><th>Last Login</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              {(users || MOCK_USERS).map((u: any) => (
                <tr key={u.id} className="tbl-row">
                  <td className="font-medium text-sm">{u.name}</td>
                  <td><span className="font-mono text-xs text-text-secondary">{u.badge || u.badge_number}</span></td>
                  <td><span className={roleBadge[u.role] || 'badge-gray'}>{u.role?.toUpperCase()}</span></td>
                  <td className="text-xs text-text-secondary">{u.station || u.police_station}</td>
                  <td className="text-xs text-text-muted font-mono">{u.last_login ? formatDateTime(u.last_login) : '—'}</td>
                  <td><span className={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex gap-1.5">
                      <button className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                      <button className="btn-danger text-xs px-2.5 py-1">{u.is_active ? 'Disable' : 'Enable'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Logs */}
      {tab === 'audit' && (
        <div className="card animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm">Immutable Audit Trail</div>
            <button className="btn-secondary text-xs px-3 py-1.5">📥 Export CSV</button>
          </div>
          <table className="w-full">
            <thead><tr className="tbl-head">
              <th>Timestamp</th><th>Officer</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Result</th>
            </tr></thead>
            <tbody>
              {(auditLogs || MOCK_AUDIT).map((l: any) => (
                <tr key={l.id} className="tbl-row">
                  <td><span className="font-mono text-[11px] text-text-muted">{formatDateTime(l.created_at)}</span></td>
                  <td>
                    <div className="text-sm font-medium">{l.user || l.user_name}</div>
                    <div className="font-mono text-[10px] text-text-muted">{l.badge || l.user_badge}</div>
                  </td>
                  <td><span className={`${actionColor[l.action] || 'badge-gray'} text-[11px]`}>{l.action}</span></td>
                  <td>
                    <div className="text-xs text-text-secondary capitalize">{l.resource || l.resource_type}</div>
                    <div className="font-mono text-[10px] text-text-muted">{l.resource_id}</div>
                  </td>
                  <td><span className="font-mono text-[11px] text-text-muted">{l.ip || l.ip_address}</span></td>
                  <td>
                    {l.success
                      ? <span className="badge-green text-[10px]">✓ Success</span>
                      : <span className="badge-red text-[10px]">✗ Failed</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Configuration */}
      {tab === 'config' && (
        <div className="grid grid-cols-2 gap-5 animate-slide-in">
          <div className="card">
            <div className="font-semibold text-sm mb-4">⚙️ AI Configuration</div>
            <div className="space-y-3">
              <div>
                <label className="label block mb-1">Default AI Model</label>
                <select className="input w-full">
                  <option>Claude Sonnet 4 (Recommended)</option>
                  <option>GPT-4o</option>
                  <option>Gemini Pro</option>
                  <option>Llama 3 (Local)</option>
                </select>
              </div>
              <div>
                <label className="label block mb-1">OCR Engine</label>
                <select className="input w-full">
                  <option>EasyOCR (Multi-language)</option>
                  <option>Tesseract</option>
                  <option>Google Vision API</option>
                </select>
              </div>
              <div>
                <label className="label block mb-1">Default Language</label>
                <select className="input w-full">
                  <option>English</option>
                  <option>Hindi (हिन्दी)</option>
                  <option>Gujarati (ગુજરાતી)</option>
                </select>
              </div>
              <div>
                <label className="label block mb-1">AI Confidence Threshold (%)</label>
                <input type="number" className="input w-full" defaultValue={75} min={50} max={99} />
              </div>
              <div>
                <label className="label block mb-1">Max Evidence File Size (MB)</label>
                <input type="number" className="input w-full" defaultValue={50} min={5} max={500} />
              </div>
            </div>
            <button className="btn-primary text-sm mt-4">Save Configuration</button>
          </div>

          <div className="card">
            <div className="font-semibold text-sm mb-4">📧 Notification Settings</div>
            <div className="space-y-3">
              <div>
                <label className="label block mb-1">SMTP Host</label>
                <input className="input w-full" defaultValue="smtp.gujaratpolice.gov.in" />
              </div>
              <div>
                <label className="label block mb-1">SMTP Port</label>
                <input type="number" className="input w-full" defaultValue={587} />
              </div>
              <div>
                <label className="label block mb-1">Notification Email</label>
                <input type="email" className="input w-full" defaultValue="alerts@cybercrime.gujaratpolice.gov.in" />
              </div>
              <div className="pt-2">
                <div className="text-xs font-semibold text-text-muted mb-2">Enable Notifications</div>
                {['New Case Assignment', 'Remand Deadline (48hr)', 'Document Generated', 'Evidence Upload'].map(n => (
                  <label key={n} className="flex items-center gap-2 text-sm text-text-secondary mb-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-accent-blue" />
                    {n}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary text-sm mt-4">Save Notification Settings</button>
          </div>
        </div>
      )}

      {/* System Status */}
      {tab === 'system' && (
        <div className="grid grid-cols-2 gap-5 animate-slide-in">
          <div className="card">
            <div className="font-semibold text-sm mb-4">🖥️ Service Health</div>
            <div className="space-y-2.5">
              {SYSTEM_SERVICES.map(s => (
                <div key={s.name} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-sm">{s.name}</span>
                  {s.status === 'online'
                    ? <span className="badge-green flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>Online</span>
                    : <span className="badge-amber flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"/>Degraded</span>
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card">
              <div className="font-semibold text-sm mb-3">📊 Resource Usage</div>
              {[
                { label: 'CPU Usage', value: 34, color: '#1a6cf6' },
                { label: 'Memory (RAM)', value: 62, color: '#ffa726' },
                { label: 'Storage (MinIO)', value: 18, color: '#00e676' },
                { label: 'DB Connections', value: 45, color: '#b57bee' },
              ].map(r => (
                <div key={r.label} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{r.label}</span>
                    <span className="font-semibold" style={{ color: r.color }}>{r.value}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.value}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="font-semibold text-sm mb-3">🔢 Platform Stats</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Total Users', '5'], ['Active Sessions', '3'],
                  ['API Req/hr', '247'], ['DB Size', '1.2 GB'],
                  ['Evidence Files', '1,847'], ['Uptime', '99.7%'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-bg-base rounded-lg p-2">
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">{k}</div>
                    <div className="font-bold text-accent-blue">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
