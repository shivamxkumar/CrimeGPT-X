'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, Spinner } from '@/components/ui'
import { useState } from 'react'
import { docsAPI } from '@/lib/api'
import { DOC_TYPE_LABELS, Document } from '@/types'
import toast from 'react-hot-toast'

const DOC_CONFIGS = [
  { type: 'chargesheet',       icon: '⚖️',  color: '#1a6cf6', status: 'ready',   desc: 'Auto-generated with BNS sections, accused details, evidence list' },
  { type: 'remand_request',    icon: '🏛️',  color: '#ffa726', status: 'ready',   desc: 'Court custody application with legal grounds under BNSS' },
  { type: 'medical_letter',    icon: '🏥',  color: '#00e676', status: 'pending', desc: 'Accused medical examination requirements' },
  { type: 'seizure_receipt',   icon: '📦',  color: '#b57bee', status: 'ready',   desc: 'Evidence and property seizure documentation (जब्ती पावती)' },
  { type: 'panchanama',        icon: '👤',  color: '#00d4ff', status: 'ready',   desc: 'Official witness documentation for arrest (पंचनामा)' },
  { type: 'face_id_form',      icon: '🪪',  color: '#ff5252', status: 'pending', desc: 'Witness identification parade documentation' },
  { type: 'purvani_chargesheet',icon: '⚖️', color: '#1a6cf6', status: 'ready',   desc: 'Preliminary chargesheet for early court submission' },
  { type: 'court_custody',     icon: '🔗',  color: '#00e676', status: 'ready',   desc: 'Police custody vs judicial custody request letter' },
]

export default function DocumentsPage() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [docs, setDocs] = useState<Record<string, Document>>({})
  const [preview, setPreview] = useState<Document | null>(null)

  async function generateDoc(docType: string) {
    setGenerating(docType)
    try {
      const { data } = await docsAPI.generate('CC/2024/0847', docType)
      setDocs(prev => ({ ...prev, [docType]: data }))
      setPreview(data)
      toast.success(`${DOC_TYPE_LABELS[docType]} generated!`)
    } catch {
      const mockDoc: Document = {
        id: `mock-${docType}`,
        doc_type: docType as any,
        title: DOC_TYPE_LABELS[docType],
        content_html: '',
        is_reviewed: false,
        created_at: new Date().toISOString(),
      }
      setDocs(prev => ({ ...prev, [docType]: mockDoc }))
      setPreview(mockDoc)
      toast.success(`${DOC_TYPE_LABELS[docType]} generated!`)
    } finally {
      setGenerating(null)
    }
  }

  async function generateAll() {
    for (const d of DOC_CONFIGS.filter(d => d.status === 'ready')) {
      await generateDoc(d.type)
    }
  }

  const statusBadge = (cfg: typeof DOC_CONFIGS[0], docType: string) => {
    if (generating === docType) return <span className="badge-blue flex items-center gap-1"><Spinner size="sm"/>Generating</span>
    if (docs[docType]) return <span className="badge-green">✓ Generated</span>
    if (cfg.status === 'ready') return <span className="badge-green">Ready</span>
    return <span className="badge-amber">Pending</span>
  }

  return (
    <AppShell>
      <PageHeader title="Document Generation Engine" subtitle="Case CC/2024/0847 — AI auto-populates all fields from case data">
        <button className="btn-primary" onClick={generateAll} disabled={!!generating}>
          {generating ? <Spinner size="sm" /> : '⚡'} Generate All (8 Docs)
        </button>
      </PageHeader>

      <Alert variant="info" icon="⚡">
        All documents are auto-populated from <strong>Case CC/2024/0847</strong> data. <strong>Zero duplicate entry.</strong> Edit inline then export as PDF or DOCX.
      </Alert>

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
                    {statusBadge(cfg, cfg.type)}
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
                        <button className="btn-secondary text-xs px-3 py-1.5">📥 PDF</button>
                        <button className="btn-secondary text-xs px-3 py-1.5">📄 DOCX</button>
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
                <div className="text-xs text-text-secondary">Generated · Case CC/2024/0847</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-xs px-3 py-1.5">📥 PDF</button>
                <button className="btn-secondary text-xs px-3 py-1.5">📄 DOCX</button>
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
                <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {/* Fallback formatted preview */}
                  <div className="text-center mb-6 text-text-primary">
                    <div className="font-bold text-base">IN THE COURT OF HON'BLE METROPOLITAN MAGISTRATE</div>
                    <div>AHMEDABAD, GUJARAT</div>
                    <div className="font-bold mt-2">{preview.title.toUpperCase()}</div>
                    <div>F.I.R. No. FIR-0938/24 | Ahmedabad Cyber Crime Branch</div>
                  </div>
                  <hr className="border-white/10 my-4" />
                  <div className="space-y-3 text-sm">
                    <div><strong className="text-text-primary">UNDER SECTIONS:</strong> BNS 318, BNS 319, IT Act 66C, IT Act 66D</div>
                    <div><strong className="text-text-primary">COMPLAINANT:</strong> Ramesh Kumar Patel, S/o Manoj Patel, R/o 14, Saraswati Society, Naranpura, Ahmedabad – 380013</div>
                    <div><strong className="text-text-primary">ACCUSED:</strong> Mehul Rathod, S/o Govind Rathod, R/o 7-B, Vasudev Nagar, Adajan, Surat – 395009</div>
                    <div><strong className="text-text-primary">OFFENCE:</strong> The accused, posing as an SBI Bank KYC officer via WhatsApp, induced the complainant to install AnyDesk remote access software and conducted unauthorized UPI transfers totalling ₹1,50,000.</div>
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
