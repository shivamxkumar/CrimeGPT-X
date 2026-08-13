'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'
import { useT, type TranslationKey } from '@/lib/i18n'

const LABEL_KEYS: Record<string, TranslationKey> = {
  dashboard: 'nav.dashboard',
  cases: 'nav.allCases',
  new: 'nav.newCase',
  fir: 'nav.firUpload',
  legal: 'nav.aiLegalAnalysis',
  judgments: 'nav.legalSearch',
  evidence: 'nav.evidence',
  documents: 'nav.reportsDocuments',
  diary: 'nav.caseDiary',
  analytics: 'nav.analytics',
  cyber: 'nav.cyberDetection',
  admin: 'nav.adminPanel',
  settings: 'nav.settings',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const t = useT()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav className="hidden lg:flex items-center gap-1.5 text-sm text-text-muted min-w-0" aria-label="Breadcrumb">
      <Home size={13} className="flex-shrink-0" />
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/')
        const isLast = i === segments.length - 1
        const labelKey = LABEL_KEYS[seg]
        const label = labelKey ? t(labelKey) : decodeURIComponent(seg)
        return (
          <Fragment key={href}>
            <ChevronRight size={12} className="flex-shrink-0 opacity-50" />
            {isLast ? (
              <span className="text-text-primary font-medium truncate max-w-[12rem]">{label}</span>
            ) : (
              <Link href={href} className="hover:text-text-primary transition-colors truncate max-w-[10rem]">{label}</Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
