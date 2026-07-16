'use client'
import AppShell from '@/components/layout/AppShell'
import { StatCard, PageHeader, TimelineItem, EmptyState, Spinner } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { casesAPI, analyticsAPI, diaryRecentAPI } from '@/lib/api'
import { CaseListItem, CRIME_CATEGORY_LABELS } from '@/types'
import { useAuthStore } from '@/lib/store'
import { caseHref } from '@/lib/utils'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const statusColors: Record<string,string> = {
  active:'badge-amber',registered:'badge-blue',in_review:'badge-blue',chargesheet:'badge-purple',court:'badge-purple',closed:'badge-gray',
}
const pieColors = ['#1a6cf6','#ffa726','#00e676','#b57bee','#00d4ff','#ff5252','#8aa3c8','#ffd54f','#ef5350','#26a69a']

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats } = useQuery({ queryKey:['case-stats'], queryFn: ()=>casesAPI.stats().then(r=>r.data) })
  const { data: casesData } = useQuery({ queryKey:['recent-cases'], queryFn:()=>casesAPI.list({limit:5}).then(r=>r.data) })
  const { data: overview } = useQuery({ queryKey:['analytics-overview'], queryFn: ()=>analyticsAPI.overview().then(r=>r.data) })
  const { data: distribution } = useQuery({ queryKey:['crime-distribution'], queryFn: ()=>analyticsAPI.crimeDistribution().then(r=>r.data) })
  const { data: weeklyTrend } = useQuery({ queryKey:['weekly-trend'], queryFn: ()=>analyticsAPI.weeklyTrend().then(r=>r.data) })
  const { data: docStats } = useQuery({ queryKey:['document-stats'], queryFn: ()=>analyticsAPI.documentStats().then(r=>r.data) })
  const { data: recentActivity, isLoading: activityLoading } = useQuery({ queryKey:['recent-activity'], queryFn: ()=>diaryRecentAPI.recent(5).then(r=>r.data) })

  const cases: CaseListItem[] = casesData?.items || []
  const totalCrimes = (distribution || []).reduce((sum: number, d: any) => sum + d.count, 0)

  return (
    <AppShell>
      <PageHeader
        title="Command Dashboard"
        subtitle={`Ahmedabad Cyber Crime Branch · Welcome back, ${user?.name}`}
      >
        <span className="badge-green flex items-center gap-1 text-[11px]">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />LIVE
        </span>
        <Link href="/cases/new" className="btn-primary text-sm">+ New Case</Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Cases" value={stats?.active ?? '—'} color="#1a6cf6" />
        <StatCard label="Pending Review" value={stats?.pending_review ?? '—'} color="#ffa726" />
        <StatCard label="Closed Cases" value={stats?.closed ?? '—'} color="#00e676" />
        <StatCard label="AI Docs Generated" value={overview?.total_documents_generated ?? '—'} color="#00d4ff" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Recent Cases */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-sm">Recent Cases</div>
              <div className="text-xs text-text-secondary">Latest registered</div>
            </div>
            <Link href="/cases" className="btn-secondary text-xs px-3 py-1.5">View All</Link>
          </div>
          {cases.length === 0 ? (
            <EmptyState icon="📂" title="No cases yet" description="Register your first case to see it here." action={<Link href="/cases/new" className="btn-primary text-sm">+ New Case</Link>} />
          ) : (
          <table className="w-full">
            <thead><tr className="tbl-head">
              <th>Case ID</th><th>Type</th><th>Status</th><th>Priority</th>
            </tr></thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id} className="tbl-row" onClick={()=>window.location.href=caseHref(c.case_id)}>
                  <td><span className="font-mono text-xs text-accent-cyan">{c.case_id}</span></td>
                  <td className="text-xs">{CRIME_CATEGORY_LABELS[c.crime_category] || c.crime_category}</td>
                  <td><span className={statusColors[c.status] || 'badge-gray'}>{c.status.replace('_',' ')}</span></td>
                  <td><span className={`flex items-center gap-1 text-xs ${c.priority==='high'?'text-red-400':c.priority==='medium'?'text-amber-400':'text-green-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"/>{c.priority}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Live Activity */}
        <div className="card">
          <div className="font-semibold text-sm mb-4">Recent Activity</div>
          {activityLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !recentActivity?.length ? (
            <EmptyState icon="🕒" title="No activity yet" description="Actions across your cases will appear here automatically." />
          ) : (
            recentActivity.map((a: any) => (
              <TimelineItem
                key={a.id}
                title={`${a.title} — ${a.case_id}`}
                description={a.description}
                time={new Date(a.created_at).toLocaleString('en-IN')}
                status={a.entry_type === 'arrest' ? 'warn' : 'done'}
              />
            ))
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-3">Cases This Week</div>
          {!weeklyTrend?.length ? (
            <div className="text-xs text-text-muted flex items-center justify-center h-[100px]">No cases registered in the last 7 days</div>
          ) : (
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={weeklyTrend} barSize={8}>
              <XAxis dataKey="day" tick={{fontSize:10,fill:'#506480'}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{background:'#111f33',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="cases" fill="#1a6cf6" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="font-semibold text-sm mb-3">Crime Distribution</div>
          {!distribution?.length ? (
            <div className="text-xs text-text-muted flex items-center justify-center h-[90px]">No case data yet</div>
          ) : (
          <div className="flex items-center gap-3">
            <PieChart width={90} height={90}>
              <Pie data={distribution} cx={40} cy={40} innerRadius={25} outerRadius={42} dataKey="count" strokeWidth={0}>
                {distribution.map((entry: any, i: number) => <Cell key={i} fill={pieColors[i % pieColors.length]}/>)}
              </Pie>
            </PieChart>
            <div className="flex flex-col gap-1.5 text-xs">
              {distribution.map((d: any,i: number)=>(
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:pieColors[i % pieColors.length]}}/>
                  <span className="text-text-secondary">{CRIME_CATEGORY_LABELS[d.category as keyof typeof CRIME_CATEGORY_LABELS] || d.category}</span>
                  <span className="font-semibold ml-auto">{totalCrimes ? Math.round((d.count/totalCrimes)*100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        <div className="card">
          <div className="font-semibold text-sm mb-3">Document Output</div>
          {!docStats?.length ? (
            <div className="text-xs text-text-muted flex items-center justify-center h-[90px]">No documents generated yet</div>
          ) : (
            docStats.slice(0, 4).map((d: any, i: number) => {
              const max = Math.max(...docStats.map((x: any) => x.count), 1)
              return (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary capitalize">{d.doc_type.replace(/_/g,' ')}</span>
                    <span className="font-semibold" style={{color:pieColors[i % pieColors.length]}}>{d.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${(d.count/max)*100}%`,background:pieColors[i % pieColors.length]}}/>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AppShell>
  )
}
