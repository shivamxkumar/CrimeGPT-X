'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert } from '@/components/ui'
import { useState } from 'react'
import { casesAPI } from '@/lib/api'
import { CRIME_CATEGORY_LABELS } from '@/types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChevronRight, User, AlertTriangle, FileText, Users } from 'lucide-react'

const STEP_LABELS = ['Case Info', 'Victim', 'Accused', 'Incident', 'Review']

export default function NewCasePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fir_number: '',
    fir_date: new Date().toISOString().slice(0, 10),
    police_station: 'Ahmedabad Cyber Crime Branch',
    crime_category: 'upi_fraud',
    priority: 'medium',
    victim_name: '',
    victim_phone: '',
    victim_email: '',
    victim_address: '',
    victim_age: '',
    amount_defrauded: '',
    accused_name: 'Unknown',
    accused_phone: '',
    accused_address: '',
    accused_mode: '',
    incident_description: '',
    incident_location: '',
    incident_date: new Date().toISOString().slice(0, 10),
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        amount_defrauded: parseFloat(form.amount_defrauded) || 0,
        victim_age: form.victim_age ? parseInt(form.victim_age) : undefined,
      }
      const { data } = await casesAPI.create(payload)
      toast.success(`Case ${data.case_id} registered!`)
      router.push(`/legal?case=${data.case_id}`)
    } catch {
      toast.error('Case creation failed — check API')
      // Demo: navigate anyway
      toast('Demo mode — navigating to AI analysis', { icon: '🤖' })
      router.push('/legal')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'input w-full'

  return (
    <AppShell>
      <PageHeader title="Register New Case" subtitle="Single entry — all documents auto-populate from this data">
        <span className="font-mono text-sm text-accent-cyan bg-bg-card2 px-3 py-1 rounded-lg border border-white/[0.07]">
          Auto ID: CC/2024/0849
        </span>
      </PageHeader>

      <Alert variant="info" icon="ℹ️">
        Every field entered here will be automatically used in the chargesheet, remand letter, panchanama, and all other documents.{' '}
        <strong>Zero duplicate entry.</strong>
      </Alert>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-6 mt-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                i === step
                  ? 'bg-accent-blue text-white'
                  : i < step
                  ? 'text-accent-blue cursor-pointer hover:bg-accent-blue/10'
                  : 'text-text-muted cursor-default'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? 'bg-white/20' : i < step ? 'bg-accent-blue text-white' : 'bg-bg-card2'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </button>
            {i < STEP_LABELS.length - 1 && <ChevronRight size={14} className="text-text-muted mx-1 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 0: Case Info */}
      {step === 0 && (
        <div className="card animate-slide-in">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <FileText size={16} className="text-accent-blue" /> Case Information
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label block mb-1">Case ID (Auto-Generated)</label>
              <input className={inputCls} value="CC/2024/0849" readOnly style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <label className="label block mb-1">FIR Number</label>
              <input className={inputCls} placeholder="FIR-0942/24" value={form.fir_number} onChange={set('fir_number')} />
            </div>
            <div>
              <label className="label block mb-1">Date of Complaint</label>
              <input type="date" className={inputCls} value={form.fir_date} onChange={set('fir_date')} />
            </div>
            <div>
              <label className="label block mb-1">Police Station</label>
              <input className={inputCls} value={form.police_station} onChange={set('police_station')} />
            </div>
            <div>
              <label className="label block mb-1">Crime Category</label>
              <select className={inputCls} value={form.crime_category} onChange={set('crime_category')}>
                {Object.entries(CRIME_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1">Priority</label>
              <select className={inputCls} value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Victim */}
      {step === 1 && (
        <div className="card animate-slide-in">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <User size={16} className="text-accent-green" /> Victim Information
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">Full Name *</label>
              <input className={inputCls} placeholder="Victim's full name" value={form.victim_name} onChange={set('victim_name')} required />
            </div>
            <div>
              <label className="label block mb-1">Mobile Number</label>
              <input className={inputCls} placeholder="+91 9XXXXXXXXX" value={form.victim_phone} onChange={set('victim_phone')} />
            </div>
            <div>
              <label className="label block mb-1">Email Address</label>
              <input type="email" className={inputCls} placeholder="victim@email.com" value={form.victim_email} onChange={set('victim_email')} />
            </div>
            <div>
              <label className="label block mb-1">Age</label>
              <input type="number" className={inputCls} placeholder="Age" value={form.victim_age} onChange={set('victim_age')} min="1" max="120" />
            </div>
            <div className="col-span-2">
              <label className="label block mb-1">Address</label>
              <textarea className={inputCls} rows={2} placeholder="Complete address with PIN code" value={form.victim_address} onChange={set('victim_address')} />
            </div>
            <div>
              <label className="label block mb-1">Amount Defrauded (₹)</label>
              <input type="number" className={inputCls} placeholder="0" value={form.amount_defrauded} onChange={set('amount_defrauded')} min="0" />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Accused */}
      {step === 2 && (
        <div className="card animate-slide-in">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <AlertTriangle size={16} className="text-accent-red" /> Accused Information
          </div>
          <Alert variant="warning" icon="⚠️">
            If accused identity is not yet known, keep default "Unknown". This can be updated as investigation progresses.
          </Alert>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="label block mb-1">Name (if known)</label>
              <input className={inputCls} placeholder="Accused name or 'Unknown'" value={form.accused_name} onChange={set('accused_name')} />
            </div>
            <div>
              <label className="label block mb-1">Mobile / UPI / Account No.</label>
              <input className={inputCls} placeholder="+91 XXXXXXXXXX / UPI ID / Bank Account" value={form.accused_phone} onChange={set('accused_phone')} />
            </div>
            <div>
              <label className="label block mb-1">Mode of Fraud</label>
              <select className={inputCls} value={form.accused_mode} onChange={set('accused_mode')}>
                <option value="">Select mode</option>
                <option>WhatsApp / Phone Call</option>
                <option>Fake Website</option>
                <option>Email Phishing</option>
                <option>UPI QR Code</option>
                <option>Fake Investment App</option>
                <option>Social Media</option>
                <option>Remote Access Tool</option>
                <option>OTP Sharing</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1">Address (if known)</label>
              <input className={inputCls} placeholder="Address or 'Under Investigation'" value={form.accused_address} onChange={set('accused_address')} />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Incident */}
      {step === 3 && (
        <div className="card animate-slide-in">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <FileText size={16} className="text-accent-amber" /> Incident Details
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">Date of Incident</label>
              <input type="date" className={inputCls} value={form.incident_date} onChange={set('incident_date')} />
            </div>
            <div>
              <label className="label block mb-1">Location of Incident</label>
              <input className={inputCls} placeholder="Where victim was located during fraud" value={form.incident_location} onChange={set('incident_location')} />
            </div>
            <div className="col-span-2">
              <label className="label block mb-1">Full Incident Narration *</label>
              <textarea
                className={inputCls}
                rows={7}
                placeholder="Describe the complete incident in detail — who contacted the victim, what was said, how money was transferred, timeline of events, digital channels used..."
                value={form.incident_description}
                onChange={set('incident_description')}
                required
              />
              <div className="text-xs text-text-muted mt-1">
                Tip: Include timeline, communication channels, device used, app names. This text will be analyzed by AI for legal section recommendations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="animate-slide-in space-y-4">
          <div className="card">
            <div className="font-semibold mb-3 text-sm">📋 Case Summary — Review Before Submitting</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['FIR Number', form.fir_number || 'Pending'],
                ['Crime Category', CRIME_CATEGORY_LABELS[form.crime_category as keyof typeof CRIME_CATEGORY_LABELS]],
                ['Priority', form.priority.toUpperCase()],
                ['Police Station', form.police_station],
                ['Victim Name', form.victim_name || '—'],
                ['Victim Phone', form.victim_phone || '—'],
                ['Amount Defrauded', form.amount_defrauded ? `₹${Number(form.amount_defrauded).toLocaleString('en-IN')}` : '₹0'],
                ['Accused Name', form.accused_name],
                ['Mode of Fraud', form.accused_mode || '—'],
                ['Incident Location', form.incident_location || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-text-muted">{k}</span>
                  <span className="font-medium text-text-primary text-right max-w-[60%] truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="font-semibold mb-2 text-sm">📝 Incident Description</div>
            <div className="text-sm text-text-secondary leading-relaxed bg-bg-base rounded-lg p-3">
              {form.incident_description || <span className="text-text-muted italic">No description provided</span>}
            </div>
          </div>
          <Alert variant="success" icon="✅">
            After submission, AI will automatically analyze the incident for BNS / IT Act sections. You will be redirected to the Legal AI Engine.
          </Alert>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          className="btn-secondary"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button className="btn-secondary text-sm" onClick={() => toast('Draft saved!')}>
            Save Draft
          </button>
          {step < STEP_LABELS.length - 1 ? (
            <button
              className="btn-primary"
              onClick={() => setStep(s => Math.min(STEP_LABELS.length - 1, s + 1))}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn-success"
              onClick={submit}
              disabled={submitting}
            >
              {submitting
                ? '⏳ Registering...'
                : '✅ Register Case & Analyze with AI →'}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
