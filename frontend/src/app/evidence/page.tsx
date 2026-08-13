'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, EmptyState, Spinner, CaseSelector, useSelectedCase, Button, Modal, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useEvidence, useUploadEvidence, useDeleteEvidence } from '@/hooks'
import { evidenceAPI } from '@/lib/api'
import { Evidence } from '@/types'
import { Upload, Lock, CheckCircle, AlertTriangle, Download, Trash2, Search, HardDrive, CalendarDays, Fingerprint, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

const typeIcons: Record<string,string> = {
  image:'🖼️',video:'🎬',audio:'🎵',pdf:'📄',document:'📝',screenshot:'📸',chat_export:'💬',bank_statement:'🏦',other:'📁'
}
const categoryColors: Record<string,string> = {
  critical:'badge-red',primary:'badge-amber',supporting:'badge-blue',corroborative:'badge-gray'
}
const categoryAccent: Record<string,string> = {
  critical:'#ef4444',primary:'#f59e0b',supporting:'#3b82f6',corroborative:'#9ca3af'
}

function formatBytes(b: number) {
  if (b < 1024) return b+'B'
  if (b < 1024*1024) return (b/1024).toFixed(1)+'KB'
  return (b/(1024*1024)).toFixed(1)+'MB'
}

function EvidencePreview({ evidence }: { evidence: Evidence }) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setSrc(null)
    setFailed(false)
    if (evidence.evidence_type !== 'image') return
    let objectUrl: string | null = null
    evidenceAPI.download(evidence.id).then(({ data }) => {
      objectUrl = window.URL.createObjectURL(data)
      setSrc(objectUrl)
    }).catch(() => setFailed(true))
    return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl) }
  }, [evidence.id, evidence.evidence_type])

  if (evidence.evidence_type !== 'image') {
    return (
      <div className="w-full h-44 rounded-xl bg-bg-base border border-white/[0.06] flex items-center justify-center text-5xl">
        {typeIcons[evidence.evidence_type] || '📁'}
      </div>
    )
  }
  if (failed) {
    return (
      <div className="w-full h-44 rounded-xl bg-bg-base border border-white/[0.06] flex flex-col items-center justify-center gap-2 text-text-muted">
        <ImageOff size={22} /><span className="text-xs">Preview unavailable</span>
      </div>
    )
  }
  if (!src) {
    return <div className="w-full h-44 rounded-xl skeleton" />
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={evidence.original_name} className="w-full h-44 object-cover rounded-xl border border-white/[0.06]" />
  )
}

export default function EvidencePage() {
  const isDemoMode = useAuthStore(s => s.isDemoMode)
  const { selectedCaseId, cases, isLoading: casesLoading } = useSelectedCase()
  const { data: evidence, isLoading, isError } = useEvidence(selectedCaseId || '')
  const uploadMutation = useUploadEvidence(selectedCaseId || '')
  const deleteMutation = useDeleteEvidence(selectedCaseId || '')
  const [selected, setSelected] = useState<Evidence | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all')

  async function handleDownload(ev: Evidence) {
    setDownloading(true)
    try {
      const { data } = await evidenceAPI.download(ev.id)
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = ev.original_name
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Evidence download failed')
    } finally {
      setDownloading(false)
    }
  }

  function handleDelete(ev: Evidence) {
    deleteMutation.mutate(ev.id, { onSuccess: () => setSelected(null) })
  }

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file || !selectedCaseId) return
    uploadMutation.mutate({ file })
  }, [selectedCaseId, uploadMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled: !selectedCaseId || isDemoMode })

  const list: Evidence[] = useMemo(() => evidence || [], [evidence])
  const filtered = useMemo(() => list.filter(ev => {
    if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false
    if (statusFilter === 'verified' && !ev.is_verified) return false
    if (statusFilter === 'pending' && ev.is_verified) return false
    if (query && !ev.original_name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  }), [list, query, categoryFilter, statusFilter])

  return (
    <AppShell>
      <PageHeader title="Digital Evidence Vault" subtitle={selectedCaseId ? `Case ${selectedCaseId} — SHA-256 verified, chain of custody maintained` : 'Select a case to view its evidence'}>
        <CaseSelector />
        <span className="badge-blue">{list.length} files</span>
      </PageHeader>

      {casesLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg"/></div>
      ) : cases.length === 0 ? (
        <EmptyState icon="📂" title="No cases yet" description="Register a case first, then upload evidence against it." />
      ) : (
        <>
          <Alert variant="info" icon="🔐">
            All evidence files are automatically hashed with <strong>SHA-256</strong> on upload. Chain of custody is maintained with an immutable audit trail under BSA Section 63.
          </Alert>

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl2 p-8 text-center mb-5 transition-all ${
              isDemoMode ? 'cursor-not-allowed opacity-60 border-white/10' : 'cursor-pointer ' + (isDragActive ? 'border-accent-blue bg-accent-blue/5' : 'border-white/10 hover:border-accent-blue/40 hover:bg-bg-card2')
            }`}
          >
            <input {...getInputProps()} />
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <div className="text-sm text-text-secondary">Uploading, hashing, and running AI analysis...</div>
              </div>
            ) : (
              <>
                <Upload size={36} className="mx-auto mb-3 text-text-muted" />
                <div className="font-medium mb-1">{isDemoMode ? 'Evidence upload disabled in demo' : isDragActive ? 'Drop file here' : 'Drop evidence files here or click to upload'}</div>
                <div className="text-sm text-text-secondary">{isDemoMode ? 'Browse the pre-loaded evidence below instead' : 'Images, PDFs, Audio, Video, Chat exports — Max 50MB'}</div>
              </>
            )}
          </div>

          {isError && <Alert variant="error" icon="⚠️">Failed to load evidence for this case — check the backend connection.</Alert>}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => <div key={i} className="card-sm"><div className="skeleton h-24 w-full mb-3" /><div className="skeleton h-3 w-3/4 mb-2" /><div className="skeleton h-3 w-1/2" /></div>)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon="🗂️" title="No evidence uploaded yet" description="Drop a file above to begin building the chain of custody for this case." />
          ) : (
          <>
            {/* Search + filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[12rem] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search evidence..." className="input pl-8" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="supporting">Supporting</SelectItem>
                  <SelectItem value="corroborative">Corroborative</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-card2 border border-white/[0.06]">
                {(['all','verified','pending'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    aria-pressed={statusFilter === s}
                    className={cn('px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all', statusFilter === s ? 'bg-gradient-brand text-white shadow-soft' : 'text-text-secondary hover:text-text-primary')}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-xs text-text-muted ml-auto">{filtered.length} of {list.length} shown</span>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon="🔍" title="No matching evidence" description="Try a different search term or filter." />
            ) : (
            <motion.div
              initial="hidden" animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filtered.map(ev => (
                <motion.button
                  key={ev.id}
                  variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setSelected(ev)}
                  className="card-sm text-left relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: categoryAccent[ev.category] }} />
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{typeIcons[ev.evidence_type] || '📁'}</span>
                    {ev.is_verified
                      ? <span className="badge-green flex items-center gap-1 text-[10px]"><CheckCircle size={10}/>Verified</span>
                      : <span className="badge-amber flex items-center gap-1 text-[10px]"><AlertTriangle size={10}/>Pending</span>
                    }
                  </div>
                  <div className="text-sm font-semibold truncate mb-2">{ev.original_name}</div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-white/[0.04] rounded-full px-2 py-0.5"><HardDrive size={10}/>{formatBytes(ev.file_size)}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-white/[0.04] rounded-full px-2 py-0.5"><CalendarDays size={10}/>{new Date(ev.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${categoryColors[ev.category]} capitalize`}>{ev.category}</span>
                    <span className="hash text-[10px] flex items-center gap-1"><Fingerprint size={11}/>{ev.sha256_hash.slice(0, 8)}…</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
            )}
          </>
          )}

          {/* Detail modal */}
          <Modal open={!!selected} onOpenChange={open => !open && setSelected(null)} title={selected?.original_name} className="max-h-[85vh] overflow-y-auto">
            {selected && (
              <div>
                <EvidencePreview evidence={selected} />
                <div className="flex items-center gap-3 mt-4 mb-4">
                  <div className="flex-1">
                    <div className="text-xs text-text-secondary capitalize">{selected.evidence_type.replace('_',' ')} · {formatBytes(selected.file_size)}</div>
                  </div>
                  <Button variant="secondary" size="sm" aria-label="Download evidence" disabled={downloading} onClick={() => handleDownload(selected)}>
                    {downloading ? <Spinner size="sm" /> : <Download size={13} />}
                  </Button>
                  <Button variant="danger" size="sm" aria-label="Delete evidence" disabled={isDemoMode || deleteMutation.isPending} onClick={() => handleDelete(selected)}>
                    {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 size={13} />}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">SHA-256 Hash</div>
                    <div className="hash text-[11px] break-all bg-bg-base rounded-lg p-2">{selected.sha256_hash}</div>
                  </div>

                  {selected.description && (
                    <div>
                      <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">Description</div>
                      <div className="text-sm text-text-secondary">{selected.description}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">AI Relevance Analysis</div>
                    {selected.ai_analysis?.error ? (
                      <div className="text-xs text-amber-400">{selected.ai_analysis.error}</div>
                    ) : selected.ai_analysis?.relevance_summary ? (
                      <div className="text-sm text-text-secondary">{selected.ai_analysis.relevance_summary}</div>
                    ) : (
                      <div className="text-xs text-text-muted">No AI analysis available for this item.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-text-muted mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <Lock size={11} /> Chain of Custody
                    </div>
                    <div className="relative">
                      {selected.custody_chain.length > 1 && <div className="absolute left-[3px] top-1.5 bottom-1.5 w-px bg-white/[0.07]" />}
                      {selected.custody_chain.map((c, i) => (
                        <div key={i} className="relative flex gap-2.5 text-xs mb-2.5 last:mb-0 pl-4">
                          <div className="absolute left-0 top-1 w-[7px] h-[7px] rounded-full bg-accent-blue" />
                          <div>
                            <div className="font-medium">{c.officer_name} · {c.action}</div>
                            <div className="text-text-muted">{new Date(c.timestamp).toLocaleString('en-IN')}</div>
                            {c.notes && <div className="text-text-secondary">{c.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selected.tags.length > 0 && (
                    <div>
                      <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {selected.tags.map(t => <span key={t} className="badge-gray">{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </AppShell>
  )
}
