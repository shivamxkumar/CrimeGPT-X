'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, Spinner, CaseSelector, useSelectedCase, EmptyState } from '@/components/ui'
import { useState } from 'react'
import { docsAPI } from '@/lib/api'
import { DOC_TYPE_LABELS, Document } from '@/types'
import toast from 'react-hot-toast'

const DOC_CONFIGS = [
  { type: 'chargesheet',       icon: '⚖️',  color: '#1a6cf6', desc: 'Auto-generated with BNS sections, accused details, evidence list' },
  { type: 'remand_request',    icon: '🏛️',  color: '#ffa726', desc: 'Court custody application with legal grounds under BNSS' },
  { type: 'medical_letter',    icon: '🏥',  color: '#00e676', desc: 'Accused medical examination requirements' },
  { type: 'seizure_receipt',   icon: '📦',  color: '#b57bee', desc: 'Evidence and property seizure documentation (जब्ती पावती)' },
  { type: 'panchanama',        icon: '👤',  color: '#00d4ff', desc: 'Official witness documentation for arrest (पंचनामा)' },
  { type: 'face_id_form',      icon: '🪪',  color: '#ff5252', desc: 'Witness identification parade documentation' },
  { type: 'purvani_chargesheet',icon: '⚖️', color: '#1a6cf6', desc: 'Preliminary chargesheet for early court submission' },
  { type: 'court_custody',     icon: '🔗',  color: '#00e676', desc: 'Police custody vs judicial custody request letter' },
]

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function DocumentsPage() {
  const { selectedCaseId, cases, isLoading: casesLoading } = useSelectedCase()
  const [generating, setGenerating] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const [docs, setDocs] = useState<Record<string, Document>>({})
  const [preview, setPreview] = useState<Document | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generateDoc(docType: string) {
    if (!selectedCaseId) return
    setGenerating(docType)
    setError(null)
    try {
      const { data } = await docsAPI.generate(selectedCaseId, docType)
      setDocs(prev => ({ ...prev, [docType]: data }))
      setPreview(data)
      toast.success(`${DOC_TYPE_LABELS[docType]} generated!`)
    } catch (e: any) {
      setError(e?.response?.data?.detail || `Failed to generate ${DOC_TYPE_LABELS[docType]} — check the backend connection.`)
    } finally {
      setGenerating(null)
    }
  }

  async function generateAll() {
    for (const d of DOC_CONFIGS) {
      await generateDoc(d.type)
    }
  }

  async function exportDoc(doc: Document, format: 'pdf' | 'docx') {
    setExporting(`${doc.id}-${format}`)
    try {
      const { data } = format === 'pdf' ? await docsAPI.exportPdf(doc.id) : await docsAPI.exportDocx(doc.id)
      downloadBlob(data, `${doc.title.replace(/\s+/g, '_')}.${format}`)
    } catch {
      toast.error(`${format.toUpperCase()} export failed`)
    } finally {
      setExporting(null)
    }
  }

  const statusBadge = (docType: string) => {
    if (generating === docType) return <span className="badge-blue flex items-center gap-1"><Spinner size="sm"/>Generating</span>
    if (docs[docType]) return <span className="badge-green">✓ Generated</span>
    return <span className="badge-gray">Not generated</span>
  }

  return (
    <AppShell>
      <PageHeader title="Document Generation Engine" subtitle={selectedCaseId ? `Case ${selectedCaseId} — AI auto-populates all fields from case data` : 'Select a case to generate documents'}>
        <CaseSelector />
        <button className="btn-primary" onClick={generateAll} disabled={!!generating || !selectedCaseId}>
          {generating ? <Spinner size="sm" /> : '⚡'} Generate All (8 Docs)
        </button>
      </PageHeader>

      {casesLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg"/></div>
      ) : cases.length === 0 ? (
        <EmptyState icon="📂" title="No cases yet" description="Register a case first, then generate its legal documents here." />
      ) : (
      <>
      <Alert variant="info" icon="⚡">
        All documents are auto-populated from real case data. <strong>Zero duplicate entry.</strong> Generate, preview, then export as PDF or DOCX.
      </Alert>

      {error && <Alert variant="error" icon="⚠️">{error}</Alert>}

      <div className={`${preview ? 'grid grid-cols-5 gap-5' : ''}`}>
        <div className={preview ? 'col-span-2' : 'grid grid-cols-2 gap-4'}>
          {DOC_CONFIGS.map(cfg => (
            <div key={cfg.type} className="card hover:border-white/15 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background: cfg.color+'20'}}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="font-semibold text-sm">{DOC_TYPE_LABELS[cfg.type]}</div>
                    {statusBadge(cfg.type)}
                  </div>
                  <div className="text-xs text-text-secondary mb-3">{cfg.desc}</div>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary text-xs px-3 py-1.5"
                      onClick={() => docs[cfg.type] ? setPreview(docs[cfg.type]) : generateDoc(cfg.type)}
                      disabled={generating === cfg.type}
                    >
                      {generating === cfg.type ? <Spinner size="sm" /> : docs[cfg.type] ? '👁 View' : '🤖 Generate'}
                    </button>
                    {docs[cfg.type] && (
                      <>
                        <button className="btn-secondary text-xs px-3 py-1.5" disabled={exporting === `${docs[cfg.type].id}-pdf`} onClick={() => exportDoc(docs[cfg.type], 'pdf')}>
                          {exporting === `${docs[cfg.type].id}-pdf` ? <Spinner size="sm"/> : '📥 PDF'}
                        </button>
                        <button className="btn-secondary text-xs px-3 py-1.5" disabled={exporting === `${docs[cfg.type].id}-docx`} onClick={() => exportDoc(docs[cfg.type], 'docx')}>
                          {exporting === `${docs[cfg.type].id}-docx` ? <Spinner size="sm"/> : '📄 DOCX'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview pane */}
        {preview && (
          <div className="col-span-3 card animate-slide-in overflow-hidden flex flex-col" style={{maxHeight:'80vh'}}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <div className="font-semibold">{preview.title}</div>
                <div className="text-xs text-text-secondary">Generated · Case {selectedCaseId}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-xs px-3 py-1.5" onClick={() => exportDoc(preview, 'pdf')} disabled={exporting === `${preview.id}-pdf`}>
                  {exporting === `${preview.id}-pdf` ? <Spinner size="sm"/> : '📥 PDF'}
                </button>
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => exportDoc(preview, 'docx')} disabled={exporting === `${preview.id}-docx`}>
                  {exporting === `${preview.id}-docx` ? <Spinner size="sm"/> : '📄 DOCX'}
                </button>
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setPreview(null)}>✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-bg-base rounded-xl p-5">
              {preview.content_html ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-text-secondary"
                  dangerouslySetInnerHTML={{ __html: preview.content_html }}
                />
              ) : (
                <div className="text-sm text-text-secondary">This document has no content to preview.</div>
              )}
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </AppShell>
  )
}
