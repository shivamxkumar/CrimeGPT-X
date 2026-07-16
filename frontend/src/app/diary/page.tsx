'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, TimelineItem, CaseSelector, useSelectedCase, EmptyState, Spinner, Alert } from '@/components/ui'
import { useState } from 'react'
import { useDiary, useAddDiaryEntry, useEvidence } from '@/hooks'

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
      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-4">📅 Investigation Timeline</div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : isError ? (
            <Alert variant="error" icon="⚠️">Failed to load the diary for this case.</Alert>
          ) : list.length === 0 ? (
            <EmptyState icon="📝" title="No diary entries yet" description="Entries are created automatically as you work the case, or add one manually." />
          ) : (
            list.map((e: any) => (
              <TimelineItem
                key={e.id}
                title={e.title}
                description={e.description}
                time={new Date(e.created_at).toLocaleString('en-IN')}
                status={e.entry_type === 'arrest' ? 'warn' : 'done'}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="font-semibold text-sm mb-3">🔒 Chain of Custody (Evidence)</div>
            {!evidence?.length ? (
              <div className="text-xs text-text-muted">No evidence uploaded for this case yet.</div>
            ) : (
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
            )}
          </div>
          <div className="card flex-1">
            <div className="font-semibold text-sm mb-3">📝 Add Officer Note</div>
            <textarea
              className="input text-sm w-full"
              rows={5}
              placeholder="Add an investigation note to this case's diary..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button
              className="btn-primary text-sm mt-3"
              disabled={!note.trim() || addEntry.isPending || !selectedCaseId}
              onClick={() => addEntry.mutate(
                { entry_type: 'note', title: 'Officer Note', description: note },
                { onSuccess: () => setNote('') }
              )}
            >
              {addEntry.isPending ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
      )}
    </AppShell>
  )
}
