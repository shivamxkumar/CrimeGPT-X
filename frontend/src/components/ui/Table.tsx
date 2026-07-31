'use client'
import { ReactNode, useMemo, useState } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pagination } from './Pagination'
import { EmptyState } from './DataDisplay'

export interface TableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => ReactNode
  accessor?: (row: T) => string | number
  className?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
}

export function Table<T>({
  columns, data, rowKey, onRowClick, searchable, searchPlaceholder = 'Search...',
  pageSize = 10, emptyTitle = 'No results', emptyDescription,
}: TableProps<T>) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? col.accessor(row) : ''
        return String(val).toLowerCase().includes(q)
      })
    )
  }, [data, query, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find(c => c.key === sortKey)
    if (!col?.accessor) return filtered
    return [...filtered].sort((a, b) => {
      const av = col.accessor!(a), bv = col.accessor!(b)
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div>
      {searchable && (
        <div className="relative mb-3 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder={searchPlaceholder}
            className="input pl-8"
          />
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full">
            <thead className="tbl-head sticky top-0 bg-bg-card z-10">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className={col.className}>
                    {col.sortable && col.accessor ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1 hover:text-text-primary transition-colors"
                      >
                        {col.header}
                        <ArrowUpDown size={11} className={cn(sortKey === col.key && 'text-accent-blue')} />
                      </button>
                    ) : col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(row => (
                <tr key={rowKey(row)} className={cn('tbl-row', !onRowClick && 'cursor-default')} onClick={() => onRowClick?.(row)}>
                  {columns.map(col => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String(col.accessor?.(row) ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end mt-3">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
