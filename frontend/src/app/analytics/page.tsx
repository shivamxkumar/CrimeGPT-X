'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, StatCard } from '@/components/ui'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const monthlyData = [
  {month:'Jan',cases:28,docs:142,recovered:18.2},
  {month:'Feb',cases:34,docs:178,recovered:24.5},
  {month:'Mar',cases:29,docs:159,recovered:19.8},
  {month:'Apr',cases:41,docs:212,recovered:31.4},
  {month:'May',cases:38,docs:198,recovered:28.7},
  {month:'Jun',cases:47,docs:247,recovered:36.1},
]
const crimeData = [
  {category:'UPI Fraud',cases:94,color:'#1a6cf6'},
  {category:'Phishing',cases:67,color:'#ffa726'},
  {category:'Investment',cases:52,color:'#00e676'},
  {category:'WhatsApp',cases:38,color:'#b57bee'},
  {category:'Social Media',cases:29,color:'#00d4ff'},
  {category:'OTP Fraud',cases:22,color:'#ff5252'},
]
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
const TP = ({ active, payload }: any) => active && payload?.length ? (
  <div className="bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
    {payload.map((p: any) => <div key={p.name} style={{color:p.color}}>{p.name}: <strong>{p.value}</strong></div>)}
  </div>
) : null

export default function AnalyticsPage() {
  return (
    <AppShell>
      <PageHeader title="Analytics & Intelligence" subtitle="Department-level statistics — Ahmedabad Cyber Crime Branch">
        <select className="input text-xs w-36 py-1.5">
          <option>Last 30 Days</option><option>Last 90 Days</option><option>This Year</option>
        </select>
        <button className="btn-secondary text-sm">📥 Export Report</button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Cases Filed"    value={312}   change="↑ 18% vs last month" changeType="up"  color="#1a6cf6" />
        <StatCard label="Conviction Rate"      value="67%"   change="↑ 4% vs last year"   changeType="up"  color="#00e676" />
        <StatCard label="Avg. Investigation"   value="43d"   change="↓ 12 days saved by AI" changeType="up" color="#00d4ff" />
        <StatCard label="Amount Recovered"     value="₹2.4Cr" change="↑ 31% this year"    changeType="up"  color="#ffa726" />
      </div>

      {/* Monthly trends */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="font-semibold text-sm mb-4">Monthly Case + Document Volume</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={4}>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'#506480'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#506480'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TP/>}/>
              <Bar dataKey="cases" name="Cases" fill="#1a6cf6" radius={[3,3,0,0]} barSize={14}/>
              <Bar dataKey="docs"  name="Docs"  fill="#00d4ff" radius={[3,3,0,0]} barSize={14} opacity={0.7}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="font-semibold text-sm mb-4">Amount Recovered (₹ Lakh)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'#506480'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#506480'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TP/>}/>
              <Line type="monotone" dataKey="recovered" name="₹ Lakh" stroke="#00e676" strokeWidth={2} dot={{fill:'#00e676',r:4}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Crime distribution + Officer performance */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="font-semibold text-sm mb-4">Crime Type Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={crimeData} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{fontSize:11,fill:'#506480'}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="category" type="category" tick={{fontSize:11,fill:'#8aa3c8'}} axisLine={false} tickLine={false} width={95}/>
              <Tooltip content={<TP/>}/>
              <Bar dataKey="cases" name="Cases" radius={[0,4,4,0]}>
                {crimeData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="font-semibold text-sm mb-4">Officer Performance</div>
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
          <div className="text-xs text-text-muted mt-3">Score: cases closed + doc quality + AI usage + turnaround time</div>
        </div>
      </div>

      {/* Top legal sections */}
      <div className="card">
        <div className="font-semibold text-sm mb-4">Most Applied Legal Sections (All Cases)</div>
        <div className="flex flex-wrap gap-2">
          {topSections.map((s,i) => {
            const colors = ['#1a6cf6','#00d4ff','#b57bee','#ffa726','#00e676','#ff5252','#8aa3c8','#506480']
            const c = colors[i % colors.length]
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105" style={{background:c+'15',borderColor:c+'30'}}>
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
