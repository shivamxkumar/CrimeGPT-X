'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { casesAPI } from '@/lib/api'
import { CaseListItem, CRIME_CATEGORY_LABELS } from '@/types'
import { caseHref } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface SearchPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const t = useT()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 200)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    if (open) { setQuery(''); setDebounced(''); setActiveIndex(0) }
  }, [open])

  const { data, isFetching } = useQuery({
    queryKey: ['case-search', debounced],
    queryFn: () => casesAPI.list({ q: debounced, limit: 8 }).then(r => r.data),
    enabled: open && debounced.length > 0,
  })

  const results: CaseListItem[] = data?.items || []

  useEffect(() => { setActiveIndex(0) }, [results.length])

  function select(c: CaseListItem) {
    onOpenChange(false)
    router.push(caseHref(c.case_id))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); select(results[activeIndex]) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          onOpenAutoFocus={e => { e.preventDefault(); inputRef.current?.focus() }}
          className="fixed left-1/2 top-[15vh] -translate-x-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] glass rounded-xl2 shadow-soft overflow-hidden data-[state=open]:animate-scale-in focus:outline-none"
        >
          <Dialog.Title className="sr-only">{t('common.searchPlaceholder')}</Dialog.Title>
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
            <Search size={16} className="text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t('common.searchPlaceholder')}
              className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
            />
            <Dialog.Close asChild>
              <button aria-label="Close" className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all flex-shrink-0">
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {debounced.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-muted">{t('common.searchHint')}</div>
            ) : isFetching ? (
              <div className="px-4 py-8 text-center text-xs text-text-muted">{t('common.searching')}</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-muted">{t('common.noResults')}</div>
            ) : (
              <ul>
                {results.map((c, i) => (
                  <li key={c.id}>
                    <button
                      onClick={() => select(c)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === activeIndex ? 'bg-white/[0.06]' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-accent-blue">{c.case_id}</span>
                          <span className="text-xs text-text-secondary truncate">{c.victim_name}</span>
                        </div>
                        <div className="text-[11px] text-text-muted truncate mt-0.5">
                          {CRIME_CATEGORY_LABELS[c.crime_category] || c.crime_category}
                          {c.fir_number ? ` · ${c.fir_number}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <StatusBadge status={c.status} />
                        <PriorityBadge priority={c.priority} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
