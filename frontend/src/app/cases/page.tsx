'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, StatusBadge, PriorityBadge, EmptyState, Alert, Button, Skeleton } from '@/components/ui'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { casesAPI } from '@/lib/api'
import { CaseListItem, CRIME_CATEGORY_LABELS } from '@/types'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'
import { formatCurrency, formatDate, caseHref } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const STATUS_OPTIONS = ['','registered','active','in_review','chargesheet','court','closed']
const CATEGORY_OPTIONS = ['','upi_fraud','phishing','investment_scam','whatsapp_fraud','social_media','otp_fraud','fake_app','sextortion','ransomware','other']
const PRIORITY_OPTIONS = ['','critical','high','medium','low']

export default function CasesPage() {
  const t = useT()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cases', q, status, category, priority],
    queryFn: () => casesAPI.list({ q, status, crime_category: category, priority, limit: 100 }).then(r => r.data),
  })

  const cases: CaseListItem[] = data?.items || []
  const filtered = cases.filter(c => {
    if (q && !`${c.case_id} ${c.victim_name} ${c.accused_name} ${c.fir_number}`.toLowerCase().includes(q.toLowerCase())) return false
    if (status && c.status !== status) return false
    if (category && c.crime_category !== category) return false
    if (priority && c.priority !== priority) return false
    return true
  })

  return (
    <AppShell>
      <PageHeader title={t('cases.title')} subtitle={t('cases.subtitle', { branch: 'Ahmedabad Cyber Crime Branch' })}>
        <Link href="/cases/new"><Button size="sm"><Plus size={14}/>{t('cases.registerNewCase')}</Button></Link>
      </PageHeader>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-56">
            <Search size={14} className="text-text-muted flex-shrink-0"/>
            <input className="input flex-1" placeholder="Search FIR, victim, accused, phone, case ID..." value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <select className="input w-44" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.slice(1).map(c => <option key={c} value={c}>{CRIME_CATEGORY_LABELS[c as keyof typeof CRIME_CATEGORY_LABELS]}</option>)}
          </select>
          <select className="input w-36" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select className="input w-36" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">All Priority</option>
            {PRIORITY_OPTIONS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={() => { setQ(''); setStatus(''); setCategory(''); setPriority('') }}>
            Clear
          </Button>
        </div>
        <div className="mt-2 text-xs text-text-muted">{filtered.length} case{filtered.length !== 1 ? 's' : ''} found</div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <Alert variant="error" icon="⚠️">Failed to load cases — check the backend connection.</Alert>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="No cases found" description="Try adjusting your search filters" action={<Link href="/cases/new"><Button size="sm">Register New Case</Button></Link>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="tbl-head">
                <th>Case ID</th><th>FIR No.</th><th>Crime Type</th><th>Victim</th><th>Accused</th>
                <th>Amount</th><th>Date</th><th>Status</th><th>Priority</th><th>Action</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="tbl-row" onClick={() => window.location.href = caseHref(c.case_id)}>
                    <td><span className="font-mono text-xs text-accent-blue">{c.case_id}</span></td>
                    <td className="text-xs text-text-secondary">{c.fir_number || '—'}</td>
                    <td className="text-xs">{CRIME_CATEGORY_LABELS[c.crime_category]}</td>
                    <td className="text-sm font-medium">{c.victim_name}</td>
                    <td className="text-xs text-text-secondary">{c.accused_name}</td>
                    <td className="text-xs font-mono text-text-secondary">{formatCurrency(c.amount_defrauded)}</td>
                    <td className="text-xs text-text-muted">{formatDate(c.created_at)}</td>
                    <td><StatusBadge status={c.status}/></td>
                    <td><PriorityBadge priority={c.priority}/></td>
                    <td onClick={e => e.stopPropagation()}>
                      <Link href={caseHref(c.case_id)}><Button variant="secondary" size="sm">Open</Button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
