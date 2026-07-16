'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, LegalSectionCard, Alert, Spinner, CaseSelector, useSelectedCase, EmptyState } from '@/components/ui'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { aiAPI, casesAPI } from '@/lib/api'
import { AIAnalysisResult } from '@/types'
import { Send, Shield, MessageSquare } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const riskColors: Record<string, string> = { low: '#00e676', medium: '#ffa726', high: '#ff5252', critical: '#ff1744' }

export default function LegalAIPage() {
  const { selectedCaseId, cases, isLoading: casesLoading } = useSelectedCase()
  const { data: selectedCase } = useQuery({
    queryKey: ['case', selectedCaseId],
    queryFn: () => casesAPI.get(selectedCaseId!).then(r => r.data),
    enabled: !!selectedCaseId,
  })
  const [firText, setFirText] = useState('')
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'sections' | 'judgments' | 'entities' | 'timeline' | 'recommendations'>('sections')

  useEffect(() => {
    if (selectedCase) {
      setFirText(selectedCase.incident_description || '')
      setMessages([{
        role: 'assistant',
        content: `Namaste! I'm CrimeGPT-X's Legal AI. I've loaded Case ${selectedCase.case_id}. Ask me anything about applicable BNS sections, BNSS procedures, BSA references, or similar landmark judgments.`,
      }])
      setAnalysis(null)
    }
  }, [selectedCase?.case_id])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function runAnalysis() {
    if (!firText.trim() || firText.trim().length < 50) {
      setAnalysisError('FIR text must be at least 50 characters for a meaningful AI analysis.')
      return
    }
    setAnalyzing(true)
    setAnalysis(null)
    setAnalysisError(null)
    try {
      const { data } = await aiAPI.analyzeFIR(firText, selectedCaseId || undefined)
      setAnalysis(data)
    } catch (e: any) {
      setAnalysisError(e?.response?.data?.detail || 'AI analysis failed — check the backend/Gemini API connection.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatError(null)
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setChatLoading(true)
    try {
      const { data } = await aiAPI.chat(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        selectedCaseId || undefined
      )
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e: any) {
      setChatError(e?.response?.data?.detail || 'AI chat failed — check the backend/Gemini API connection.')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <AppShell>
      <PageHeader title="AI Legal Intelligence Engine" subtitle={selectedCase ? `Case ${selectedCase.case_id} — ${selectedCase.victim_name}` : 'Select a case, or analyze free-form FIR text'}>
        <CaseSelector />
        <span className="badge-cyan">Gemini Powered</span>
      </PageHeader>

      {casesLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg"/></div>
      ) : (
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
              placeholder="Paste or edit the FIR narrative text to analyze (min. 50 characters)..."
              value={firText}
              onChange={e => setFirText(e.target.value)}
            />
            <button
              className="btn-primary w-full justify-center mt-3"
              onClick={runAnalysis}
              disabled={analyzing || !firText.trim()}
            >
              {analyzing ? <><Spinner size="sm" /> Analyzing FIR...</> : '🤖 Analyze → Suggest BNS Sections'}
            </button>
          </div>

          {analysisError && <Alert variant="error" icon="⚠️">{analysisError}</Alert>}

          {analyzing && (
            <div className="card">
              <div className="flex items-center gap-3">
                <Spinner />
                <div className="font-semibold text-sm">Gemini is analyzing the FIR — sections, entities, timeline, risk...</div>
              </div>
            </div>
          )}

          {analysis && (
            <div className="card animate-slide-in">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm">Analysis Results</div>
                <span className="badge-green">AI Complete · {analysis.analysis_time_ms}ms</span>
              </div>

              {/* Risk assessment banner */}
              <Alert variant={analysis.risk_assessment.level === 'low' ? 'success' : analysis.risk_assessment.level === 'medium' ? 'warning' : 'error'}>
                <strong style={{color: riskColors[analysis.risk_assessment.level]}}>{analysis.risk_assessment.level.toUpperCase()} RISK</strong> ({analysis.risk_assessment.score}/100) — {analysis.crime_type_detected}
              </Alert>

              {/* Tabs */}
              <div className="flex border-b border-white/[0.07] mb-4 flex-wrap">
                {(['sections','judgments','entities','timeline','recommendations'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors capitalize ${activeTab===t?'border-accent-blue text-accent-blue':'border-transparent text-text-secondary hover:text-text-primary'}`}
                  >
                    {t === 'sections' ? `Legal Sections (${analysis.sections.length})` :
                     t === 'judgments' ? `Judgments (${analysis.judgments.length})` :
                     t === 'entities' ? 'Entities' :
                     t === 'timeline' ? 'Timeline' : 'Recommendations'}
                  </button>
                ))}
              </div>

              {activeTab === 'sections' && (
                analysis.sections.length === 0
                  ? <div className="text-sm text-text-secondary">No applicable sections identified from this text.</div>
                  : <div>{analysis.sections.map((s, i) => <LegalSectionCard key={i} section={s} />)}</div>
              )}

              {activeTab === 'judgments' && (
                analysis.judgments.length === 0 ? (
                  <EmptyState icon="📭" title="No indexed judgments available" description={analysis.judgments_message || 'Please ingest a real legal corpus.'} />
                ) : (
                <div className="space-y-3">
                  {analysis.judgments.map((j, i) => (
                    <div key={i} className="card-sm" style={{borderLeft:`3px solid #b57bee`}}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-semibold text-sm">{j.title}</div>
                        <span className="badge-purple text-[10px] flex-shrink-0">{Math.round(j.relevance_score * 100)}% Match</span>
                      </div>
                      <div className="text-xs text-text-muted mb-2">{j.court}{j.year && ` · ${j.year}`}{j.citation && ` · ${j.citation}`}</div>
                      <div className="text-xs text-text-secondary leading-relaxed">{j.summary}</div>
                    </div>
                  ))}
                </div>
                )
              )}

              {activeTab === 'entities' && (
                <div className="space-y-4">
                  {(['victims','suspects','witnesses'] as const).map(kind => (
                    <div key={kind}>
                      <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 capitalize">{kind}</div>
                      {analysis.entities[kind].length === 0 ? (
                        <div className="text-xs text-text-muted">None identified in the text.</div>
                      ) : analysis.entities[kind].map((e, i) => (
                        <div key={i} className="text-sm mb-1"><span className="font-medium">{e.name}</span>{e.details && <span className="text-text-secondary text-xs"> — {e.details}</span>}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'timeline' && (
                analysis.timeline.length === 0 ? (
                  <div className="text-sm text-text-secondary">No chronological events could be identified.</div>
                ) : (
                <div className="space-y-2">
                  {analysis.timeline.map((t, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="font-mono text-xs text-text-muted flex-shrink-0 w-24">{t.date || '—'}</span>
                      <span className="text-text-secondary">{t.description}</span>
                    </div>
                  ))}
                </div>
                )
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
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 mt-4">Risk Factors</div>
                  {analysis.risk_assessment.factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-400 mt-0.5">⚠</span>
                      <span className="text-text-secondary">{f}</span>
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
            {messages.length === 0 && (
              <EmptyState icon="💬" title="Ask the Legal AI" description="Select a case above, or just start typing a question." />
            )}
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

          {chatError && <Alert variant="error" icon="⚠️">{chatError}</Alert>}

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
            <button className="btn-primary px-3" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
      )}
    </AppShell>
  )
}
