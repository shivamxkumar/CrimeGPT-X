'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, StatusBadge, PriorityBadge, LegalSectionCard, TimelineItem, Alert, Spinner } from '@/components/ui'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { casesAPI } from '@/lib/api'
import { CRIME_CATEGORY_LABELS } from '@/types'
import Link from 'next/link'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

const MOCK_CASE = {
  id: '1', case_id: 'CC/2024/0847', fir_number: 'FIR-0938/24',
  police_station: 'Ahmedabad Cyber Crime Branch',
  crime_category: 'upi_fraud', status: 'active', priority: 'high',
  victim_name: 'Ramesh Kumar Patel', victim_phone: '+91 9825647382',
  victim_address: '14, Saraswati Society, Naranpura, Ahmedabad – 380013',
  victim_age: 42, amount_defrauded: 150000,
  accused_name: 'Mehul Rathod', accused_phone: '+91 7841XXXXXX',
  accused_address: '7-B, Vasudev Nagar, Adajan, Surat – 395009',
  accused_mode: 'Remote Access Tool (AnyDesk) + WhatsApp impersonation',
  incident_description: 'Complainant received a WhatsApp call claiming to be SBI KYC officer. Was asked to install AnyDesk. After installation, accused gained remote access and transferred ₹1,50,000 via unauthorized UPI transactions from SBI account ending 4782.',
  incident_location: 'Naranpura, Ahmedabad',
  incident_date: '2024-06-12T08:30:00Z',
  ai_sections: [
    { section: 'BNS 318', title: 'Cheating', description: 'Accused deceived victim by impersonating SBI officer', confidence: 93, act: 'BNS' },
    { section: 'BNS 319', title: 'Cheating by Personation', description: 'Falsely claimed to be bank official', confidence: 91, act: 'BNS' },
    { section: 'IT Act 66C', title: 'Identity Theft', description: 'Unauthorized use of banking credentials', confidence: 88, act: 'IT Act' },
    { section: 'IT Act 66D', title: 'Computer Resource Cheating', description: 'Used AnyDesk to commit fraud', confidence: 86, act: 'IT Act' },
  ],
  io_officer_id: '1',
  created_at: '2024-06-12T09:00:00Z', updated_at: '2024-06-14T11:00:00Z',
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => casesAPI.get(id).then(r => r.data),
    placeholderData: MOCK_CASE,
  })
  const c = caseData || MOCK_CASE

  if (isLoading) return <AppShell><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppShell>

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
          {c.ai_sections?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm">⚖️ AI Legal Sections</div>
                <Link href="/legal" className="btn-secondary text-xs px-3 py-1.5">Re-analyze →</Link>
              </div>
              {c.ai_sections.map((s: any, i: number) => <LegalSectionCard key={i} section={s} />)}
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
            <TimelineItem title="Case Registered" description="FIR received and case created" time={formatDateTime(c.created_at)} status="done" />
            <TimelineItem title="AI Analysis Done" description={`${c.ai_sections?.length || 0} sections identified`} time={formatDateTime(c.created_at)} status="done" />
            <TimelineItem title="Evidence Upload" description="4 files, SHA-256 verified" time="12 Jun 2024, 11:00" status="done" />
            <TimelineItem title="Accused Arrested" description="Panchanama completed" time="14 Jun 2024, 10:30" status="warn" />
            <TimelineItem title="Court Submission" description="Chargesheet pending" time="⏳ Due by 14 Aug 2024" status="pending" />
          </div>

          <div className="card">
            <div className="font-semibold text-sm mb-3">🔧 Case Management</div>
            <div className="space-y-2">
              <div>
                <label className="label block mb-1">Update Status</label>
                <select className="input w-full text-sm" defaultValue={c.status}>
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
                <select className="input w-full text-sm" defaultValue={c.priority}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button className="btn-primary w-full justify-center text-sm mt-1">Save Changes</button>
            </div>
          </div>

          <div className="card">
            <div className="font-semibold text-sm mb-2">📊 Case Stats</div>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <div className="flex justify-between"><span>Evidence Files</span><span className="font-semibold text-text-primary">5</span></div>
              <div className="flex justify-between"><span>Documents Generated</span><span className="font-semibold text-text-primary">3</span></div>
              <div className="flex justify-between"><span>Diary Entries</span><span className="font-semibold text-text-primary">8</span></div>
              <div className="flex justify-between"><span>Witnesses</span><span className="font-semibold text-text-primary">1</span></div>
              <div className="flex justify-between"><span>Days Open</span><span className="font-semibold text-accent-amber">5 days</span></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
