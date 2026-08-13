'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, EmptyState, Tabs, TabsList, TabsTrigger, Button, Skeleton } from '@/components/ui'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Shield, Activity, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/lib/i18n'

type AdminTab = 'users' | 'audit' | 'config' | 'system'

const roleBadge: Record<string, string> = {
  io:'badge-blue', sho:'badge-purple', legal:'badge-cyan', admin:'badge-red'
}
const actionColor: Record<string, string> = {
  DOC_GENERATE:'badge-green', EVIDENCE_UPLOAD:'badge-blue', CASE_UPDATE:'badge-amber',
  AI_ANALYSIS:'badge-purple', LOGIN:'badge-green', LOGIN_FAILED:'badge-red', CASE_CREATE:'badge-cyan',
}

export default function AdminPage() {
  const t = useT()
  const [tab, setTab] = useState<AdminTab>('users')

  const { data: users, isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.users().then(r => r.data),
  })
  const { data: auditLogs, isLoading: auditLoading, isError: auditError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminAPI.auditLogs().then(r => r.data),
  })
  const { data: status, isLoading: statusLoading, isError: statusError } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => adminAPI.systemStatus().then(r => r.data),
    refetchInterval: 30_000,
  })

  const tabs: { id: AdminTab; icon: any; label: string }[] = [
    { id: 'users',  icon: Users,    label: 'User Management' },
    { id: 'audit',  icon: Activity, label: 'Audit Logs' },
    { id: 'config', icon: Settings, label: 'Configuration' },
    { id: 'system', icon: Shield,   label: 'System Status' },
  ]

  return (
    <AppShell>
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as AdminTab)}>
        <TabsList className="mb-5 flex-wrap">
          {tabs.map(t => (
            <TabsTrigger key={t.id} value={t.id}><t.icon size={14} />{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Users */}
      {tab === 'users' && (
        <div className="card animate-slide-in">
          {usersLoading ? (
            <div className="space-y-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : usersError ? (
            <Alert variant="error" icon="⚠️">Failed to load users — check the backend connection and that you have admin/SHO access.</Alert>
          ) : !users?.length ? (
            <EmptyState icon="👤" title="No users found" />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="tbl-head">
                <th>Name</th><th>Badge ID</th><th>Role</th><th>Station</th><th>Last Login</th><th>Status</th>
              </tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="tbl-row">
                    <td className="font-medium text-sm">{u.name}</td>
                    <td><span className="font-mono text-xs text-text-secondary">{u.badge || u.badge_number}</span></td>
                    <td><span className={roleBadge[u.role] || 'badge-gray'}>{u.role?.toUpperCase()}</span></td>
                    <td className="text-xs text-text-secondary">{u.station || u.police_station}</td>
                    <td className="text-xs text-text-muted font-mono">{u.last_login ? formatDateTime(u.last_login) : '—'}</td>
                    <td><span className={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Audit Logs */}
      {tab === 'audit' && (
        <div className="card animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm">Immutable Audit Trail</div>
          </div>
          {auditLoading ? (
            <div className="space-y-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : auditError ? (
            <Alert variant="error" icon="⚠️">Failed to load audit logs — this section requires admin access.</Alert>
          ) : !auditLogs?.length ? (
            <EmptyState icon="📜" title="No audit events yet" />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="tbl-head">
                <th>Timestamp</th><th>Officer</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Result</th>
              </tr></thead>
              <tbody>
                {auditLogs.map((l: any) => (
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
        </div>
      )}

      {/* Configuration — read-only display of actual configured values (single AI provider, no fake selectors) */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-slide-in">
          <div className="card">
            <div className="font-semibold text-sm mb-4">⚙️ AI Configuration</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">AI Provider</span><span className="font-semibold">Google Gemini</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Model</span><span className="font-mono text-xs">{status?.ai_model || '—'}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">OCR Engine</span><span className="font-semibold">EasyOCR + Tesseract</span></div>
            </div>
            <div className="text-xs text-text-muted mt-4">Configuration is managed via backend environment variables (GEMINI_API_KEY, AI_MODEL) — not editable from this panel.</div>
          </div>

          <div className="card">
            <div className="font-semibold text-sm mb-4">📧 Notification Settings</div>
            <div className="text-xs text-text-muted mb-4">Email notifications are configured via SMTP_HOST/SMTP_USER environment variables on the backend. Deadline alerts run automatically every 6 hours via the scheduled Celery task.</div>
            <Link href="/settings"><Button variant="secondary" size="sm"><Settings size={13} /> Go to your account Settings</Button></Link>
          </div>
        </div>
      )}

      {/* System Status — real introspection */}
      {tab === 'system' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-slide-in">
          {statusLoading ? (
            <>
              <div className="card"><Skeleton className="h-4 w-28 mb-4" /><div className="space-y-2.5">{[0,1,2].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div></div>
              <div className="card"><Skeleton className="h-4 w-28 mb-4" /><div className="grid grid-cols-2 gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></div>
            </>
          ) : statusError ? (
            <div className="col-span-2"><Alert variant="error" icon="⚠️">Failed to load system status — requires admin access.</Alert></div>
          ) : (
          <>
          <div className="card">
            <div className="font-semibold text-sm mb-4">🖥️ Service Health</div>
            <div className="space-y-2.5">
              {Object.entries(status?.services || {}).map(([name, s]: [string, any]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-sm capitalize">{name.replace(/_/g, ' ')}</span>
                  {s === 'online' || s === 'configured'
                    ? <span className="badge-green flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>{s}</span>
                    : <span className="badge-red flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full"/>{s}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="font-semibold text-sm mb-3">🔢 Platform Stats</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-bg-base rounded-lg p-2">
                <div className="text-[10px] text-text-muted uppercase tracking-wide">Active Users</div>
                <div className="font-bold text-accent-blue">{status?.active_users ?? '—'}</div>
              </div>
              <div className="bg-bg-base rounded-lg p-2">
                <div className="text-[10px] text-text-muted uppercase tracking-wide">Audit Events (1h)</div>
                <div className="font-bold text-accent-blue">{status?.audit_events_last_hour ?? '—'}</div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      )}
    </AppShell>
  )
}
