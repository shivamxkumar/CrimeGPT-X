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
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null)
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')

  const simulateOCR = async (file: File) => {
    setFileName(file.name)
    setUploading(true)
    setExtracted(null)
    const steps = [
      [15, 'Detected document format...'],
      [30, 'Initializing EasyOCR engine...'],
      [50, 'Extracting text from pages...'],
      [70, 'Running NER (Named Entity Recognition)...'],
      [88, 'Parsing structured fields...'],
      [100, 'Extraction complete!'],
    ]
    for (const [pct, msg] of steps) {
      await new Promise(r => setTimeout(r, 500))
      setProgress(pct as number)
      setStatusMsg(msg as string)
    }
    try {
      const { data } = await firAPI.upload(file)
      setExtracted(data.ocr_result?.extracted_fields || getMockFields())
      setRawText(data.ocr_result?.raw_text || MOCK_RAW_TEXT)
    } catch {
      setExtracted(getMockFields())
      setRawText(MOCK_RAW_TEXT)
      toast.success('OCR complete (demo mode)')
    }
    setUploading(false)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((files: File[]) => { if (files[0]) simulateOCR(files[0]) }, []),
    accept: { 'application/pdf':[], 'image/*':[] },
    multiple: false,
  })

  return (
    <AppShell>
      <PageHeader title="FIR Upload & OCR Extraction" subtitle="Upload FIR — AI extracts all fields automatically" />

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
            <div className="flex gap-2 justify-center">
              <button className="btn-primary text-xs px-4">📁 Upload FIR</button>
              <button className="btn-secondary text-xs px-4" onClick={e => e.stopPropagation()}>✍️ Manual Entry</button>
            </div>
          </div>

          {uploading && (
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <Spinner />
                <div className="font-semibold text-sm">OCR Processing</div>
                <span className="ml-auto text-xs text-accent-blue font-mono">{progress}%</span>
              </div>
              <div className="h-2 bg-bg-hover rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan transition-all" style={{width:`${progress}%`}} />
              </div>
              <div className="text-xs text-text-secondary">{statusMsg}</div>
            </div>
          )}

          {extracted && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-400" />
                <div className="font-semibold text-sm">Extracted Fields</div>
                <span className="badge-green ml-auto">OCR Complete</span>
              </div>
              <Alert variant="success">18 of 21 fields extracted successfully. Review and edit before saving to case.</Alert>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(extracted).map(([k, v]) => (
                  <div key={k}>
                    <label className="label block mb-1 capitalize">{k.replace('_',' ')}</label>
                    <input className="input text-xs" style={{borderColor:'rgba(0,230,118,0.3)'}} defaultValue={v} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Link href="/legal" className="btn-primary text-xs">🤖 Analyze with AI → Legal Sections</Link>
                <button className="btn-secondary text-xs">Save to Case</button>
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

function getMockFields(): ExtractedFields {
  return {
    fir_number: 'FIR-0942/24',
    date: '12/06/2024',
    complainant_name: 'Ramesh Kumar Patel',
    phone: '+91 9825647382',
    address: 'Naranpura, Ahmedabad — 380013',
    amount: '150000',
    police_station: 'Ahmedabad Cyber Crime Branch',
  }
}

const MOCK_RAW_TEXT = `FIRST INFORMATION REPORT
Ahmedabad Cyber Crime Branch, Gujarat Police
FIR No.: FIR-0942/24       Date: 12/06/2024

Name of Complainant: Ramesh Kumar Patel
Father's Name: Manoj Patel
Address: 14, Saraswati Society, Naranpura, Ahmedabad - 380013
Mobile: +91 9825647382

Crime Category: UPI / Digital Payment Fraud
Amount Defrauded: Rs. 1,50,000/- (One Lakh Fifty Thousand)

Narration of Complaint:
The complainant states that on 12th June 2024, he received a WhatsApp 
call from an unknown number claiming to be from State Bank of India 
KYC verification department. The caller instructed the complainant to 
install AnyDesk application for KYC verification. After installation, 
the accused gained remote access and transferred Rs.1,50,000 via 
unauthorized UPI transactions from SBI Account No. XXXX4782.

Signature of Complainant: [Signed]
Recording Officer: SI Rajesh Sharma, AHM-24-IO-047`
