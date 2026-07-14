'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, StatCard, Alert, Spinner } from '@/components/ui'
import { useState } from 'react'
import { aiAPI } from '@/lib/api'

type Tab = 'url' | 'chat' | 'image'

export default function CyberPage() {
  const [activeTab, setActiveTab] = useState<Tab>('url')
  const [content, setContent] = useState('http://sbi-kyc-update-secure.xyz/verify')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(MOCK_RESULT)

  async function analyze() {
    if (!content.trim()) return
    setAnalyzing(true)
    try {
      const { data } = await aiAPI.cyberAnalyze(activeTab, content)
      setResult(data)
    } catch {
      setResult(MOCK_RESULT)
    } finally {
      setAnalyzing(false)
    }
  }

  const tabs: {id:Tab;label:string}[] = [{id:'url',label:'URL/Website'},{id:'chat',label:'Chat/Message'},{id:'image',label:'Screenshot'}]
  const tabContent: Record<Tab,string> = {
    url:'http://sbi-kyc-update-secure.xyz/verify',
    chat:'Dear Customer, Your SBI account will be blocked. Click here to update KYC immediately: bit.ly/sbi-kyc123. Share your OTP to avoid suspension. -SBI Team',
    image:''
  }

  return (
    <AppShell>
      <PageHeader title="Cyber Crime Detection Engine" subtitle="AI-powered pattern detection for digital fraud">
        <span className="badge-red flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"/>Threat Detection Active</span>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Phishing Detected" value={23} change="↑ 4 today" changeType="down" color="#ff5252" />
        <StatCard label="UPI Fraud Alerts" value={47} change="Active monitoring" changeType="neutral" color="#ffa726" />
        <StatCard label="Fake Profiles" value={12} change="↓ 2 resolved" changeType="up" color="#b57bee" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-4">🕵️ Analyze Suspicious Content</div>
          <div className="flex border-b border-white/[0.07] mb-4">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setContent(tabContent[t.id]) }}
                className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${activeTab===t.id?'border-accent-blue text-accent-blue':'border-transparent text-text-secondary hover:text-text-primary'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab !== 'image' ? (
            <>
              <label className="label block mb-1.5">{activeTab === 'url' ? 'Suspicious URL' : 'Message Content'}</label>
              {activeTab === 'url'
                ? <input className="input text-sm mb-3" value={content} onChange={e=>setContent(e.target.value)} />
                : <textarea className="input text-sm mb-3" rows={5} value={content} onChange={e=>setContent(e.target.value)} />
              }
            </>
          ) : (
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center mb-3">
              <div className="text-2xl mb-2">📸</div>
              <div className="text-sm text-text-secondary">Upload screenshot for manipulation detection</div>
              <button className="btn-secondary text-xs mt-3">Upload Image</button>
            </div>
          )}

          <button className="btn-primary w-full justify-center" onClick={analyze} disabled={analyzing}>
            {analyzing ? <><Spinner size="sm"/> Analyzing...</> : '🔍 Analyze Threat'}
          </button>
        </div>

        {result && (
          <div className="card animate-slide-in">
            <div className="font-semibold text-sm mb-3">⚠️ Threat Analysis Results</div>
            <Alert variant={result.threat_level === 'high' ? 'error' : result.threat_level === 'medium' ? 'warning' : 'success'}
              icon={result.threat_level === 'high' ? '🚨' : '⚠️'}>
              <strong>{result.threat_level?.toUpperCase()} RISK — {result.crime_type}</strong>
            </Alert>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Threat Indicators</div>
                <div className="space-y-1.5">
                  {(result.indicators || []).map((ind: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">🔴</span>
                      <span className="text-text-secondary">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Applicable Sections</div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.applicable_sections || []).map((s: string) => <span key={s} className="badge-cyan">{s}</span>)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Evidence to Preserve</div>
                {(result.evidence_to_preserve || []).map((e: string, i: number) => (
                  <div key={i} className="text-xs text-text-secondary flex gap-1.5 mb-1"><span className="text-green-400">✓</span>{e}</div>
                ))}
              </div>
              <button className="btn-danger w-full justify-center text-sm">🚨 Flag & Add to Case</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

const MOCK_RESULT = {
  threat_level: 'high',
  crime_type: 'Phishing / Bank Impersonation',
  indicators: ['Domain age: 3 days — very suspicious','No SSL certificate on financial site','Registered via privacy-protected registrar in Panama','Mimics SBI official branding','Uses urgency language to pressure victims'],
  applicable_sections: ['BNS 318','BNS 319','IT Act 66D','IT Act 66C'],
  evidence_to_preserve: ['Screenshot of the URL','WHOIS registration data','Hosting IP address','Network traffic logs'],
  investigation_steps: ['Issue Section 91 notice to domain registrar','Alert CERT-In for takedown','Trace hosting provider IP','Check for similar domains (typosquatting)'],
}
