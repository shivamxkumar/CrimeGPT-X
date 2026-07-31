'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, LegalSectionCard, Alert, Spinner, CaseSelector, useSelectedCase, EmptyState, Button, Tabs, TabsList, TabsTrigger, TabsContent, RadialGauge, AIThinking, Markdown } from '@/components/ui'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { aiAPI, casesAPI } from '@/lib/api'
import { AIAnalysisResult } from '@/types'
import { Send, Shield, MessageSquare, Sparkles, Download, TriangleAlert, CheckCircle2, Quote } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const riskColors: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' }

export default function LegalAIPage() {
  const { selectedCaseId, isLoading: casesLoading } = useSelectedCase()
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
    // Only re-run when switching to a different case, not on every refetch of selectedCase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function exportAnalysis() {
    if (!analysis) return
    const lines = [
      `CrimeGPT-X — AI Legal Analysis`,
      selectedCase ? `Case: ${selectedCase.case_id} — ${selectedCase.victim_name}` : 'Case: (free-form FIR text)',
      `Crime type detected: ${analysis.crime_type_detected}`,
      `Risk: ${analysis.risk_assessment.level.toUpperCase()} (${analysis.risk_assessment.score}/100)`,
      '',
      '── Applicable Legal Sections ──',
      ...analysis.sections.map(s => `${s.section} [${s.act}] — ${s.title} (${s.confidence}% confidence)\n  ${s.description}`),
      '',
      '── Key Facts ──',
      ...analysis.key_facts.map(f => `• ${f}`),
      '',
      '── Investigation Recommendations ──',
      ...analysis.investigation_recommendations.map((r, i) => `${i + 1}. ${r}`),
      '',
      '── Risk Factors ──',
      ...analysis.risk_assessment.factors.map(f => `⚠ ${f}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCase?.case_id || 'legal-analysis'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const avgConfidence = analysis?.sections.length
    ? Math.round(analysis.sections.reduce((s, x) => s + x.confidence, 0) / analysis.sections.length)
    : null

  return (
    <AppShell>
      <PageHeader title="AI Legal Intelligence Engine" subtitle={selectedCase ? `Case ${selectedCase.case_id} — ${selectedCase.victim_name}` : 'Select a case, or analyze free-form FIR text'}>
        <CaseSelector />
        <span className="badge-cyan">Gemini Powered</span>
      </PageHeader>

      {casesLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg"/></div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
            <Button className="w-full justify-center mt-3" onClick={runAnalysis} disabled={analyzing || !firText.trim()} loading={analyzing}>
              {!analyzing && <Sparkles size={15} />} {analyzing ? 'Analyzing FIR...' : 'Analyze → Suggest BNS Sections'}
            </Button>
          </div>

          {analysisError && <Alert variant="error" icon="⚠️">{analysisError}</Alert>}

          {analyzing && <AIThinking />}

          {analysis && (
            <div className="card animate-slide-in">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="font-semibold text-sm">Analysis Results</div>
                <div className="flex items-center gap-2">
                  <span className="badge-green">AI Complete · {analysis.analysis_time_ms}ms</span>
                  <Button variant="secondary" size="sm" onClick={exportAnalysis}><Download size={13} /> Export</Button>
                </div>
              </div>

              {/* Risk assessment + confidence banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="card-sm flex items-center gap-3">
                  {analysis.risk_assessment.level === 'low'
                    ? <CheckCircle2 size={20} style={{ color: riskColors.low }} />
                    : <TriangleAlert size={20} style={{ color: riskColors[analysis.risk_assessment.level] }} />}
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">Risk Assessment</div>
                    <div className="text-sm font-bold" style={{ color: riskColors[analysis.risk_assessment.level] }}>
                      {analysis.risk_assessment.level.toUpperCase()} · {analysis.risk_assessment.score}/100
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">{analysis.crime_type_detected}</div>
                  </div>
                </div>
                {avgConfidence !== null && (
                  <div className="card-sm flex items-center gap-3">
                    <RadialGauge value={avgConfidence} size={44} strokeWidth={4} />
                    <div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wide">Overall Confidence</div>
                      <div className="text-sm font-bold text-text-primary">Across {analysis.sections.length} section{analysis.sections.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
                <TabsList className="mb-4 flex-wrap">
                  <TabsTrigger value="sections">Sections ({analysis.sections.length})</TabsTrigger>
                  <TabsTrigger value="judgments">Judgments ({analysis.judgments.length})</TabsTrigger>
                  <TabsTrigger value="entities">Entities</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="sections">
                  {analysis.sections.length === 0
                    ? <div className="text-sm text-text-secondary">No applicable sections identified from this text.</div>
                    : <div>{analysis.sections.map((s, i) => <LegalSectionCard key={i} section={s} />)}</div>}
                </TabsContent>

                <TabsContent value="judgments">
                  {analysis.judgments.length === 0 ? (
                    <EmptyState icon="📭" title="No indexed judgments available" description={analysis.judgments_message || 'Please ingest a real legal corpus.'} />
                  ) : (
                    <div className="space-y-3">
                      {analysis.judgments.map((j, i) => (
                        <div key={i} className="card-sm border-l-[3px] flex gap-3" style={{ borderLeftColor: '#8b5cf6' }}>
                          <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5">{i + 1}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="font-semibold text-sm">{j.title}</div>
                              <span className="badge-purple text-[10px] flex-shrink-0">{Math.round(j.relevance_score * 100)}% Match</span>
                            </div>
                            <div className="text-xs text-text-muted mb-2">{j.court}{j.year && ` · ${j.year}`}{j.citation && ` · ${j.citation}`}</div>
                            <div className="flex gap-1.5 text-xs text-text-secondary leading-relaxed">
                              <Quote size={12} className="text-text-muted flex-shrink-0 mt-0.5" />
                              {j.summary}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="entities">
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
                </TabsContent>

                <TabsContent value="timeline">
                  {analysis.timeline.length === 0 ? (
                    <div className="text-sm text-text-secondary">No chronological events could be identified.</div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-white/[0.07]" />
                      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
                        {analysis.timeline.map((t, i) => (
                          <motion.div key={i} variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0 } }} className="relative pl-5 pb-3 last:pb-0">
                            <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-accent-blue bg-bg-card" />
                            <span className="font-mono text-[11px] text-accent-blue">{t.date || '—'}</span>
                            <div className="text-sm text-text-secondary mt-0.5">{t.description}</div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recommendations">
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
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="card flex flex-col h-[70vh] max-h-[640px] lg:h-[640px]">
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
                  <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-white">AI</div>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                  m.role === 'assistant'
                    ? 'bg-bg-card2 border border-white/[0.06] rounded-tl-sm'
                    : 'bg-gradient-brand text-white rounded-tr-sm'
                }`}>
                  {m.role === 'assistant' ? <Markdown content={m.content} /> : m.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white">AI</div>
                <div className="bg-bg-card2 border border-white/[0.06] rounded-xl rounded-tl-sm px-3.5 py-3 flex gap-1 text-text-secondary">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatError && <Alert variant="error" icon="⚠️">{chatError}</Alert>}

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {['Which BNS section for remote access fraud?','How to file chargesheet?','Evidence admissibility under BSA?','Remand procedure BNSS 187?'].map(q=>(
              <button key={q} onClick={()=>setChatInput(q)} className="text-[10px] px-2 py-1 rounded-lg bg-bg-card2 text-text-muted hover:text-text-primary border border-white/[0.06] hover:border-accent-blue/30 transition-all">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t border-white/[0.06] pt-3">
            <input
              className="input flex-1 text-sm"
              placeholder="Ask about BNS sections, BNSS procedure, evidence law..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
            />
            <Button className="px-3" aria-label="Send message" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
              <Send size={14} />
            </Button>
          </div>
        </div>
      </div>
      )}
    </AppShell>
  )
}
