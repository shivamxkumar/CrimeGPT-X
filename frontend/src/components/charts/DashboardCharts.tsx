'use client'
import { chartColors, chartAxis, chartTooltipStyle } from '@/lib/chartTheme'
import { CRIME_CATEGORY_LABELS } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Props {
  weeklyTrend: any[] | undefined
  distribution: any[] | undefined
  docStats: any[] | undefined
}

export default function DashboardCharts({ weeklyTrend, distribution, docStats }: Props) {
  const totalCrimes = (distribution || []).reduce((sum: number, d: any) => sum + d.count, 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div className="card">
        <div className="font-semibold text-sm mb-3">Cases This Week</div>
        {!weeklyTrend?.length ? (
          <div className="text-xs text-text-muted flex items-center justify-center h-[100px]">No cases registered in the last 7 days</div>
        ) : (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={weeklyTrend} barSize={10}>
            <defs>
              <linearGradient id="dashBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors[0]} stopOpacity={1} />
                <stop offset="100%" stopColor={chartColors[0]} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={chartAxis} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="cases" fill="url(#dashBarGrad)" radius={[5,5,0,0]} />
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
            <Pie data={distribution} cx={40} cy={40} innerRadius={25} outerRadius={42} dataKey="count" strokeWidth={0} paddingAngle={2}>
              {distribution.map((_: any, i: number) => <Cell key={i} fill={chartColors[i % chartColors.length]}/>)}
            </Pie>
          </PieChart>
          <div className="flex flex-col gap-1.5 text-xs">
            {distribution.map((d: any,i: number)=>(
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:chartColors[i % chartColors.length]}}/>
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
                  <span className="font-semibold" style={{color:chartColors[i % chartColors.length]}}>{d.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{width:`${(d.count/max)*100}%`,background:chartColors[i % chartColors.length]}}/>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
