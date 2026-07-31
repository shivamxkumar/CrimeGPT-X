'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, CaseSelector, useSelectedCase, EmptyState, Spinner, Alert, Button, Skeleton } from '@/components/ui'
import { useState } from 'react'
import { useDiary, useAddDiaryEntry, useEvidence } from '@/hooks'
import { motion } from 'framer-motion'
import { Lock, CalendarClock, Send, StickyNote } from 'lucide-react'
import { entryStyle } from '@/lib/diaryStyles'

export default function DiaryPage() {
  const { selectedCaseId, cases, isLoading: casesLoading } = useSelectedCase()
  const { data: entries, isLoading, isError } = useDiary(selectedCaseId || '')
  const { data: evidence } = useEvidence(selectedCaseId || '')
  const addEntry = useAddDiaryEntry(selectedCaseId || '')
  const [note, setNote] = useState('')

  const list = entries || []

  return (
    <AppShell>
      <PageHeader title={selectedCaseId ? `Case Diary — ${selectedCaseId}` : 'Case Diary'} subtitle="Automated investigation timeline & audit trail">
        <CaseSelector />
      </PageHeader>

      {casesLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg"/></div>
      ) : cases.length === 0 ? (
        <EmptyState icon="📂" title="No cases yet" description="Register a case first to start its investigation diary." />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-5 flex items-center gap-2"><CalendarClock size={15} className="text-accent-blue" /> Investigation Timeline</div>
          {isLoading ? (
            <div className="space-y-4">{[0,1,2].map(i => <div key={i} className="flex gap-3"><Skeleton className="w-8 h-8 rounded-full flex-shrink-0" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-2/3" /></div></div>)}</div>
          ) : isError ? (
            <Alert variant="error" icon="⚠️">Failed to load the diary for this case.</Alert>
          ) : list.length === 0 ? (
            <EmptyState icon="📝" title="No diary entries yet" description="Entries are created automatically as you work the case, or add one manually." />
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/[0.07]" />
              <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
                {list.map((e: any) => {
                  const style = entryStyle(e.entry_type)
                  const Icon = style.icon
                  return (
                    <motion.div
                      key={e.id}
                      variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                      className="relative flex gap-3 pb-5 last:pb-0"
                    >
                      <div
                        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                        style={{ background: style.color + '1a', borderColor: style.color + '50' }}
                      >
                        <Icon size={14} style={{ color: style.color }} />
                      </div>
                      <div className="min-w-0 pt-1">
                        <div className="text-[10px] font-mono text-text-muted mb-0.5">{new Date(e.created_at).toLocaleString('en-IN')}</div>
                        <div className="text-sm font-semibold text-text-primary">{e.title}</div>
                        {e.description && <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{e.description}</div>}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="font-semibold text-sm mb-3 flex items-center gap-2"><Lock size={14} className="text-accent-blue" /> Chain of Custody (Evidence)</div>
            {!evidence?.length ? (
              <div className="text-xs text-text-muted">No evidence uploaded for this case yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="tbl-head"><th>Item</th><th>Hash</th><th>Status</th></tr></thead>
                  <tbody>
                    {evidence.map((ev: any) => (
                      <tr key={ev.id} className="tbl-row">
                        <td className="text-xs">{ev.original_name}</td>
                        <td className="font-mono text-[10px] text-text-muted">{ev.sha256_hash.slice(0,12)}…</td>
                        <td><span className={ev.is_verified ? 'badge-green' : 'badge-amber'}>{ev.is_verified ? 'Verified' : 'Pending'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card flex-1">
            <div className="font-semibold text-sm mb-3 flex items-center gap-2"><StickyNote size={14} className="text-accent-blue" /> Add Officer Note</div>
            <textarea
              className="input text-sm w-full"
              rows={5}
              placeholder="Add an investigation note to this case's diary..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <Button
              className="mt-3"
              size="sm"
              disabled={!note.trim() || addEntry.isPending || !selectedCaseId}
              loading={addEntry.isPending}
              onClick={() => addEntry.mutate(
                { entry_type: 'note', title: 'Officer Note', description: note },
                { onSuccess: () => setNote('') }
              )}
            >
              {!addEntry.isPending && <Send size={13} />} Save Note
            </Button>
          </div>
        </div>
      </div>
      )}
    </AppShell>
  )
}
