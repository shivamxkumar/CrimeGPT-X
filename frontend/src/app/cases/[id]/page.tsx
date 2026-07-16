'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, StatusBadge, PriorityBadge, LegalSectionCard, TimelineItem, Alert, Spinner } from '@/components/ui'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { casesAPI } from '@/lib/api'
import { useUpdateCase } from '@/hooks'
import { CRIME_CATEGORY_LABELS, CaseStatus, CasePriority } from '@/types'
import Link from 'next/link'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: c, isLoading, isError } = useQuery({
    queryKey: ['case', id],
    queryFn: () => casesAPI.get(id).then(r => r.data),
    enabled: !!id,
  })
  const updateCase = useUpdateCase(id)
  const [pendingStatus, setPendingStatus] = useState<CaseStatus | null>(null)
  const [pendingPriority, setPendingPriority] = useState<CasePriority | null>(null)

  if (isLoading) return <AppShell><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppShell>
  if (isError || !c) return <AppShell><Alert variant="error" icon="⚠️">Case not found, or failed to load — check the backend connection.</Alert></AppShell>

  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000))

  return (
    <AppShell>
      <PageHeader title={`Case ${c.case_id}`} subtitle={`${CRIME_CATEGORY_LABELS[c.crime_category as keyof typeof CRIME_CATEGORY_LABELS]} · ${c.police_station}`}>
        <StatusBadge status={c.status as any} />
        <PriorityBadge priority={c.priority as any} />
        <Link href="/legal" className="btn-primary text-sm">🤖 AI Legal Analysis</Link>
      </PageHeader>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'FIR Number', value: c.fir_number || 'Pending', color: '#00d4ff' },
          { label: 'Amount Defrauded', value: formatCurrency(c.amount_defrauded), color: '#ff5252' },
          { label: 'Date Registered', value: formatDate(c.created_at), color: '#1a6cf6' },
          { label: 'AI Sections', value: `${c.ai_sections?.length || 0} Identified`, color: '#b57bee' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `2px solid ${s.color}` }}>
            <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{s.label}</div>
            <div className="font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Case details */}
        <div className="col-span-2 space-y-4">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">🧑 Victim</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-text-muted text-xs">Name: </span><span className="font-medium">{c.victim_name}</span></div>
                {c.victim_phone && <div><span className="text-text-muted text-xs">Phone: </span><span className="font-mono text-xs">{c.victim_phone}</span></div>}
                {c.victim_age && <div><span className="text-text-muted text-xs">Age: </span>{c.victim_age} years</div>}
                {c.victim_address && <div><span className="text-text-muted text-xs">Address: </span><span className="text-text-secondary text-xs">{c.victim_address}</span></div>}
              </div>
            </div>
            <div className="card">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">🚨 Accused</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-text-muted text-xs">Name: </span><span className="font-medium">{c.accused_name}</span></div>
                {c.accused_phone && <div><span className="text-text-muted text-xs">Contact: </span><span className="font-mono text-xs">{c.accused_phone}</span></div>}
                {c.accused_mode && <div><span className="text-text-muted text-xs">Mode: </span><span className="text-text-secondary text-xs">{c.accused_mode}</span></div>}
                {c.accused_address && <div><span className="text-text-muted text-xs">Address: </span><span className="text-text-secondary text-xs">{c.accused_address}</span></div>}
              </div>
            </div>
          </div>

          {/* Incident */}
          <div className="card">
            <div className="font-semibold text-sm mb-3">📋 Incident Description</div>
            <div className="text-sm text-text-secondary leading-relaxed bg-bg-base rounded-lg p-3">{c.incident_description}</div>
            {c.incident_location && <div className="mt-2 text-xs text-text-muted">📍 {c.incident_location}</div>}
          </div>

          {/* AI Sections */}
          {c.ai_sections?.length > 0 ? (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm">⚖️ AI Legal Sections</div>
                <Link href="/legal" className="btn-secondary text-xs px-3 py-1.5">Re-analyze →</Link>
              </div>
              {c.ai_sections.map((s: any, i: number) => <LegalSectionCard key={i} section={s} />)}
            </div>
          ) : (
            <div className="card">
              <div className="font-semibold text-sm mb-2">⚖️ AI Legal Sections</div>
              <div className="text-sm text-text-secondary mb-3">This case hasn't been analyzed yet.</div>
              <Link href="/legal" className="btn-primary text-sm">🤖 Run AI Legal Analysis</Link>
            </div>
          )}

          {/* FIR OCR Output */}
          {c.fir_ocr_text && (
            <div className="card">
              <div className="font-semibold text-sm mb-3">📄 FIR OCR Extraction</div>
              {Object.keys(c.fir_ocr_fields || {}).length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  {Object.entries(c.fir_ocr_fields).map(([k, v]) => (
                    <div key={k} className="bg-bg-base rounded-lg p-2">
                      <div className="text-text-muted uppercase tracking-wide text-[10px]">{k.replace(/_/g, ' ')}</div>
                      <div className="font-medium">{String(v)}</div>
                    </div>
                  ))}
                </div>
              )}
              <details>
                <summary className="text-xs text-text-muted cursor-pointer">Raw OCR text</summary>
                <pre className="text-xs text-text-secondary whitespace-pre-wrap bg-bg-base rounded-lg p-3 mt-2">{c.fir_ocr_text}</pre>
              </details>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="font-semibold text-sm mb-3">⚡ Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <Link href="/evidence" className="btn-secondary text-sm">📁 Upload Evidence</Link>
              <Link href="/documents" className="btn-secondary text-sm">📄 Generate Documents</Link>
              <Link href="/diary" className="btn-secondary text-sm">📅 View Case Diary</Link>
              <Link href="/legal" className="btn-primary text-sm">🤖 Legal AI Chat</Link>
            </div>
          </div>
        </div>

        {/* Right: Timeline + status */}
        <div className="space-y-4">
          <div className="card">
            <div className="font-semibold text-sm mb-4">📅 Case Timeline</div>
            <TimelineItem title="Case Registered" description={`FIR ${c.fir_number || 'pending'} received and case created`} time={formatDateTime(c.created_at)} status="done" />
            {c.ai_analyzed_at && (
              <TimelineItem title="AI Analysis Done" description={`${c.ai_sections?.length || 0} sections identified`} time={formatDateTime(c.ai_analyzed_at)} status="done" />
            )}
            {c.updated_at && c.updated_at !== c.created_at && (
              <TimelineItem title="Case Last Updated" description="Case details or status changed" time={formatDateTime(c.updated_at)} status="done" />
            )}
            <div className="text-xs text-text-muted mt-2">See the full audit trail in <Link href="/diary" className="text-accent-blue">Case Diary</Link>.</div>
          </div>

          <div className="card">
            <div className="font-semibold text-sm mb-3">🔧 Case Management</div>
            <div className="space-y-2">
              <div>
                <label className="label block mb-1">Update Status</label>
                <select className="input w-full text-sm" defaultValue={c.status} onChange={e => setPendingStatus(e.target.value as CaseStatus)}>
                  <option value="registered">Registered</option>
                  <option value="active">Active</option>
                  <option value="in_review">In Review</option>
                  <option value="chargesheet">Chargesheet Filed</option>
                  <option value="court">In Court</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="label block mb-1">Update Priority</label>
                <select className="input w-full text-sm" defaultValue={c.priority} onChange={e => setPendingPriority(e.target.value as CasePriority)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button
                className="btn-primary w-full justify-center text-sm mt-1"
                disabled={updateCase.isPending || (!pendingStatus && !pendingPriority)}
                onClick={() => {
                  const payload: Record<string, string> = {}
                  if (pendingStatus) payload.status = pendingStatus
                  if (pendingPriority) payload.priority = pendingPriority
                  updateCase.mutate(payload, { onSuccess: () => { setPendingStatus(null); setPendingPriority(null) } })
                }}
              >
                {updateCase.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="font-semibold text-sm mb-2">📊 Case Stats</div>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <div className="flex justify-between"><span>Evidence Files</span><span className="font-semibold text-text-primary">{c.evidence_count}</span></div>
              <div className="flex justify-between"><span>Documents Generated</span><span className="font-semibold text-text-primary">{c.document_count}</span></div>
              <div className="flex justify-between"><span>Diary Entries</span><span className="font-semibold text-text-primary">{c.diary_count}</span></div>
              <div className="flex justify-between"><span>Witnesses</span><span className="font-semibold text-text-primary">{c.witness_count}</span></div>
              <div className="flex justify-between"><span>Days Open</span><span className="font-semibold text-accent-amber">{daysOpen} day{daysOpen !== 1 ? 's' : ''}</span></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
