import {
  FileText, Sparkles, Archive, Users, ShieldAlert, Landmark,
  FileCheck2, StickyNote, RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Shared visual language for DiaryEntryType across Dashboard's activity feed
// and the Case Diary / Timeline page — one source so the two stay in sync.
export const ENTRY_STYLES: Record<string, { icon: LucideIcon; color: string }> = {
  fir_registered:     { icon: FileText,    color: '#3b82f6' },
  ai_analysis:         { icon: Sparkles,    color: '#8b5cf6' },
  evidence_upload:     { icon: Archive,     color: '#22c55e' },
  witness_statement:   { icon: Users,       color: '#f59e0b' },
  arrest:              { icon: ShieldAlert, color: '#ef4444' },
  court_submission:    { icon: Landmark,    color: '#8b5cf6' },
  document_generated:  { icon: FileCheck2, color: '#60a5fa' },
  note:                { icon: StickyNote,  color: '#9ca3af' },
  status_change:       { icon: RefreshCw,   color: '#60a5fa' },
}

export function entryStyle(entryType: string) {
  return ENTRY_STYLES[entryType] || ENTRY_STYLES.note
}
