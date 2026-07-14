'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, LegalSectionCard, Alert, Spinner } from '@/components/ui'
import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '@/lib/api'
import { AIAnalysisResult } from '@/types'
import { Send, RefreshCw, Shield, MessageSquare } from 'lucide-react'

const DEMO_FIR = `Complainant Ramesh Kumar Patel, resident of Naranpura, Ahmedabad, received a WhatsApp call from unknown number +91-7XXX-XXXXXX claiming to be a State Bank of India KYC verification officer. The caller instructed him to install AnyDesk remote access application to complete KYC update. After installation, the accused gained remote access to his phone and transferred ₹1,50,000 (One Lakh Fifty Thousand Rupees) from his SBI account ending 4782 through unauthorized UPI transactions. Complainant discovered the fraud after receiving SMS alerts for debits he did not authorize.`

interface Message { role: 'user' | 'assistant'; content: string }

export default function LegalAIPage() {
  const [firText, setFirText] = useState(DEMO_FIR)
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Namaste! I'm CrimeGPT's Legal AI. I've pre-loaded Case CC/2024/0847. Ask me anything about applicable BNS sections, BNSS procedures, BSA references, or similar landmark judgments. I can also help draft specific paragraphs for your chargesheet."
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
      // fallback handled by API interceptor
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, connection issue. Please try again.' }])
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
