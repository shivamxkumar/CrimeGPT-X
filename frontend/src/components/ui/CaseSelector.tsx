'use client'
import { useEffect, useMemo } from 'react'
import { CaseListItem } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { casesAPI } from '@/lib/api'
import { useCaseSelectionStore } from '@/lib/store'
import Link from 'next/link'
import { Button } from './Button'

// Shared "which case am I working on" control for pages (Evidence, Diary,
// Documents, Legal AI) that operate on a single case at a time. Backed by
// the real case list — no hardcoded case ID.
export function useSelectedCase() {
  const { selectedCaseId, setSelectedCaseId } = useCaseSelectionStore()
  const { data, isLoading } = useQuery({
    queryKey: ['cases-for-selector'],
    queryFn: () => casesAPI.list({ limit: 200 }).then(r => r.data),
    staleTime: 30_000,
  })
  const cases: CaseListItem[] = useMemo(() => data?.items || [], [data])

  useEffect(() => {
    if (!selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].case_id)
    }
  }, [selectedCaseId, cases, setSelectedCaseId])

  const selectedCase = cases.find(c => c.case_id === selectedCaseId) || null
  return { cases, selectedCaseId, setSelectedCaseId, selectedCase, isLoading }
}

export function CaseSelector() {
  const { cases, selectedCaseId, setSelectedCaseId, isLoading } = useSelectedCase()

  if (isLoading) return <span className="text-xs text-text-muted">Loading cases…</span>

  if (cases.length === 0) {
    return (
      <Link href="/cases/new"><Button size="sm">+ Register a case to get started</Button></Link>
    )
  }

  return (
    <select
      className="input text-xs w-56"
      value={selectedCaseId || ''}
      onChange={e => setSelectedCaseId(e.target.value)}
    >
      {cases.map(c => (
        <option key={c.case_id} value={c.case_id}>{c.case_id} — {c.victim_name}</option>
      ))}
    </select>
  )
}
