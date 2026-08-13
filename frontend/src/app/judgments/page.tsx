'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, EmptyState, Button, AIThinking } from '@/components/ui'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { judgmentsAPI } from '@/lib/api'
import { Judgment } from '@/types'
import { Search, BookOpen } from 'lucide-react'
import { useT } from '@/lib/i18n'

const SEARCH_STEPS = ['Embedding your query...', 'Searching the judgments corpus...', 'Ranking by legal relevance...']

export default function JudgmentsPage() {
  const t = useT()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Judgment[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    try {
      const { data } = await judgmentsAPI.search(query)
      setResults(data.judgments || [])
      setMessage(data.message || null)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Judgment search failed — check the backend connection.')
      setResults(null)
    } finally {
      setSearching(false)
    }
  }

  return (
    <AppShell>
      <PageHeader title={t('judgments.title')} subtitle={t('judgments.subtitle')}>
        <span className="badge-purple">⚡ RAG Engine</span>
      </PageHeader>

      {/* Search bar */}
      <div className="card mb-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input pl-9"
              placeholder="Search: UPI fraud remote access bank impersonation..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
          </div>
          <Button onClick={search} disabled={searching || !query.trim()} loading={searching}>
            {searching ? 'Searching...' : <><Search size={14} /> Semantic Search</>}
          </Button>
        </div>
      </div>

      {/* Results */}
      {error && <Alert variant="error" icon="⚠️">{error}</Alert>}

      {searching && <AIThinking steps={SEARCH_STEPS} label="Running semantic search" />}

      {!searching && results === null && !error && (
        <EmptyState icon="📚" title="Search landmark judgments" description="Enter case facts, section numbers, or a crime pattern to find relevant precedent from the ingested corpus." />
      )}

      {!searching && results !== null && results.length === 0 && (
        <EmptyState icon="📭" title="No indexed judgments available" description={message || 'Please ingest a real legal corpus.'} />
      )}

      {!searching && results !== null && results.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-3">
          {results.map((j, idx) => (
            <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} className="card hover:border-white/[0.1] transition-all border-l-[3px]" style={{ borderLeftColor: '#8b5cf6' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <BookOpen size={14} className="text-text-muted flex-shrink-0" />
                    <span className="font-semibold text-sm">{j.title}</span>
                    {j.citation && <span className="font-mono text-xs text-text-muted">{j.citation}</span>}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{j.court}{j.year && ` · ${j.year}`}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="badge-purple text-[11px]">{Math.round(j.relevance_score * 100)}% Match</span>
                  <Button variant="secondary" size="sm" onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
                    {expandedIdx === idx ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-text-secondary leading-relaxed">{j.summary}</div>

              {expandedIdx === idx && (
                <div className="mt-3 pt-3 border-t border-white/[0.07] animate-slide-in">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Legal Relevance</div>
                  <div className="text-xs text-text-secondary leading-relaxed bg-bg-base rounded-lg p-2.5">
                    {j.legal_relevance}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AppShell>
  )
}
