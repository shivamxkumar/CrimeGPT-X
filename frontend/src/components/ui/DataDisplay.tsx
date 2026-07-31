'use client'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CasePriority, CaseStatus } from '@/types'
import { AnimatedCounter } from './motion'

// ─── StatCard ────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  color?: string
  icon?: ReactNode
}
export function StatCard({ label, value, change, changeType = 'neutral', color = '#3b82f6', icon }: StatCardProps) {
  const numeric = typeof value === 'number'
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="card relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</div>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color }}>
        {numeric ? <AnimatedCounter value={value as number} /> : value}
      </div>
      {change && (
        <div className={cn('text-xs mt-1', {
          'text-green-400': changeType === 'up',
          'text-red-400':   changeType === 'down',
          'text-text-muted': changeType === 'neutral',
        })}>
          {change}
        </div>
      )}
    </motion.div>
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
export function ProgressBar({ value, color = '#3b82f6', className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('conf-bar', className)}>
      <div className="conf-fill" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  )
}

// ─── ConfidenceBar ───────────────────────────────────────────
export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 rounded-full bg-bg-hover overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: `linear-gradient(90deg, #3b82f6, ${color})` }} />
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
      <div className="absolute left-1.5 top-4 bottom-0 w-px bg-white/[0.06]" />
      <div className="text-[10px] font-mono text-text-muted mb-0.5">{time}</div>
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      {description && <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</div>}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({ icon = '📂', title, description, action }: { icon?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] flex items-center justify-center text-3xl mb-4 shadow-soft">{icon}</div>
      <div className="font-semibold text-text-primary mb-1">{title}</div>
      {description && <div className="text-sm text-text-secondary mb-4 max-w-xs leading-relaxed">{description}</div>}
      {action}
    </motion.div>
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
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">{children}</div>}
    </div>
  )
}

// ─── Section Card (Legal) ─────────────────────────────────────
export function LegalSectionCard({ section }: { section: { section: string; title: string; description: string; confidence: number; act: string } }) {
  const actColors: Record<string, string> = {
    BNS: '#3b82f6', BNSS: '#8b5cf6', 'IT Act': '#60a5fa', BSA: '#22c55e',
  }
  const color = actColors[section.act] || '#3b82f6'
  return (
    <div className="card-sm flex gap-3 hover:border-accent-blue/30 transition-colors mb-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-mono text-sm font-bold" style={{ color }}>{section.section}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: color + '1a', color, border: `1px solid ${color}40` }}>{section.act}</span>
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
    <div className={cn('flex gap-3 p-3 rounded-xl border text-sm mb-3', classes[variant])}>
      {icon && <span className="text-base flex-shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}
