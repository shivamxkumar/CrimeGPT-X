'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, EmptyState, StatCard, StatusBadge, PriorityBadge, Table, TableColumn, Button, Skeleton, SkeletonText } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { casesAPI, analyticsAPI, diaryRecentAPI } from '@/lib/api'
import { CaseListItem, CRIME_CATEGORY_LABELS } from '@/types'
import { useAuthStore } from '@/lib/store'
import { caseHref } from '@/lib/utils'
import { entryStyle } from '@/lib/diaryStyles'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { FolderKanban, Clock3, Archive, FileCheck2, FilePlus2, FileText, ShieldCheck, ArrowRight } from 'lucide-react'

const DashboardCharts = dynamic(() => import('@/components/charts/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2].map(i => <div key={i} className="card"><Skeleton className="h-4 w-28 mb-4" /><Skeleton className="h-24 w-full" /></div>)}
    </div>
  ),
})

const QUICK_ACTIONS = [
  { href: '/cases/new', icon: FilePlus2, label: 'New Case', desc: 'Register an investigation', color: '#3b82f6' },
  { href: '/fir', icon: FileText, label: 'Upload FIR', desc: 'OCR extraction', color: '#60a5fa' },
  { href: '/legal', icon: ShieldCheck, label: 'AI Legal Analysis', desc: 'BNS / BNSS / BSA', color: '#8b5cf6' },
  { href: '/evidence', icon: Archive, label: 'Upload Evidence', desc: 'Chain of custody', color: '#22c55e' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { data: stats } = useQuery({ queryKey:['case-stats'], queryFn: ()=>casesAPI.stats().then(r=>r.data) })
  const { data: casesData, isLoading: casesLoading } = useQuery({ queryKey:['recent-cases'], queryFn:()=>casesAPI.list({limit:5}).then(r=>r.data) })
  const { data: overview } = useQuery({ queryKey:['analytics-overview'], queryFn: ()=>analyticsAPI.overview().then(r=>r.data) })
  const { data: distribution } = useQuery({ queryKey:['crime-distribution'], queryFn: ()=>analyticsAPI.crimeDistribution().then(r=>r.data) })
  const { data: weeklyTrend } = useQuery({ queryKey:['weekly-trend'], queryFn: ()=>analyticsAPI.weeklyTrend().then(r=>r.data) })
  const { data: docStats } = useQuery({ queryKey:['document-stats'], queryFn: ()=>analyticsAPI.documentStats().then(r=>r.data) })
  const { data: recentActivity, isLoading: activityLoading } = useQuery({ queryKey:['recent-activity'], queryFn: ()=>diaryRecentAPI.recent(5).then(r=>r.data) })

  const cases: CaseListItem[] = casesData?.items || []

  const pipeline = [
    { label: 'Active', value: stats?.active ?? 0, color: '#3b82f6' },
    { label: 'Pending Review', value: stats?.pending_review ?? 0, color: '#f59e0b' },
    { label: 'Closed', value: stats?.closed ?? 0, color: '#22c55e' },
  ]
  const pipelineTotal = Math.max(stats?.total ?? pipeline.reduce((s, p) => s + p.value, 0), 1)

  const columns: TableColumn<CaseListItem>[] = [
    { key: 'case_id', header: 'Case ID', sortable: true, accessor: c => c.case_id, render: c => <span className="font-mono text-xs text-accent-blue">{c.case_id}</span> },
    { key: 'type', header: 'Type', accessor: c => CRIME_CATEGORY_LABELS[c.crime_category] || c.crime_category, render: c => <span className="text-xs">{CRIME_CATEGORY_LABELS[c.crime_category] || c.crime_category}</span> },
    { key: 'status', header: 'Status', render: c => <StatusBadge status={c.status} /> },
    { key: 'priority', header: 'Priority', render: c => <PriorityBadge priority={c.priority} /> },
  ]

  return (
    <AppShell>
      <PageHeader
        title="Command Dashboard"
        subtitle={`Ahmedabad Cyber Crime Branch · Welcome back, ${user?.name}`}
      >
        <span className="badge-green flex items-center gap-1 text-[11px]">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />LIVE
        </span>
        <Link href="/cases/new"><Button size="sm">+ New Case</Button></Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Cases" value={overview?.total_cases ?? stats?.total ?? 0} color="#3b82f6" icon={<FolderKanban size={16} />} />
        <StatCard label="Pending Review" value={stats?.pending_review ?? 0} color="#f59e0b" icon={<Clock3 size={16} />} />
        <StatCard label="Evidence Uploaded" value={overview?.total_evidence_files ?? 0} color="#22c55e" icon={<Archive size={16} />} />
        <StatCard label="AI Docs Generated" value={overview?.total_documents_generated ?? 0} color="#8b5cf6" icon={<FileCheck2 size={16} />} />
      </div>

      {/* Investigation pipeline overview */}
      <div className="card mb-6">
        <div className="font-semibold text-sm mb-4">Investigation Pipeline</div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-bg-hover mb-4">
          {pipeline.map(p => (
            <motion.div
              key={p.label}
              initial={{ width: 0 }}
              animate={{ width: `${(p.value / pipelineTotal) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: p.color }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {pipeline.map(p => (
            <div key={p.label} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-text-secondary">{p.label}</span>
              <span className="font-semibold text-text-primary">{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {QUICK_ACTIONS.map(a => (
          <motion.div key={a.href} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
            <Link href={a.href} className="card-sm card-interactive flex items-center gap-3 h-full">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.color + '1a' }}>
                <a.icon size={18} style={{ color: a.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-text-primary truncate">{a.label}</div>
                <div className="text-xs text-text-muted truncate">{a.desc}</div>
              </div>
              <ArrowRight size={14} className="ml-auto text-text-muted flex-shrink-0" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Recent Cases */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-sm">Recent Cases</div>
              <div className="text-xs text-text-secondary">Latest registered</div>
            </div>
            <Link href="/cases"><Button variant="secondary" size="sm">View All</Button></Link>
          </div>
          {casesLoading ? (
            <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : cases.length === 0 ? (
            <EmptyState icon="📂" title="No cases yet" description="Register your first case to see it here." action={<Link href="/cases/new"><Button size="sm">+ New Case</Button></Link>} />
          ) : (
            <Table columns={columns} data={cases} rowKey={c => c.id} onRowClick={c => router.push(caseHref(c.case_id))} />
          )}
        </div>

        {/* Live Activity */}
        <div className="card">
          <div className="font-semibold text-sm mb-4">Recent Activity</div>
          {activityLoading ? (
            <SkeletonText lines={4} />
          ) : !recentActivity?.length ? (
            <EmptyState icon="🕒" title="No activity yet" description="Actions across your cases will appear here automatically." />
          ) : (
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
              {recentActivity.map((a: any) => {
                const style = entryStyle(a.entry_type)
                const Icon = style.icon
                return (
                  <motion.div key={a.id} variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0 } }} className="relative pl-8 pb-4 last:pb-0">
                    <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border" style={{ background: style.color + '1a', borderColor: style.color + '40' }}>
                      <Icon size={12} style={{ color: style.color }} />
                    </div>
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/[0.06]" />
                    <div className="text-[10px] font-mono text-text-muted mb-0.5">{new Date(a.created_at).toLocaleString('en-IN')}</div>
                    <div className="text-sm font-semibold text-text-primary">{a.title} — {a.case_id}</div>
                    {a.description && <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{a.description}</div>}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Charts (lazy-loaded — Recharts is deferred until this section mounts) */}
      <DashboardCharts weeklyTrend={weeklyTrend} distribution={distribution} docStats={docStats} />
    </AppShell>
  )
}
