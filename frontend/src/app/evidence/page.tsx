'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, HashDisplay, EmptyState, Spinner, CaseSelector, useSelectedCase } from '@/components/ui'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useEvidence, useUploadEvidence, useDeleteEvidence } from '@/hooks'
import { evidenceAPI } from '@/lib/api'
import { Evidence } from '@/types'
import { Upload, Lock, CheckCircle, AlertTriangle, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const typeIcons: Record<string,string> = {
  image:'🖼️',video:'🎬',audio:'🎵',pdf:'📄',document:'📝',screenshot:'📸',chat_export:'💬',bank_statement:'🏦',other:'📁'
}
const categoryColors: Record<string,string> = {
  critical:'badge-red',primary:'badge-amber',supporting:'badge-blue',corroborative:'badge-gray'
}

function formatBytes(b: number) {
  if (b < 1024) return b+'B'
  if (b < 1024*1024) return (b/1024).toFixed(1)+'KB'
  return (b/(1024*1024)).toFixed(1)+'MB'
}

export default function EvidencePage() {
  const { selectedCaseId, cases, isLoading: casesLoading } = useSelectedCase()
  const { data: evidence, isLoading, isError } = useEvidence(selectedCaseId || '')
  const uploadMutation = useUploadEvidence(selectedCaseId || '')
  const deleteMutation = useDeleteEvidence(selectedCaseId || '')
  const [selected, setSelected] = useState<Evidence | null>(null)
  const [downloading, setDownloading] = useState(false)

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled: !selectedCaseId })

  const list: Evidence[] = evidence || []

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
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-5 cursor-pointer transition-all ${
              isDragActive ? 'border-accent-blue bg-accent-blue/5' : 'border-white/10 hover:border-accent-blue/40 hover:bg-bg-card2'
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
                <div className="font-medium mb-1">{isDragActive ? 'Drop file here' : 'Drop evidence files here or click to upload'}</div>
                <div className="text-sm text-text-secondary">Images, PDFs, Audio, Video, Chat exports — Max 50MB</div>
              </>
            )}
          </div>

          {isError && <Alert variant="error" icon="⚠️">Failed to load evidence for this case — check the backend connection.</Alert>}

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg"/></div>
          ) : list.length === 0 ? (
            <EmptyState icon="🗂️" title="No evidence uploaded yet" description="Drop a file above to begin building the chain of custody for this case." />
          ) : (
          <div className="grid grid-cols-5 gap-4">
            {/* Evidence table */}
            <div className={`${selected ? 'col-span-3' : 'col-span-5'} card`}>
              <table className="w-full">
                <thead><tr className="tbl-head">
                  <th>File</th><th>Type</th><th>Size</th><th>Category</th><th>SHA-256</th><th>Status</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {list.map(ev => (
                    <tr key={ev.id} className="tbl-row" onClick={() => setSelected(ev === selected ? null : ev)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeIcons[ev.evidence_type] || '📁'}</span>
                          <span className="text-sm font-medium max-w-[180px] truncate">{ev.original_name}</span>
                        </div>
                      </td>
                      <td><span className="badge-gray capitalize text-[11px]">{ev.evidence_type.replace('_',' ')}</span></td>
                      <td className="text-xs text-text-secondary">{formatBytes(ev.file_size)}</td>
                      <td><span className={`${categoryColors[ev.category]} capitalize`}>{ev.category}</span></td>
                      <td><HashDisplay hash={ev.sha256_hash} /></td>
                      <td>
                        {ev.is_verified
                          ? <span className="badge-green flex items-center gap-1"><CheckCircle size={10}/>Verified</span>
                          : <span className="badge-amber flex items-center gap-1"><AlertTriangle size={10}/>Pending</span>
                        }
                      </td>
                      <td className="text-xs text-text-secondary">{new Date(ev.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="col-span-2 card animate-slide-in">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-3xl mb-2">{typeIcons[selected.evidence_type]}</div>
                    <div className="font-semibold">{selected.original_name}</div>
                    <div className="text-xs text-text-secondary capitalize">{selected.evidence_type.replace('_',' ')} · {formatBytes(selected.file_size)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary text-xs px-2.5 py-1.5" disabled={downloading} onClick={() => handleDownload(selected)}>
                      {downloading ? <Spinner size="sm" /> : <Download size={13} />}
                    </button>
                    <button className="btn-danger text-xs px-2.5 py-1.5" disabled={deleteMutation.isPending} onClick={() => handleDelete(selected)}>
                      {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 size={13} />}
                    </button>
                    <button className="text-text-muted hover:text-text-primary" onClick={() => setSelected(null)}>✕</button>
                  </div>
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
                    {selected.custody_chain.map((c, i) => (
                      <div key={i} className="flex gap-2 text-xs mb-2 last:mb-0">
                        <div className="w-1 bg-accent-blue/30 rounded-full flex-shrink-0" />
                        <div>
                          <div className="font-medium">{c.officer_name} · {c.action}</div>
                          <div className="text-text-muted">{new Date(c.timestamp).toLocaleString('en-IN')}</div>
                          {c.notes && <div className="text-text-secondary">{c.notes}</div>}
                        </div>
                      </div>
                    ))}
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
          </div>
          )}
        </>
      )}
    </AppShell>
  )
}
