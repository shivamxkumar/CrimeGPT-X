'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, Spinner, CaseSelector, useSelectedCase, EmptyState, Button } from '@/components/ui'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { docsAPI } from '@/lib/api'
import { DOC_TYPE_LABELS, Document } from '@/types'
import { Scale, Landmark, HeartPulse, Package, UserCheck, ScanFace, FileClock, Link2, Zap, Eye, Sparkles, Download, FileDown, X, FileCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const DOC_CONFIGS = [
  { type: 'chargesheet',        icon: Scale,     color: '#3b82f6', desc: 'Auto-generated with BNS sections, accused details, evidence list' },
  { type: 'remand_request',     icon: Landmark,   color: '#f59e0b', desc: 'Court custody application with legal grounds under BNSS' },
  { type: 'medical_letter',     icon: HeartPulse, color: '#22c55e', desc: 'Accused medical examination requirements' },
  { type: 'seizure_receipt',    icon: Package,    color: '#8b5cf6', desc: 'Evidence and property seizure documentation (जब्ती पावती)' },
  { type: 'panchanama',         icon: UserCheck,  color: '#60a5fa', desc: 'Official witness documentation for arrest (पंचनामा)' },
  { type: 'face_id_form',       icon: ScanFace,     color: '#ef4444', desc: 'Witness identification parade documentation' },
  { type: 'purvani_chargesheet',icon: FileClock,  color: '#3b82f6', desc: 'Preliminary chargesheet for early court submission' },
  { type: 'court_custody',      icon: Link2,      color: '#22c55e', desc: 'Police custody vs judicial custody request letter' },
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
        <Button onClick={generateAll} disabled={!!generating || !selectedCaseId} loading={!!generating}>
          {!generating && <Zap size={14} />} Generate All (8 Docs)
        </Button>
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

      <div className={preview ? 'grid grid-cols-1 lg:grid-cols-5 gap-5' : ''}>
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className={preview ? 'lg:col-span-2 flex flex-col gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}
        >
          {DOC_CONFIGS.map(cfg => (
            <motion.div key={cfg.type} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -2 }} transition={{ duration: 0.18 }} className="card hover:border-white/[0.1] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl2 flex items-center justify-center flex-shrink-0" style={{background: cfg.color+'1a'}}>
                  <cfg.icon size={20} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="font-semibold text-sm">{DOC_TYPE_LABELS[cfg.type]}</div>
                    {statusBadge(cfg.type)}
                  </div>
                  <div className="text-xs text-text-secondary mb-3">{cfg.desc}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => docs[cfg.type] ? setPreview(docs[cfg.type]) : generateDoc(cfg.type)}
                      disabled={generating === cfg.type}
                      loading={generating === cfg.type}
                    >
                      {generating !== cfg.type && (docs[cfg.type] ? <Eye size={13} /> : <Sparkles size={13} />)}
                      {docs[cfg.type] ? 'View' : 'Generate'}
                    </Button>
                    {docs[cfg.type] && (
                      <>
                        <Button variant="secondary" size="sm" disabled={exporting === `${docs[cfg.type].id}-pdf`} onClick={() => exportDoc(docs[cfg.type], 'pdf')}>
                          {exporting === `${docs[cfg.type].id}-pdf` ? <Spinner size="sm"/> : <><Download size={13}/> PDF</>}
                        </Button>
                        <Button variant="secondary" size="sm" disabled={exporting === `${docs[cfg.type].id}-docx`} onClick={() => exportDoc(docs[cfg.type], 'docx')}>
                          {exporting === `${docs[cfg.type].id}-docx` ? <Spinner size="sm"/> : <><FileDown size={13}/> DOCX</>}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Preview pane — styled like an actual generated document page */}
        {preview && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="lg:col-span-3 card overflow-hidden flex flex-col" style={{maxHeight:'80vh'}}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-green-400" />
                <div>
                  <div className="font-semibold">{preview.title}</div>
                  <div className="text-xs text-text-secondary">Generated · Case {selectedCaseId}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => exportDoc(preview, 'pdf')} disabled={exporting === `${preview.id}-pdf`}>
                  {exporting === `${preview.id}-pdf` ? <Spinner size="sm"/> : <><Download size={13}/> PDF</>}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => exportDoc(preview, 'docx')} disabled={exporting === `${preview.id}-docx`}>
                  {exporting === `${preview.id}-docx` ? <Spinner size="sm"/> : <><FileDown size={13}/> DOCX</>}
                </Button>
                <Button variant="ghost" size="sm" aria-label="Close preview" onClick={() => setPreview(null)}><X size={14} /></Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-bg-base rounded-xl p-4 sm:p-8">
              {preview.content_html ? (
                <div className="bg-white rounded-sm shadow-2xl mx-auto max-w-[680px] p-5 sm:p-12">
                  <div
                    className="prose prose-sm max-w-none text-gray-800 prose-headings:text-gray-900"
                    dangerouslySetInnerHTML={{ __html: preview.content_html }}
                  />
                </div>
              ) : (
                <div className="text-sm text-text-secondary">This document has no content to preview.</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      </>
      )}
    </AppShell>
  )
}
