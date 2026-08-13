'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, Button, ConfidenceBar, AIThinking } from '@/components/ui'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { firAPI } from '@/lib/api'
import {
  FileText, CheckCircle, Upload, Sparkles, Hash, CalendarDays, User,
  Phone, MapPin, IndianRupee, UserX, Building2, Tag, FileX2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import DemoDisabledNotice from '@/components/layout/DemoDisabledNotice'
import { useT } from '@/lib/i18n'

interface ExtractedFields { fir_number?:string; date?:string; complainant_name?:string; phone?:string; address?:string; amount?:string; accused_name?:string; police_station?:string }

const FIELD_META: Record<string, { icon: LucideIcon; color: string }> = {
  fir_number:       { icon: Hash,         color: '#3b82f6' },
  date:             { icon: CalendarDays, color: '#8b5cf6' },
  complainant_name: { icon: User,         color: '#22c55e' },
  phone:            { icon: Phone,        color: '#f59e0b' },
  address:          { icon: MapPin,       color: '#60a5fa' },
  amount:           { icon: IndianRupee,  color: '#ef4444' },
  accused_name:     { icon: UserX,        color: '#ef4444' },
  police_station:   { icon: Building2,    color: '#3b82f6' },
}
const OCR_STEPS = ['Scanning document layout...', 'Running text recognition...', 'Extracting structured fields...', 'Scoring extraction confidence...']

export default function FIRPage() {
  const t = useT()
  const isDemoMode = useAuthStore(s => s.isDemoMode)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null)
  const [rawText, setRawText] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const uploadAndExtract = async (f: File) => {
    setFile(f)
    setUploading(true)
    setError(null)
    setExtracted(null)
    try {
      const { data } = await firAPI.upload(f)
      const fields = data.ocr_result?.extracted_fields || {}
      setExtracted(fields)
      setRawText(data.ocr_result?.raw_text || '')
      setConfidence(data.ocr_result?.confidence ?? null)
      if (Object.keys(fields).length === 0) {
        toast('OCR completed but no structured fields could be extracted — review the raw text and enter fields manually.', { icon: '⚠️' })
      } else {
        toast.success('OCR extraction complete')
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'OCR processing failed — check the backend connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((files: File[]) => { if (files[0]) uploadAndExtract(files[0]) }, []),
    accept: { 'application/pdf':[], 'image/*':[] },
    multiple: false,
  })

  const isImage = file?.type.startsWith('image/')
  const isPdf = file?.type === 'application/pdf'

  if (isDemoMode) {
    return (
      <AppShell>
        <PageHeader title={t('fir.title')} subtitle={t('fir.subtitle')} />
        <DemoDisabledNotice feature="FIR upload" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title={t('fir.title')} subtitle={t('fir.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Original document preview / dropzone */}
        <div className="flex flex-col gap-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl2 p-10 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-accent-blue bg-accent-blue/5' : 'border-white/10 hover:border-accent-blue/40'
              }`}
            >
              <input {...getInputProps()} />
              <FileText size={48} className="mx-auto mb-3 text-text-muted" />
              <div className="font-medium mb-1 text-sm">Drop FIR PDF or Image Here</div>
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {['PDF', 'JPG', 'PNG', 'TIFF'].map(ext => <span key={ext} className="badge-gray text-[10px]">{ext}</span>)}
              </div>
              <Button size="sm" className="mx-auto"><Upload size={13} /> Upload FIR</Button>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm truncate flex items-center gap-2"><FileText size={14} className="text-accent-blue flex-shrink-0" /> {file.name}</div>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setExtracted(null); setRawText(''); setError(null) }}>Replace</Button>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-bg-base">
                {isImage && previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={file.name} className="w-full max-h-[420px] object-contain" />
                ) : isPdf && previewUrl ? (
                  <embed src={previewUrl} type="application/pdf" className="w-full h-[420px]" />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center gap-2 text-text-muted">
                    <FileX2 size={28} /><span className="text-xs">No inline preview for this file type</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {uploading && <AIThinking steps={OCR_STEPS} label="Processing with OCR engine" />}

          {error && <Alert variant="error" icon="⚠️">{error}</Alert>}

          {extracted && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-400" />
                <div className="font-semibold text-sm">Extracted Fields</div>
                <span className="badge-green ml-auto">OCR Complete</span>
              </div>
              <Alert variant={confidence !== null && confidence < 50 ? 'warning' : 'success'}>
                <div>{confidence !== null ? `${confidence}% field-extraction confidence.` : ''} Review and edit before saving to case.</div>
                {confidence !== null && <ConfidenceBar value={confidence} />}
              </Alert>
              {Object.keys(extracted).length === 0 ? (
                <div className="text-sm text-text-secondary">No fields could be automatically extracted from this document. Enter details manually below.</div>
              ) : (
                <motion.div
                  initial="hidden" animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {Object.entries(extracted).map(([k, v]) => {
                    const meta = FIELD_META[k] || { icon: Tag, color: '#9ca3af' }
                    const Icon = meta.icon
                    return (
                      <motion.div key={k} variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                        <label className="label flex items-center gap-1.5 mb-1 capitalize">
                          <Icon size={11} style={{ color: meta.color }} /> {k.replace(/_/g,' ')}
                        </label>
                        <input className="input text-xs" style={{ borderColor: meta.color + '40' }} defaultValue={v} />
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
              <div className="flex gap-2 mt-4">
                <Link href="/cases/new"><Button size="sm">Save to New Case</Button></Link>
                <Link href="/legal"><Button variant="secondary" size="sm"><Sparkles size={13} /> Analyze with AI → Legal Sections</Button></Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Raw OCR text */}
        <div className="card flex flex-col">
          <div className="font-semibold text-sm mb-3">Raw OCR Output</div>
          {rawText ? (
            <textarea className="input flex-1 font-mono text-xs leading-relaxed" readOnly value={rawText} rows={20} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-text-muted">
              <div>
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">Upload a FIR to see OCR output</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
