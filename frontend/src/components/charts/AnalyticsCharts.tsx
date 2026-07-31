'use client'
import { chartColors, chartAxis, chartTooltipStyle } from '@/lib/chartTheme'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
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
  {category:'UPI Fraud',cases:94},
  {category:'Phishing',cases:67},
  {category:'Investment',cases:52},
  {category:'WhatsApp',cases:38},
  {category:'Social Media',cases:29},
  {category:'OTP Fraud',cases:22},
]

const TP = ({ active, payload }: any) => active && payload?.length ? (
  <div style={chartTooltipStyle} className="px-3 py-2">
    {payload.map((p: any) => <div key={p.name} style={{color:p.color}}>{p.name}: <strong>{p.value}</strong></div>)}
  </div>
) : null

export function MonthlyTrendCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      <div className="card">
        <div className="font-semibold text-sm mb-4">Monthly Case + Document Volume</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barGap={4}>
            <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false}/>
            <YAxis tick={chartAxis} axisLine={false} tickLine={false}/>
            <Tooltip content={<TP/>} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
            <Bar dataKey="cases" name="Cases" fill={chartColors[0]} radius={[4,4,0,0]} barSize={14}/>
            <Bar dataKey="docs"  name="Docs"  fill={chartColors[4]} radius={[4,4,0,0]} barSize={14} opacity={0.7}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div className="font-semibold text-sm mb-4">Amount Recovered (₹ Lakh)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false}/>
            <YAxis tick={chartAxis} axisLine={false} tickLine={false}/>
            <Tooltip content={<TP/>}/>
            <Line type="monotone" dataKey="recovered" name="₹ Lakh" stroke={chartColors[2]} strokeWidth={2} dot={{fill:chartColors[2],r:4}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function CrimeDistributionChart() {
  return (
    <div className="card">
      <div className="font-semibold text-sm mb-4">Crime Type Distribution</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={crimeData} layout="vertical" barSize={12}>
          <XAxis type="number" tick={chartAxis} axisLine={false} tickLine={false}/>
          <YAxis dataKey="category" type="category" tick={{ ...chartAxis, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={95}/>
          <Tooltip content={<TP/>} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
          <Bar dataKey="cases" name="Cases" radius={[0,4,4,0]}>
            {crimeData.map((_, i)=><Cell key={i} fill={chartColors[i % chartColors.length]}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
