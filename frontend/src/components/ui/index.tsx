'use client'
import { cn } from '@/lib/utils'
import { ReactNode, useEffect } from 'react'
import { CasePriority, CaseStatus, CaseListItem } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { casesAPI } from '@/lib/api'
import { useCaseSelectionStore } from '@/lib/store'
import Link from 'next/link'

// ─── StatCard ────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  color?: string
  icon?: ReactNode
}
export function StatCard({ label, value, change, changeType = 'neutral', color = '#1a6cf6', icon }: StatCardProps) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</div>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</div>
      {change && (
        <div className={cn('text-xs mt-1', {
          'text-green-400': changeType === 'up',
          'text-red-400':   changeType === 'down',
          'text-text-muted': changeType === 'neutral',
        })}>
          {change}
        </div>
      )}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────
const statusClasses: Record<CaseStatus, string> = {
  registered: 'badge-gray',
  active:     'badge-amber',
  in_review:  'badge-blue',
  chargesheet:'badge-purple',
  court:      'badge-purple',
  closed:     'badge-gray',
}
const priorityClasses: Record<CasePriority, string> = {
  critical: 'badge-red',
  high:     'badge-red',
  medium:   'badge-amber',
  low:      'badge-green',
}
export function StatusBadge({ status }: { status: CaseStatus }) {
  const labels: Record<CaseStatus, string> = {
    registered: 'Registered', active: 'Active', in_review: 'In Review',
    chargesheet: 'Chargesheet', court: 'In Court', closed: 'Closed',
  }
  return <span className={statusClasses[status]}>{labels[status]}</span>
}
export function PriorityBadge({ priority }: { priority: CasePriority }) {
  return (
    <span className={cn('flex items-center gap-1', priorityClasses[priority])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

// ─── ProgressBar ─────────────────────────────────────────────
export function ProgressBar({ value, color = '#1a6cf6', className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('conf-bar', className)}>
      <div className="conf-fill" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  )
}

// ─── ConfidenceBar ───────────────────────────────────────────
export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? '#00e676' : value >= 70 ? '#ffa726' : '#ff5252'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 rounded-full bg-bg-hover overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: `linear-gradient(90deg, #1a6cf6, ${color})` }} />
      </div>
      <span className="text-[11px] font-semibold" style={{ color }}>{value}%</span>
    </div>
  )
}

// ─── Timeline Item ───────────────────────────────────────────
interface TimelineItemProps {
  title: string
  description?: string
  time: string
  status?: 'done' | 'warn' | 'pending'
}
export function TimelineItem({ title, description, time, status = 'done' }: TimelineItemProps) {
  const dotColor = status === 'done' ? 'bg-accent-blue border-accent-blue' : status === 'warn' ? 'bg-amber-400 border-amber-400' : 'bg-bg-base border-white/20'
  return (
    <div className="relative pl-6 pb-5 last:pb-0">
      <div className={cn('absolute left-0 top-1 w-3 h-3 rounded-full border-2', dotColor)} />
      <div className="absolute left-1.5 top-4 bottom-0 w-px bg-white/[0.07]" />
      <div className="text-[10px] font-mono text-text-muted mb-0.5">{time}</div>
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      {description && <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</div>}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({ icon = '📂', title, description, action }: { icon?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-semibold text-text-primary mb-1">{title}</div>
      {description && <div className="text-sm text-text-secondary mb-4 max-w-xs">{description}</div>}
      {action}
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm'|'md'|'lg'; className?: string }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return (
    <div className={cn('rounded-full border-2 border-white/10 border-t-accent-blue animate-spin-fast', sz, className)} />
  )
}

// ─── Page Header ─────────────────────────────────────────────
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  )
}

// ─── Section Card (Legal) ─────────────────────────────────────
export function LegalSectionCard({ section }: { section: { section: string; title: string; description: string; confidence: number; act: string } }) {
  const actColors: Record<string, string> = {
    BNS: '#1a6cf6', BNSS: '#b57bee', 'IT Act': '#00d4ff', BSA: '#00e676',
  }
  const color = actColors[section.act] || '#1a6cf6'
  return (
    <div className="card-sm flex gap-3 hover:border-accent-blue/40 transition-colors mb-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-mono text-sm font-bold" style={{ color: '#00d4ff' }}>{section.section}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: color + '20', color, border: `1px solid ${color}40` }}>{section.act}</span>
          <span className="ml-auto badge-green text-[10px]">{section.confidence}%</span>
        </div>
        <div className="text-sm font-semibold mb-1">{section.title}</div>
        <div className="text-xs text-text-secondary leading-relaxed">{section.description}</div>
        <ConfidenceBar value={section.confidence} />
      </div>
    </div>
  )
}

// ─── Hash Display ────────────────────────────────────────────
export function HashDisplay({ hash, label }: { hash: string; label?: string }) {
  return (
    <div>
      {label && <span className="text-xs text-text-muted mr-1">{label}:</span>}
      <span className="hash">{hash.slice(0, 16)}…{hash.slice(-8)}</span>
    </div>
  )
}

// ─── Case Selector ───────────────────────────────────────────
// Shared "which case am I working on" control for pages (Evidence, Diary,
// Documents, Legal AI) that operate on a single case at a time. Backed by
// the real case list — no hardcoded case ID.
export function useSelectedCase() {
  const { selectedCaseId, setSelectedCaseId } = useCaseSelectionStore()
  const { data, isLoading } = useQuery({
    queryKey: ['cases-for-selector'],
    queryFn: () => casesAPI.list({ limit: 200 }).then(r => r.data),
    staleTime: 30_000,
  })
  const cases: CaseListItem[] = data?.items || []

  useEffect(() => {
    if (!selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].case_id)
    }
  }, [selectedCaseId, cases, setSelectedCaseId])

  const selectedCase = cases.find(c => c.case_id === selectedCaseId) || null
  return { cases, selectedCaseId, setSelectedCaseId, selectedCase, isLoading }
}

export function CaseSelector() {
  const { cases, selectedCaseId, setSelectedCaseId, isLoading } = useSelectedCase()

  if (isLoading) return <span className="text-xs text-text-muted">Loading cases…</span>

  if (cases.length === 0) {
    return (
      <Link href="/cases/new" className="btn-primary text-xs px-3 py-1.5">
        + Register a case to get started
      </Link>
    )
  }

  return (
    <select
      className="input text-xs w-56"
      value={selectedCaseId || ''}
      onChange={e => setSelectedCaseId(e.target.value)}
    >
      {cases.map(c => (
        <option key={c.case_id} value={c.case_id}>{c.case_id} — {c.victim_name}</option>
      ))}
    </select>
  )
}

// ─── Alert ───────────────────────────────────────────────────
type AlertVariant = 'info' | 'success' | 'warning' | 'error'
export function Alert({ variant = 'info', icon, children }: { variant?: AlertVariant; icon?: string; children: ReactNode }) {
  const classes: Record<AlertVariant, string> = {
    info:    'bg-blue-500/10 border-blue-500/20 text-blue-300',
    success: 'bg-green-500/10 border-green-500/20 text-green-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    error:   'bg-red-500/10 border-red-500/20 text-red-300',
  }
  return (
    <div className={cn('flex gap-3 p-3 rounded-lg border text-sm mb-3', classes[variant])}>
      {icon && <span className="text-base flex-shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}
