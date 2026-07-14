'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, HashDisplay, EmptyState, Spinner } from '@/components/ui'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { evidenceAPI } from '@/lib/api'
import { Evidence } from '@/types'
import { Upload, Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_EVIDENCE: Evidence[] = [
  {id:'1',file_name:'whatsapp_chat.pdf',original_name:'whatsapp_chat_export.pdf',file_size:2355000,mime_type:'application/pdf',evidence_type:'chat_export',category:'critical',sha256_hash:'a3f8c2d1e6b5f4a892c7d3e1f0b2a4c8d6e5f3a2b1c0d9e8f7a6b5c4d3e2f1',is_verified:true,description:'WhatsApp conversation export',tags:['fraud','conversation'],custody_chain:[{officer_id:'1',officer_name:'SI Sharma',action:'UPLOAD',timestamp:'2024-06-12T09:45:00Z',notes:'Uploaded by IO'}],created_at:'2024-06-12T09:45:00Z'},
  {id:'2',file_name:'bank_statement.pdf',original_name:'bank_statement_jun.pdf',file_size:1100000,mime_type:'application/pdf',evidence_type:'bank_statement',category:'critical',sha256_hash:'b7d2e5f4a1c3b8d9e6f2a5c7d4b1e8f3a2b5c6d7e8f9a0b1c2d3e4f5a6b7',is_verified:true,description:'SBI bank statement showing unauthorized debits',tags:['financial','UPI'],custody_chain:[],created_at:'2024-06-12T10:00:00Z'},
  {id:'3',file_name:'screenshot_001.png',original_name:'screenshot_upi_001.png',file_size:340000,mime_type:'image/png',evidence_type:'screenshot',category:'primary',sha256_hash:'c9a1b3e7d2f5a8c4b6e1d3f7a2b5c8d4e6f1a3b7c2d5e8f4a1b3c6d9e2f5',is_verified:true,description:'UPI transaction screenshot',tags:['UPI','screenshot'],custody_chain:[],created_at:'2024-06-12T10:15:00Z'},
  {id:'4',file_name:'call_recording.mp3',original_name:'call_recording_1234.mp3',file_size:8700000,mime_type:'audio/mpeg',evidence_type:'audio',category:'primary',sha256_hash:'d1e4f2a8b5c7d3e6f1a4b8c2d7e3f5a9b4c6d1e7f2a5b8c3d6e9f4a7b2c5',is_verified:false,description:'Call recording - accused posing as SBI officer',tags:['audio','impersonation'],custody_chain:[],created_at:'2024-06-13T11:30:00Z'},
]

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
  const [evidence, setEvidence] = useState<Evidence[]>(MOCK_EVIDENCE)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Evidence | null>(null)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await evidenceAPI.upload('CC/2024/0847', file)
      setEvidence(prev => [data, ...prev])
      toast.success(`Evidence uploaded: ${file.name}`)
    } catch {
      toast.error('Upload failed — check API connection')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false })

  return (
    <AppShell>
      <PageHeader title="Digital Evidence Vault" subtitle="Case CC/2024/0847 — SHA-256 verified, chain of custody maintained">
        <span className="badge-blue">{evidence.length} files</span>
      </PageHeader>

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
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <div className="text-sm text-text-secondary">Uploading and generating SHA-256 hash...</div>
          </div>
        ) : (
          <>
            <Upload size={36} className="mx-auto mb-3 text-text-muted" />
            <div className="font-medium mb-1">{isDragActive ? 'Drop file here' : 'Drop evidence files here or click to upload'}</div>
            <div className="text-sm text-text-secondary">Images, PDFs, Audio, Video, Chat exports — Max 50MB</div>
            <div className="flex gap-2 justify-center mt-3">
              <span className="badge-gray">📄 PDF</span>
              <span className="badge-gray">🖼️ Image</span>
              <span className="badge-gray">🎵 Audio</span>
              <span className="badge-gray">🎬 Video</span>
              <span className="badge-gray">💬 Chat</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Evidence table */}
        <div className={`${selected ? 'col-span-3' : 'col-span-5'} card`}>
          <table className="w-full">
            <thead><tr className="tbl-head">
              <th>File</th><th>Type</th><th>Size</th><th>Category</th><th>SHA-256</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              {evidence.map(ev => (
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
              <button className="text-text-muted hover:text-text-primary" onClick={() => setSelected(null)}>✕</button>
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
    </AppShell>
  )
}
