'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, StatCard, Button, Skeleton } from '@/components/ui'
import { chartColors } from '@/lib/chartTheme'
import { Download } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useT } from '@/lib/i18n'

const chartSkeleton = <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">{[0,1].map(i => <div key={i} className="card"><Skeleton className="h-4 w-40 mb-4" /><Skeleton className="h-[200px] w-full" /></div>)}</div>
const MonthlyTrendCharts = dynamic(() => import('@/components/charts/AnalyticsCharts').then(m => m.MonthlyTrendCharts), { ssr: false, loading: () => chartSkeleton })
const CrimeDistributionChart = dynamic(() => import('@/components/charts/AnalyticsCharts').then(m => m.CrimeDistributionChart), {
  ssr: false,
  loading: () => <div className="card"><Skeleton className="h-4 w-40 mb-4" /><Skeleton className="h-[220px] w-full" /></div>,
})

const officerData = [
  {name:'SI R. Sharma',active:12,closed:48,docs:247,score:94},
  {name:'SI A. Verma',active:9,closed:41,docs:198,score:88},
  {name:'SI P. Kumar',active:11,closed:35,docs:172,score:82},
  {name:'SI M. Patel',active:7,closed:29,docs:134,score:76},
  {name:'SI S. Joshi',active:8,closed:30,docs:143,score:78},
]
const topSections = [
  {section:'BNS 318',count:94},{section:'IT Act 66C',count:87},
  {section:'IT Act 66D',count:72},{section:'BNS 319',count:61},
  {section:'BNS 420',count:48},{section:'IT Act 43',count:39},
  {section:'BNSS 180',count:34},{section:'BSA 63',count:28},
]
const kpis = [
  { label: 'Total Cases Filed', value: '312', change: '↑ 18% vs last month' },
  { label: 'Conviction Rate', value: '67%', change: '↑ 4% vs last year' },
  { label: 'Avg. Investigation', value: '43d', change: '↓ 12 days saved by AI' },
  { label: 'Amount Recovered', value: '₹2.4Cr', change: '↑ 31% this year' },
]

function csvCell(value: string | number) {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvSection(title: string, header: string[], rows: (string | number)[][]) {
  return [title, header.map(csvCell).join(','), ...rows.map(r => r.map(csvCell).join(','))].join('\n')
}

function downloadReport() {
  const csv = [
    csvSection('KPI Summary', ['Metric', 'Value', 'Change'], kpis.map(k => [k.label, k.value, k.change])),
    csvSection('Officer Performance', ['Officer', 'Active', 'Closed', 'Docs', 'Score'], officerData.map(o => [o.name, o.active, o.closed, o.docs, o.score])),
    csvSection('Most Applied Legal Sections', ['Section', 'Count'], topSections.map(s => [s.section, s.count])),
  ].join('\n\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function AnalyticsPage() {
  const t = useT()
  return (
    <AppShell>
      <PageHeader title={t('analytics.title')} subtitle={t('analytics.subtitle', { branch: 'Ahmedabad Cyber Crime Branch' })}>
        <Button variant="secondary" size="sm" onClick={downloadReport}><Download size={13} /> {t('analytics.exportReport')}</Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <StatCard key={k.label} label={k.label} value={k.value} change={k.change} changeType="up" color={chartColors[[0, 2, 4, 3][i]]} />
        ))}
      </div>

      {/* Monthly trends (lazy-loaded — Recharts is deferred until this section mounts) */}
      <MonthlyTrendCharts />

      {/* Crime distribution + Officer performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <CrimeDistributionChart />

        <div className="card">
          <div className="font-semibold text-sm mb-4">Officer Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="tbl-head">
                <th>Officer</th><th>Active</th><th>Closed</th><th>Docs</th><th>Score</th>
              </tr></thead>
              <tbody>
                {officerData.map((o,i)=>(
                  <tr key={i} className="tbl-row">
                    <td className="font-medium">{o.name}</td>
                    <td className="text-text-secondary">{o.active}</td>
                    <td className="text-text-secondary">{o.closed}</td>
                    <td className="text-text-secondary">{o.docs}</td>
                    <td>
                      <span className={o.score>=90?'badge-green':o.score>=80?'badge-blue':'badge-amber'}>
                        ★ {o.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-text-muted mt-3">Score: cases closed + doc quality + AI usage + turnaround time</div>
        </div>
      </div>

      {/* Top legal sections */}
      <div className="card">
        <div className="font-semibold text-sm mb-4">Most Applied Legal Sections (All Cases)</div>
        <div className="flex flex-wrap gap-2">
          {topSections.map((s,i) => {
            const c = chartColors[i % chartColors.length]
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:scale-105" style={{background:c+'15',borderColor:c+'30'}}>
                <span className="font-mono text-xs font-bold" style={{color:c}}>{s.section}</span>
                <span className="text-[11px] text-text-muted">—</span>
                <span className="text-xs font-semibold text-text-secondary">{s.count}×</span>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
