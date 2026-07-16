'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, Spinner } from '@/components/ui'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { firAPI } from '@/lib/api'
import { FileText, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ExtractedFields { fir_number?:string; date?:string; complainant_name?:string; phone?:string; address?:string; amount?:string; accused_name?:string; police_station?:string }

export default function FIRPage() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null)
  const [rawText, setRawText] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)

  const uploadAndExtract = async (file: File) => {
    setUploading(true)
    setError(null)
    setExtracted(null)
    try {
      const { data } = await firAPI.upload(file)
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

  return (
    <AppShell>
      <PageHeader title="FIR Upload & OCR Extraction" subtitle="Upload FIR — real OCR extracts fields from the document" />

      <div className="grid grid-cols-2 gap-5">
        {/* Left: Upload + Progress */}
        <div className="flex flex-col gap-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-accent-blue bg-accent-blue/5' : 'border-white/10 hover:border-accent-blue/40'
            }`}
          >
            <input {...getInputProps()} />
            <FileText size={48} className="mx-auto mb-3 text-text-muted" />
            <div className="font-medium mb-1 text-sm">Drop FIR PDF or Image Here</div>
            <div className="text-xs text-text-secondary mb-4">Supports PDF, JPG, PNG, TIFF — Max 50MB</div>
            <button className="btn-primary text-xs px-4">📁 Upload FIR</button>
          </div>

          {uploading && (
            <div className="card">
              <div className="flex items-center gap-3 mb-1">
                <Spinner />
                <div className="font-semibold text-sm">Processing with OCR engine…</div>
              </div>
              <div className="text-xs text-text-secondary">This calls the real backend OCR pipeline (EasyOCR/Tesseract) — larger files may take longer.</div>
            </div>
          )}

          {error && <Alert variant="error" icon="⚠️">{error}</Alert>}

          {extracted && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-400" />
                <div className="font-semibold text-sm">Extracted Fields</div>
                <span className="badge-green ml-auto">OCR Complete</span>
              </div>
              <Alert variant={confidence !== null && confidence < 50 ? 'warning' : 'success'}>
                {confidence !== null ? `${confidence}% field-extraction confidence.` : ''} Review and edit before saving to case.
              </Alert>
              {Object.keys(extracted).length === 0 ? (
                <div className="text-sm text-text-secondary">No fields could be automatically extracted from this document. Enter details manually below.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(extracted).map(([k, v]) => (
                    <div key={k}>
                      <label className="label block mb-1 capitalize">{k.replace('_',' ')}</label>
                      <input className="input text-xs" style={{borderColor:'rgba(0,230,118,0.3)'}} defaultValue={v} />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Link href="/cases/new" className="btn-primary text-xs">Save to New Case</Link>
                <Link href="/legal" className="btn-secondary text-xs">🤖 Analyze with AI → Legal Sections</Link>
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
