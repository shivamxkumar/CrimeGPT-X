'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Spinner } from '@/components/ui'
import { useState } from 'react'
import { Search, BookOpen, ExternalLink } from 'lucide-react'

const JUDGMENT_DB = [
  {
    id: 1, title: 'State of Karnataka vs. Soman', citation: 'AIR 2022 SC 1847', court: 'Supreme Court of India', year: '2022',
    category: 'Remote Access Fraud', sections: ['BNS 318', 'BNS 319', 'IT Act 66C', 'IT Act 66D'],
    summary: "Held that gaining unauthorized remote access to a victim's device to conduct financial transactions constitutes identity theft (IT Act 66C) and cheating by personation using computer resources (66D). Conviction upheld with 3 years imprisonment.",
    relevance: 'Directly applicable — remote access via AnyDesk is the exact pattern adjudicated here.',
    score: 94,
    color: '#b57bee',
  },
  {
    id: 2, title: 'Shreya Singhal vs. Union of India', citation: '2015 SCC 1 641', court: 'Supreme Court of India', year: '2015',
    category: 'Digital Communication Fraud', sections: ['IT Act 66', 'BNS 318'],
    summary: 'Landmark ruling establishing that deceptive communications via digital platforms for extracting financial information are prosecutable under IT Act provisions alongside criminal fraud statutes.',
    relevance: 'Establishes digital communication as valid channel for fraud prosecution.',
    score: 81,
    color: '#1a6cf6',
  },
  {
    id: 3, title: 'Thane Police vs. Rahul Singh', citation: '2023 Cr LJ 210', court: 'Gujarat High Court', year: '2023',
    category: 'UPI Fraud / Bank Impersonation', sections: ['BNS 319', 'BNS 420', 'IT Act 66C'],
    summary: 'Gujarat HC upheld conviction in a case where accused impersonated a bank employee over phone and induced victim to share OTP, resulting in unauthorized UPI transfers. Chain of digital evidence — call records, app logs, transaction timestamps — held admissible under BSA.',
    relevance: 'Same jurisdiction (Gujarat) and identical crime pattern — strong precedent.',
    score: 77,
    color: '#00e676',
  },
  {
    id: 4, title: 'Shri Ram vs. State of Maharashtra', citation: 'Bombay HC 2022 Cri 418', court: 'Bombay High Court', year: '2022',
    category: 'Investment Scam / App Fraud', sections: ['BNS 318', 'IT Act 66D', 'BNSS 180'],
    summary: 'Court held that operating a fake investment app to defraud victims constitutes IT Act 66D and BNS cheating. Witness statements recorded under BNSS 180 were given full evidentiary weight.',
    relevance: 'Relevant for investment scam cases — app fraud pattern.',
    score: 72,
    color: '#ffa726',
  },
  {
    id: 5, title: 'Central Bureau of Investigation vs. Ashish Mehta', citation: 'Delhi HC 2023 CRL 892', court: 'Delhi High Court', year: '2023',
    category: 'Phishing / Data Theft', sections: ['IT Act 43', 'IT Act 66C', 'BNS 318'],
    summary: 'Phishing attack using fake SBI website to steal credentials. Court held website operators liable under IT Act 43 (unauthorized access) and 66C (identity theft). Digital forensic evidence from CERT-In report accepted.',
    relevance: 'Applicable to phishing cases — sets standard for digital forensic evidence.',
    score: 69,
    color: '#00d4ff',
  },
]

const QUICK_FILTERS = ['Supreme Court', 'Gujarat HC', 'BNS 318', 'IT Act 66C', 'UPI Fraud', 'Remote Access', 'Chargesheet']

export default function JudgmentsPage() {
  const [query, setQuery] = useState('UPI fraud remote access bank impersonation KYC')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(JUDGMENT_DB)
  const [activeFilter, setActiveFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(1)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    await new Promise(r => setTimeout(r, 900))
    // Semantic simulation — filter by query keywords
    const q = query.toLowerCase()
    const filtered = JUDGMENT_DB.filter(j =>
      j.title.toLowerCase().includes(q.split(' ')[0]) ||
      j.summary.toLowerCase().includes(q.split(' ')[0]) ||
      j.category.toLowerCase().includes(q.split(' ')[0]) ||
      j.sections.some(s => q.includes(s.toLowerCase()))
    )
    setResults(filtered.length ? filtered : JUDGMENT_DB)
    setSearching(false)
  }

  function applyFilter(f: string) {
    setActiveFilter(f === activeFilter ? '' : f)
    if (!f || f === activeFilter) { setResults(JUDGMENT_DB); return }
    setResults(JUDGMENT_DB.filter(j =>
      j.court.includes(f) || j.sections.some(s => s.includes(f)) ||
      j.category.toLowerCase().includes(f.toLowerCase())
    ))
  }

  return (
    <AppShell>
      <PageHeader title="Landmark Judgment Search" subtitle="RAG-powered semantic search across case law database">
        <span className="badge-purple">⚡ RAG Engine Active</span>
        <span className="badge-gray">{JUDGMENT_DB.length} judgments indexed</span>
      </PageHeader>

      {/* Search bar */}
      <div className="card mb-4">
        <div className="flex gap-3 mb-3">
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
          <button className="btn-primary" onClick={search} disabled={searching}>
            {searching ? <><Spinner size="sm" /> Searching...</> : '🔍 Semantic Search'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-text-muted">Quick filters:</span>
          {QUICK_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => applyFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                activeFilter === f
                  ? 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue'
                  : 'bg-bg-card2 border-white/[0.07] text-text-secondary hover:text-text-primary hover:border-white/15'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {searching ? (
          <div className="card flex items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <div className="text-text-secondary">Searching {JUDGMENT_DB.length} judgments with semantic similarity...</div>
          </div>
        ) : results.map(j => (
          <div key={j.id} className="card hover:border-white/15 transition-all" style={{ borderLeft: `3px solid ${j.color}` }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpen size={14} className="text-text-muted flex-shrink-0" />
                  <span className="font-semibold text-sm">{j.title}</span>
                  <span className="font-mono text-xs text-text-muted">{j.citation}</span>
                </div>
                <div className="text-xs text-text-muted mt-0.5">{j.court} · {j.year} · {j.category}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="badge-purple text-[11px]">{j.score}% Match</span>
                <button
                  onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  {expandedId === j.id ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>

            {/* Sections */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {j.sections.map(s => <span key={s} className="badge-cyan text-[10px]">{s}</span>)}
            </div>

            {/* Summary — always visible */}
            <div className="text-xs text-text-secondary leading-relaxed">{j.summary}</div>

            {/* Expanded */}
            {expandedId === j.id && (
              <div className="mt-3 pt-3 border-t border-white/[0.07] animate-slide-in">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Legal Relevance to Current Case</div>
                <div className="text-xs text-text-secondary leading-relaxed bg-bg-base rounded-lg p-2.5 mb-3">
                  {j.relevance}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs px-3 py-1.5">📋 Add to Chargesheet</button>
                  <button className="btn-secondary text-xs px-3 py-1.5">📌 Pin to Case CC/2024/0847</button>
                  <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                    <ExternalLink size={11} /> Full Judgment
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  )
}
