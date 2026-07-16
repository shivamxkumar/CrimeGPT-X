/**
 * CrimeGPT-X — Custom React Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { casesAPI, evidenceAPI, diaryAPI, docsAPI, aiAPI, analyticsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// ── Cases ─────────────────────────────────────────────────────
export function useCases(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['cases', params],
    queryFn: () => casesAPI.list(params).then(r => r.data),
    staleTime: 30_000,
  })
}

export function useCase(id: string) {
  return useQuery({
    queryKey: ['case', id],
    queryFn: () => casesAPI.get(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useCaseStats() {
  return useQuery({
    queryKey: ['case-stats'],
    queryFn: () => casesAPI.stats().then(r => r.data),
    refetchInterval: 60_000,
  })
}

export function useCreateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => casesAPI.create(data).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Case ${data.case_id} registered!`)
      qc.invalidateQueries({ queryKey: ['cases'] })
      qc.invalidateQueries({ queryKey: ['case-stats'] })
    },
    onError: () => toast.error('Case creation failed'),
  })
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => casesAPI.update(id, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Case updated')
      qc.invalidateQueries({ queryKey: ['case', id] })
      qc.invalidateQueries({ queryKey: ['cases'] })
    },
    onError: () => toast.error('Update failed'),
  })
}

// ── Evidence ──────────────────────────────────────────────────
export function useEvidence(caseId: string) {
  return useQuery({
    queryKey: ['evidence', caseId],
    queryFn: () => evidenceAPI.list(caseId).then(r => r.data),
    enabled: !!caseId,
  })
}

export function useUploadEvidence(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, category, description }: { file: File; category?: string; description?: string }) =>
      evidenceAPI.upload(caseId, file, category, description).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Evidence uploaded: ${data.original_name}`)
      qc.invalidateQueries({ queryKey: ['evidence', caseId] })
    },
    onError: () => toast.error('Evidence upload failed'),
  })
}

export function useDeleteEvidence(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (evidenceId: string) => evidenceAPI.delete(evidenceId),
    onSuccess: () => {
      toast.success('Evidence deleted')
      qc.invalidateQueries({ queryKey: ['evidence', caseId] })
    },
    onError: () => toast.error('Evidence deletion failed'),
  })
}

// ── Documents ─────────────────────────────────────────────────
export function useDocuments(caseId: string) {
  return useQuery({
    queryKey: ['documents', caseId],
    queryFn: () => docsAPI.listForCase(caseId).then(r => r.data),
    enabled: !!caseId,
  })
}

export function useGenerateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, docType, language }: { caseId: string; docType: string; language?: string }) =>
      docsAPI.generate(caseId, docType, language).then(r => r.data),
    onSuccess: (data, vars) => {
      toast.success(`${data.title} generated!`)
      qc.invalidateQueries({ queryKey: ['documents', vars.caseId] })
    },
    onError: () => toast.error('Document generation failed'),
  })
}

// ── Diary ─────────────────────────────────────────────────────
export function useDiary(caseId: string) {
  return useQuery({
    queryKey: ['diary', caseId],
    queryFn: () => diaryAPI.list(caseId).then(r => r.data),
    enabled: !!caseId,
  })
}

export function useAddDiaryEntry(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entry: any) => diaryAPI.add(caseId, entry).then(r => r.data),
    onSuccess: () => {
      toast.success('Diary entry added')
      qc.invalidateQueries({ queryKey: ['diary', caseId] })
    },
  })
}

// ── AI ────────────────────────────────────────────────────────
export function useAnalyzeFIR() {
  return useMutation({
    mutationFn: ({ firText, caseId }: { firText: string; caseId?: string }) =>
      aiAPI.analyzeFIR(firText, caseId).then(r => r.data),
    onError: () => toast.error('AI analysis failed — check API connection'),
  })
}

// ── Analytics ─────────────────────────────────────────────────
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsAPI.overview().then(r => r.data),
    staleTime: 120_000,
  })
}

export function useCrimeDistribution() {
  return useQuery({
    queryKey: ['crime-distribution'],
    queryFn: () => analyticsAPI.crimeDistribution().then(r => r.data),
    staleTime: 300_000,
  })
}
