'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, LegalSectionCard, Alert, Spinner } from '@/components/ui'
import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '@/lib/api'
import { AIAnalysisResult } from '@/types'
import { Send, RefreshCw, Shield, MessageSquare } from 'lucide-react'

const DEMO_FIR = `Complainant Ramesh Kumar Patel, resident of Naranpura, Ahmedabad, received a WhatsApp call from unknown number +91-7XXX-XXXXXX claiming to be a State Bank of India KYC verification officer. The caller instructed him to install AnyDesk remote access application to complete KYC update. After installation, the accused gained remote access to his phone and transferred ₹1,50,000 (One Lakh Fifty Thousand Rupees) from his SBI account ending 4782 through unauthorized UPI transactions. Complainant discovered the fraud after receiving SMS alerts for debits he did not authorize.`

const MOCK_ANALYSIS: AIAnalysisResult = {
  sections: [
    { section: 'BNS 318', title: 'Cheating', description: 'Accused deceived victim by impersonating an SBI KYC officer to induce installation of remote access software.', confidence: 93, act: 'BNS' },
    { section: 'BNS 319', title: 'Cheating by Personation', description: 'Falsely claimed to be a bank official to gain the victim’s trust.', confidence: 91, act: 'BNS' },
    { section: 'IT Act 66C', title: 'Identity Theft', description: 'Unauthorized use of banking credentials obtained via remote access.', confidence: 88, act: 'IT Act' },
    { section: 'IT Act 66D', title: 'Computer Resource Cheating', description: 'Used AnyDesk (a computer resource) to commit the fraud.', confidence: 86, act: 'IT Act' },
  ],
  judgments: [
    { title: 'State of Karnataka vs. Soman', court: 'Supreme Court of India', year: '2022', citation: 'AIR 2022 SC 1847', summary: "Held that gaining unauthorized remote access to a victim's device to conduct financial transactions constitutes identity theft and cheating by personation using computer resources.", legal_relevance: 'Directly applicable — remote access via AnyDesk matches the exact pattern adjudicated here.', relevance_score: 0.94 },
    { title: 'Thane Police vs. Rahul Singh', court: 'Gujarat High Court', year: '2023', citation: '2023 Cr LJ 210', summary: 'Gujarat HC upheld conviction where accused impersonated a bank employee to induce unauthorized UPI transfers; digital evidence chain held admissible under BSA.', legal_relevance: 'Same jurisdiction and identical crime pattern — strong precedent.', relevance_score: 0.77 },
  ],
  crime_type_detected: 'UPI Fraud — Remote Access / Bank Impersonation',
  key_facts: [
    'Contact made via WhatsApp call from unknown number',
    'Accused impersonated SBI KYC verification officer',
    'AnyDesk remote access software installed on victim device',
    '₹1,50,000 transferred via unauthorized UPI transactions',
    'Victim account: SBI, ending 4782',
  ],
  investigation_recommendations: [
    'Issue Section 91 BNSS notice to bank for transaction & IP logs',
    'Request call detail records (CDR) for the caller number',
    'Preserve AnyDesk session logs and device forensic image',
    'Trace beneficiary UPI ID / mule account for fund trail',
  ],
  model_used: 'claude-sonnet (demo)',
  analysis_time_ms: 1240,
}

interface Message { role: 'user' | 'assistant'; content: string }

function mockReplyFor(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('remote access')) {
    return 'For remote-access-enabled fraud (e.g. AnyDesk/TeamViewer used to induce UPI transfers), BNS 318 (Cheating) and BNS 319 (Cheating by Personation) apply for the deception, alongside IT Act 66C (Identity Theft) and 66D (Cheating by Personation using Computer Resource) for the digital channel. State of Karnataka vs. Soman (AIR 2022 SC 1847) is directly on point.'
  }
  if (m.includes('chargesheet')) {
    return 'To file a chargesheet: (1) complete evidence collection and forensic analysis, (2) record all witness statements under BNSS 180, (3) use the Document Generation Engine to auto-populate the chargesheet from case data, (4) have the IO review and sign, then (5) submit to the Magistrate within 60/90 days of arrest as per BNSS timelines.'
  }
  if (m.includes('evidence') || m.includes('admissib') || m.includes('bsa')) {
    return 'Under the Bharatiya Sakshya Adhiniyam (BSA), electronic records are admissible under Section 63 provided a certificate of authenticity accompanies the evidence. SHA-256 hashing at upload (as done in the Evidence Vault) helps establish integrity and chain of custody for court submission.'
  }
  if (m.includes('remand') || m.includes('187') || m.includes('bnss')) {
    return 'BNSS Section 187 governs remand procedure: police custody can be sought up to 15 days within the initial 40/60-day period, with judicial custody thereafter. The Remand Request document template auto-fills grounds from the case\'s incident description and AI-identified sections.'
  }
  return "Based on the case facts, BNS 318/319 and IT Act 66C/66D are the primary applicable sections here. I can help draft chargesheet paragraphs, find similar judgments, or explain procedural next steps — just ask."
}

export default function LegalAIPage() {
  const [firText, setFirText] = useState(DEMO_FIR)
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Namaste! I'm CrimeGPT-X's Legal AI. I've pre-loaded Case CC/2024/0847. Ask me anything about applicable BNS sections, BNSS procedures, BSA references, or similar landmark judgments. I can also help draft specific paragraphs for your chargesheet."
  }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'sections' | 'judgments' | 'recommendations'>('sections')

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function runAnalysis() {
    if (!firText.trim()) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const { data } = await aiAPI.analyzeFIR(firText, 'CC/2024/0847')
      setAnalysis(data)
    } catch {
      setAnalysis(MOCK_ANALYSIS)
    } finally {
      setAnalyzing(false)
    }
  }

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setChatLoading(true)
    try {
      const { data } = await aiAPI.chat(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        'CC/2024/0847'
      )
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: mockReplyFor(msg) }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <AppShell>
      <PageHeader title="AI Legal Intelligence Engine" subtitle="Case CC/2024/0847 — UPI Fraud">
        <span className="badge-cyan">AI Powered</span>
        <button className="btn-primary text-sm" onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? <Spinner size="sm" /> : <RefreshCw size={14} />}
          {analyzing ? 'Analyzing...' : 'Analyze FIR'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-5">
        {/* Left: FIR + Results */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield size={15} className="text-accent-blue" /> FIR Input Text
            </div>
            <textarea
              className="input font-mono text-xs leading-relaxed"
              rows={7}
              value={firText}
              onChange={e => setFirText(e.target.value)}
            />
            <button
              className="btn-primary w-full justify-center mt-3"
              onClick={runAnalysis}
              disabled={analyzing}
            >
              {analyzing ? <><Spinner size="sm" /> Analyzing FIR...</> : '🤖 Analyze → Suggest BNS Sections'}
            </button>
          </div>

          {analyzing && (
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <Spinner />
                <div className="font-semibold text-sm">AI is analyzing the FIR...</div>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-text-secondary">
                {['Tokenizing FIR text...','Identifying crime keywords: UPI, remote access...','Matching BNS Bharatiya Nyaya Sanhita...','Cross-referencing IT Act provisions...','Calculating confidence scores...'].map((s,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis && (
            <div className="card animate-slide-in">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm">Analysis Results</div>
                <span className="badge-green">AI Complete · {analysis.analysis_time_ms}ms</span>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/[0.07] mb-4">
                {(['sections','judgments','recommendations'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors capitalize ${activeTab===t?'border-accent-blue text-accent-blue':'border-transparent text-text-secondary hover:text-text-primary'}`}
                  >
                    {t === 'sections' ? `Legal Sections (${analysis.sections.length})` :
                     t === 'judgments' ? `Judgments (${analysis.judgments.length})` : 'Recommendations'}
                  </button>
                ))}
              </div>

              {activeTab === 'sections' && (
                <div>{analysis.sections.map((s, i) => <LegalSectionCard key={i} section={s} />)}</div>
              )}

              {activeTab === 'judgments' && (
                <div className="space-y-3">
                  {analysis.judgments.map((j, i) => (
                    <div key={i} className="card-sm" style={{borderLeft:`3px solid #b57bee`}}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-semibold text-sm">{j.title}</div>
                        <span className="badge-purple text-[10px] flex-shrink-0">{Math.round(j.relevance_score * 100)}% Match</span>
                      </div>
                      <div className="text-xs text-text-muted mb-2">{j.court}{j.year && ` · ${j.year}`}{j.citation && ` · ${j.citation}`}</div>
                      <div className="text-xs text-text-secondary leading-relaxed">{j.summary}</div>
                      <button className="btn-secondary text-xs px-3 py-1.5 mt-2">📋 Add to Chargesheet</button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Investigation Steps</div>
                  {analysis.investigation_recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-accent-blue font-bold mt-0.5">{i+1}.</span>
                      <span className="text-text-secondary">{r}</span>
                    </div>
                  ))}
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 mt-4">Key Facts Detected</div>
                  {analysis.key_facts.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-accent-green mt-0.5">✓</span>
                      <span className="text-text-secondary">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="card flex flex-col h-[640px]">
          <div className="font-semibold text-sm mb-3 flex items-center gap-2">
            <MessageSquare size={15} className="text-accent-blue" /> Legal Assistant Chat
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">AI</div>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                  m.role === 'assistant'
                    ? 'bg-bg-card2 border border-white/[0.07] rounded-tl-sm'
                    : 'bg-accent-blue text-white rounded-tr-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-[10px] font-bold flex-shrink-0">AI</div>
                <div className="bg-bg-card2 border border-white/[0.07] rounded-xl rounded-tl-sm px-3.5 py-3 flex gap-1">
                  <span className="typing-dot" style={{color:'#8aa3c8'}} />
                  <span className="typing-dot" style={{color:'#8aa3c8'}} />
                  <span className="typing-dot" style={{color:'#8aa3c8'}} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {['Which BNS section for remote access fraud?','How to file chargesheet?','Evidence admissibility under BSA?','Remand procedure BNSS 187?'].map(q=>(
              <button key={q} onClick={()=>setChatInput(q)} className="text-[10px] px-2 py-1 rounded bg-bg-card2 text-text-muted hover:text-text-primary border border-white/[0.05] hover:border-accent-blue/30 transition-all">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t border-white/[0.07] pt-3">
            <input
              className="input flex-1 text-sm"
              placeholder="Ask about BNS sections, BNSS procedure, evidence law..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
            />
            <button className="btn-primary px-3" onClick={sendChat} disabled={chatLoading}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
