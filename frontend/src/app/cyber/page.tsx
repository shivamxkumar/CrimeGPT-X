'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, EmptyState, Button, Tabs, TabsList, TabsTrigger, AIThinking } from '@/components/ui'
import { useState } from 'react'
import { aiAPI } from '@/lib/api'
import { ScanSearch } from 'lucide-react'

type Tab = 'url' | 'chat' | 'email' | 'phone'

export default function CyberPage() {
  const [activeTab, setActiveTab] = useState<Tab>('url')
  const [content, setContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!content.trim()) return
    setAnalyzing(true)
    setError(null)
    try {
      const { data } = await aiAPI.cyberAnalyze(activeTab, content)
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Cyber threat analysis failed — check the backend/Gemini API connection.')
      setResult(null)
    } finally {
      setAnalyzing(false)
    }
  }

  const tabs: {id:Tab;label:string}[] = [{id:'url',label:'URL/Website'},{id:'chat',label:'Chat/Message'},{id:'email',label:'Email'},{id:'phone',label:'Phone Number'}]

  return (
    <AppShell>
      <PageHeader title="Cyber Crime Detection Engine" subtitle="AI-powered pattern detection for digital fraud" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-4">🕵️ Analyze Suspicious Content</div>
          <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as Tab); setContent('') }}>
            <TabsList className="mb-4 flex-wrap">
              {tabs.map(t => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>

          <label className="label block mb-1.5">{activeTab === 'url' ? 'Suspicious URL' : activeTab === 'phone' ? 'Phone Number' : activeTab === 'email' ? 'Email Content' : 'Message Content'}</label>
          {activeTab === 'url' || activeTab === 'phone'
            ? <input className="input text-sm mb-3" value={content} onChange={e=>setContent(e.target.value)} placeholder={activeTab === 'url' ? 'https://...' : '+91...'} />
            : <textarea className="input text-sm mb-3" rows={5} value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste the suspicious message content here" />
          }

          <Button className="w-full justify-center" onClick={analyze} disabled={analyzing || !content.trim()} loading={analyzing}>
            {!analyzing && <ScanSearch size={15} />} {analyzing ? 'Analyzing...' : 'Analyze Threat'}
          </Button>
        </div>

        {error && <Alert variant="error" icon="⚠️">{error}</Alert>}

        {analyzing && <AIThinking steps={['Scanning for known threat patterns...', 'Cross-checking phishing indicators...', 'Mapping applicable IT Act / BNS sections...']} label="Analyzing content" />}

        {!analyzing && !error && !result && (
          <div className="card">
            <EmptyState icon="🕵️" title="No analysis yet" description="Enter a URL, message, email, or phone number and run analysis to see real AI-generated threat indicators." />
          </div>
        )}

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
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Investigation Steps</div>
                {(result.investigation_steps || []).map((s: string, i: number) => (
                  <div key={i} className="text-xs text-text-secondary flex gap-1.5 mb-1"><span className="text-accent-blue">{i+1}.</span>{s}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
