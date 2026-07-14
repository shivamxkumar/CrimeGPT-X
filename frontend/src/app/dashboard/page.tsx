'use client'
import AppShell from '@/components/layout/AppShell'
import { StatCard, PageHeader, TimelineItem } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { casesAPI, analyticsAPI } from '@/lib/api'
import { CaseListItem } from '@/types'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const weekData = [
  {day:'Mon',cases:4},{day:'Tue',cases:7},{day:'Wed',cases:5},
  {day:'Thu',cases:9},{day:'Fri',cases:6},{day:'Sat',cases:11},{day:'Sun',cases:8},
]
const pieData = [
  {name:'UPI Fraud',value:30,color:'#1a6cf6'},
  {name:'Phishing',value:21,color:'#ffa726'},
  {name:'Investment',value:16,color:'#00e676'},
  {name:'Others',value:33,color:'#b57bee'},
]
const statusColors: Record<string,string> = {
  active:'badge-amber',registered:'badge-blue',in_review:'badge-blue',chargesheet:'badge-purple',court:'badge-purple',closed:'badge-gray',
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats } = useQuery({ queryKey:['case-stats'], queryFn: ()=>casesAPI.stats().then(r=>r.data), placeholderData:{total:242,active:47,closed:183,pending_review:12} })
  const { data: casesData } = useQuery({ queryKey:['recent-cases'], queryFn:()=>casesAPI.list({limit:5}).then(r=>r.data), placeholderData:{items:[]} })

  const cases: CaseListItem[] = casesData?.items || []

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
        <StatCard label="Active Cases" value={stats?.active || 47} change="↑ 3 this week" changeType="up" color="#1a6cf6" />
        <StatCard label="Pending Review" value={stats?.pending_review || 12} change="↑ 2 urgent" changeType="down" color="#ffa726" />
        <StatCard label="Closed Cases" value={stats?.closed || 183} change="↑ 8 this month" changeType="up" color="#00e676" />
        <StatCard label="AI Docs Generated" value="1,294" change="↑ 94 this week" changeType="up" color="#00d4ff" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Recent Cases */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-sm">Recent Cases</div>
              <div className="text-xs text-text-secondary">Last 7 days</div>
            </div>
            <Link href="/cases" className="btn-secondary text-xs px-3 py-1.5">View All</Link>
          </div>
          <table className="w-full">
            <thead><tr className="tbl-head">
              <th>Case ID</th><th>Type</th><th>Status</th><th>Priority</th>
            </tr></thead>
            <tbody>
              {(cases.length ? cases : [
                {id:'1',case_id:'CC/2024/0847',crime_category:'upi_fraud',status:'active',priority:'high',victim_name:'Ramesh Patel',accused_name:'Unknown',amount_defrauded:150000,created_at:''},
                {id:'2',case_id:'CC/2024/0841',crime_category:'phishing',status:'in_review',priority:'medium',victim_name:'Sunita Mehta',accused_name:'Unknown',amount_defrauded:80000,created_at:''},
                {id:'3',case_id:'CC/2024/0839',crime_category:'investment_scam',status:'active',priority:'high',victim_name:'Vikram Shah',accused_name:'Unknown',amount_defrauded:500000,created_at:''},
                {id:'4',case_id:'CC/2024/0831',crime_category:'whatsapp_fraud',status:'chargesheet',priority:'low',victim_name:'Priya Singh',accused_name:'Mehul Rathod',amount_defrauded:50000,created_at:''},
              ] as CaseListItem[]).map(c => (
                <tr key={c.id} className="tbl-row" onClick={()=>window.location.href=`/cases/${c.case_id}`}>
                  <td><span className="font-mono text-xs text-accent-cyan">{c.case_id}</span></td>
                  <td className="text-xs capitalize">{c.crime_category.replace('_',' ')}</td>
                  <td><span className={statusColors[c.status] || 'badge-gray'}>{c.status.replace('_',' ')}</span></td>
                  <td><span className={`flex items-center gap-1 text-xs ${c.priority==='high'?'text-red-400':c.priority==='medium'?'text-amber-400':'text-green-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"/>{c.priority}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Activity */}
        <div className="card">
          <div className="font-semibold text-sm mb-4">Live Activity Feed</div>
          <TimelineItem title="Chargesheet Generated — CC/2024/0847" description="AI generated with BNS 318, 419, 420" time="Today, 14:32" status="done" />
          <TimelineItem title="Evidence Uploaded — CC/2024/0841" description="3 screenshots, 1 bank statement (SHA-256 verified)" time="Today, 13:45" status="done" />
          <TimelineItem title="Remand Request Pending — CC/2024/0839" description="Court submission due in 48 hours" time="Today, 11:20" status="warn" />
          <TimelineItem title="New Case Registered — CC/2024/0848" description="FIR scanned and OCR extracted successfully" time="Yesterday, 16:00" status="done" />
          <TimelineItem title="AI Legal Sections Suggested" description="BNS 66C, 66D identified — Confidence 94%" time="Yesterday, 09:15" status="done" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-3">Cases This Week</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={weekData} barSize={8}>
              <XAxis dataKey="day" tick={{fontSize:10,fill:'#506480'}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{background:'#111f33',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="cases" fill="#1a6cf6" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="font-semibold text-sm mb-3">Crime Distribution</div>
          <div className="flex items-center gap-3">
            <PieChart width={90} height={90}>
              <Pie data={pieData} cx={40} cy={40} innerRadius={25} outerRadius={42} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
            </PieChart>
            <div className="flex flex-col gap-1.5 text-xs">
              {pieData.map((d,i)=>(
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:d.color}}/>
                  <span className="text-text-secondary">{d.name}</span>
                  <span className="font-semibold ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="font-semibold text-sm mb-3">Document Output</div>
          {[
            {label:'Chargesheets',val:312,pct:78,color:'#1a6cf6'},
            {label:'Remand Letters',val:198,pct:55,color:'#ffa726'},
            {label:'Panchanama',val:267,pct:67,color:'#00e676'},
          ].map((d,i)=>(
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">{d.label}</span>
                <span className="font-semibold" style={{color:d.color}}>{d.val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${d.pct}%`,background:d.color}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
