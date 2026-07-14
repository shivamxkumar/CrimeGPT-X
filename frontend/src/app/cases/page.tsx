'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, StatusBadge, PriorityBadge, EmptyState, Spinner } from '@/components/ui'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { casesAPI } from '@/lib/api'
import { CaseListItem, CRIME_CATEGORY_LABELS } from '@/types'
import Link from 'next/link'
import { Search, Filter, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_OPTIONS = ['','registered','active','in_review','chargesheet','court','closed']
const CATEGORY_OPTIONS = ['','upi_fraud','phishing','investment_scam','whatsapp_fraud','social_media','otp_fraud','fake_app','sextortion','ransomware','other']
const PRIORITY_OPTIONS = ['','critical','high','medium','low']

const MOCK_CASES: CaseListItem[] = [
  {id:'1',case_id:'CC/2024/0847',fir_number:'FIR-0938/24',crime_category:'upi_fraud',status:'active',priority:'high',victim_name:'Ramesh Kumar Patel',accused_name:'Mehul Rathod',amount_defrauded:150000,created_at:'2024-06-12T09:00:00Z'},
  {id:'2',case_id:'CC/2024/0841',fir_number:'FIR-0929/24',crime_category:'phishing',status:'in_review',priority:'medium',victim_name:'Sunita Mehta',accused_name:'Unknown',amount_defrauded:80000,created_at:'2024-06-08T10:00:00Z'},
  {id:'3',case_id:'CC/2024/0839',fir_number:'FIR-0924/24',crime_category:'investment_scam',status:'active',priority:'high',victim_name:'Vikram Shah',accused_name:'Unknown',amount_defrauded:500000,created_at:'2024-06-06T11:00:00Z'},
  {id:'4',case_id:'CC/2024/0831',fir_number:'FIR-0911/24',crime_category:'whatsapp_fraud',status:'chargesheet',priority:'low',victim_name:'Priya Singh',accused_name:'Raju Yadav',amount_defrauded:50000,created_at:'2024-06-01T09:00:00Z'},
  {id:'5',case_id:'CC/2024/0826',fir_number:'FIR-0904/24',crime_category:'social_media',status:'in_review',priority:'medium',victim_name:'Anita Joshi',accused_name:'Unknown',amount_defrauded:30000,created_at:'2024-05-28T14:00:00Z'},
  {id:'6',case_id:'CC/2024/0818',fir_number:'FIR-0892/24',crime_category:'otp_fraud',status:'closed',priority:'low',victim_name:'Deepak Rao',accused_name:'Arun Singh',amount_defrauded:25000,created_at:'2024-05-22T08:00:00Z'},
  {id:'7',case_id:'CC/2024/0810',fir_number:'FIR-0880/24',crime_category:'fake_app',status:'closed',priority:'low',victim_name:'Meera Patel',accused_name:'Unknown',amount_defrauded:45000,created_at:'2024-05-18T10:00:00Z'},
  {id:'8',case_id:'CC/2024/0803',fir_number:'FIR-0871/24',crime_category:'sextortion',status:'active',priority:'critical',victim_name:'Rahul Sharma',accused_name:'Unknown',amount_defrauded:200000,created_at:'2024-05-14T09:00:00Z'},
]

export default function CasesPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['cases', q, status, category, priority],
    queryFn: () => casesAPI.list({ q, status, crime_category: category, priority, limit: 100 }).then(r => r.data),
    placeholderData: { items: MOCK_CASES, total: MOCK_CASES.length },
  })

  const cases: CaseListItem[] = data?.items || MOCK_CASES
  const filtered = cases.filter(c => {
    if (q && !`${c.case_id} ${c.victim_name} ${c.accused_name} ${c.fir_number}`.toLowerCase().includes(q.toLowerCase())) return false
    if (status && c.status !== status) return false
    if (category && c.crime_category !== category) return false
    if (priority && c.priority !== priority) return false
    return true
  })

  return (
    <AppShell>
      <PageHeader title="Case Registry" subtitle="All investigations — Ahmedabad Cyber Crime Branch">
        <Link href="/cases/new" className="btn-primary text-sm"><Plus size={14}/>Register New Case</Link>
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
          <button className="btn-secondary text-sm" onClick={() => { setQ(''); setStatus(''); setCategory(''); setPriority('') }}>
            Clear
          </button>
        </div>
        <div className="mt-2 text-xs text-text-muted">{filtered.length} case{filtered.length !== 1 ? 's' : ''} found</div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="No cases found" description="Try adjusting your search filters" action={<Link href="/cases/new" className="btn-primary text-sm">Register New Case</Link>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="tbl-head">
                <th>Case ID</th><th>FIR No.</th><th>Crime Type</th><th>Victim</th><th>Accused</th>
                <th>Amount</th><th>Date</th><th>Status</th><th>Priority</th><th>Action</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="tbl-row" onClick={() => window.location.href = `/cases/${c.case_id}`}>
                    <td><span className="font-mono text-xs text-accent-cyan">{c.case_id}</span></td>
                    <td className="text-xs text-text-secondary">{c.fir_number || '—'}</td>
                    <td className="text-xs">{CRIME_CATEGORY_LABELS[c.crime_category]}</td>
                    <td className="text-sm font-medium">{c.victim_name}</td>
                    <td className="text-xs text-text-secondary">{c.accused_name}</td>
                    <td className="text-xs font-mono text-text-secondary">{formatCurrency(c.amount_defrauded)}</td>
                    <td className="text-xs text-text-muted">{formatDate(c.created_at)}</td>
                    <td><StatusBadge status={c.status}/></td>
                    <td><PriorityBadge priority={c.priority}/></td>
                    <td onClick={e => e.stopPropagation()}>
                      <Link href={`/cases/${c.case_id}`} className="btn-secondary text-xs px-3 py-1.5">Open</Link>
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
