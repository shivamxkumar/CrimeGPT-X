import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    p => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-white/[0.06] hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-all"
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-text-muted text-xs">…</span>}
          <button
            onClick={() => onPageChange(p)}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all',
              p === page ? 'bg-gradient-brand text-white shadow-soft' : 'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary'
            )}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-white/[0.06] hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-all"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}
