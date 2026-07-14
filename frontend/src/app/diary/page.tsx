'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, TimelineItem } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { diaryAPI } from '@/lib/api'

export default function DiaryPage() {
  const { data: entries } = useQuery({
    queryKey: ['diary', 'CC/2024/0847'],
    queryFn: () => diaryAPI.list('CC/2024/0847').then(r => r.data),
    placeholderData: [],
  })

  const MOCK_ENTRIES = [
    {id:'1',entry_type:'fir_registered',title:'✅ Case Registered — Automatic',description:'FIR No. FIR-0938/24 registered. Case ID CC/2024/0847 created. IO: SI Sharma assigned.',is_automated:true,created_at:'2024-06-12T09:00:00Z'},
    {id:'2',entry_type:'ai_analysis',title:'🤖 AI Analysis Complete',description:'BNS 318, 319, IT Act 66C, 66D identified. Confidence 92-94%. Landmark judgments retrieved.',is_automated:true,created_at:'2024-06-12T09:30:00Z'},
    {id:'3',entry_type:'evidence_upload',title:'📸 Evidence Uploaded',description:'4 screenshots, 2 bank statements, 1 WhatsApp chat export. SHA-256 hash generated for all files.',is_automated:true,created_at:'2024-06-12T11:00:00Z'},
    {id:'4',entry_type:'witness_statement',title:'📞 Witness Statement Recorded',description:'Statement of Suresh Kumar (neighbor) recorded under BNSS 180. Signed and attested.',is_automated:false,created_at:'2024-06-13T14:00:00Z'},
    {id:'5',entry_type:'arrest',title:'🚨 Accused Arrested',description:'Mehul Rathod arrested at Surat address. Panchanama completed. Remand requested.',is_automated:false,created_at:'2024-06-14T10:30:00Z'},
  ]
  const list = (entries?.length ? entries : MOCK_ENTRIES)

  const chain = [
    {item:'Screenshot #1',by:'SI Sharma',time:'12/06 09:45',status:'Verified'},
    {item:'Bank Statement',by:'SI Sharma',time:'12/06 10:00',status:'Verified'},
    {item:'WhatsApp Export',by:'SI Sharma',time:'12/06 10:30',status:'Verified'},
    {item:'Accused Phone',by:'SI Sharma',time:'14/06 11:00',status:'Pending Lab'},
  ]

  return (
    <AppShell>
      <PageHeader title="Case Diary — CC/2024/0847" subtitle="Automated investigation timeline & audit trail">
        <button className="btn-primary text-sm">+ Add Entry</button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-4">📅 Investigation Timeline</div>
          {list.map((e: any, i: number) => (
            <TimelineItem
              key={e.id}
              title={e.title}
              description={e.description}
              time={new Date(e.created_at).toLocaleString('en-IN')}
              status={e.entry_type === 'arrest' ? 'warn' : e.is_automated ? 'done' : 'done'}
            />
          ))}
          <TimelineItem title="🏛️ Court Submission — Pending" description="Chargesheet to be submitted within 60 days of arrest. AI chargesheet ready for review." time="⏳ Pending" status="pending" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="font-semibold text-sm mb-3">🔒 Chain of Custody</div>
            <table className="w-full text-sm">
              <thead><tr className="tbl-head"><th>Item</th><th>Received By</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {chain.map((c,i) => (
                  <tr key={i} className="tbl-row">
                    <td>{c.item}</td>
                    <td className="text-text-secondary text-xs">{c.by}</td>
                    <td className="font-mono text-xs text-text-muted">{c.time}</td>
                    <td><span className={c.status==='Verified'?'badge-green':'badge-amber'}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card flex-1">
            <div className="font-semibold text-sm mb-3">📝 Officer Notes</div>
            <textarea className="input text-sm w-full" rows={5} defaultValue="Bank confirmed unauthorized transactions. IMPS transfer traces to mule account in Andhra Pradesh. CCTV footage from ATM requested. Forensic analysis of accused phone pending." />
            <button className="btn-primary text-sm mt-3">Save Note</button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
