'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { casesAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  LayoutDashboard, FolderOpen, FilePlus, FileText,
  Shield, Search, Monitor, Archive, BookOpen, Calendar,
  BarChart2, Users, LogOut, Settings, ChevronsLeft, ChevronsRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { Logo } from '@/components/ui/Logo'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  badge?: string
  roles?: string[]
  hideInDemo?: boolean
}

const navGroups: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Investigation',
    items: [
      { href: '/cases',     icon: FolderOpen, label: 'All Cases' },
      { href: '/cases/new', icon: FilePlus,   label: 'New Case', hideInDemo: true },
      { href: '/fir',       icon: FileText,   label: 'FIR Upload & OCR', hideInDemo: true },
    ],
  },
  {
    label: 'AI Intelligence',
    items: [
      { href: '/legal',     icon: Shield,  label: 'AI Legal Analysis' },
      { href: '/judgments', icon: Search,  label: 'Legal Search' },
      { href: '/cyber',     icon: Monitor, label: 'Cyber Detection' },
    ],
  },
  {
    label: 'Evidence & Reports',
    items: [
      { href: '/evidence',  icon: Archive,   label: 'Evidence' },
      { href: '/documents', icon: BookOpen,  label: 'Reports & Documents' },
      { href: '/diary',     icon: Calendar,  label: 'Case Diary / Timeline' },
    ],
  },
  {
    label: 'Command',
    items: [
      { href: '/analytics', icon: BarChart2, label: 'Analytics' },
      { href: '/admin',     icon: Users,     label: 'Admin Panel', roles: ['admin','sho'] },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout, isDemoMode } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const { data: caseStats } = useQuery({
    queryKey: ['case-stats'],
    queryFn: () => casesAPI.stats().then(r => r.data),
    staleTime: 30_000,
  })
  const badges: Record<string, string> = caseStats?.total ? { '/cases': String(caseStats.total) } : {}

  useEffect(() => {
    const stored = localStorage.getItem('crimegpt-sidebar-collapsed')
    if (stored === '1') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed(c => {
      localStorage.setItem('crimegpt-sidebar-collapsed', !c ? '1' : '0')
      return !c
    })
  }

  const renderLink = (item: NavItem) => {
    if (item.roles && !item.roles.includes(user?.role || '')) return null
    if (item.hideInDemo && isDemoMode) return null
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const Icon = item.icon
    const badge = item.badge || badges[item.href]
    const link = (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn('nav-link', collapsed && 'justify-center px-0', isActive && 'active')}
      >
        <Icon size={16} className={isActive ? 'text-accent-blue' : 'text-text-muted'} />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && badge && (
          <span className="bg-accent-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </Link>
    )
    return collapsed ? <Tooltip key={item.href} content={item.label} side="right">{link}</Tooltip> : link
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'flex flex-col bg-bg-surface border-r border-white/[0.06] flex-shrink-0 transition-all duration-200',
          collapsed ? 'md:w-[4.5rem]' : 'md:w-60',
          'w-64',
          'fixed inset-y-0 left-0 z-50 md:static md:z-auto md:translate-x-0 md:h-full',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className={cn('h-16 flex items-center flex-shrink-0 border-b border-white/[0.06]', collapsed ? 'justify-center px-0' : 'px-4 gap-2.5')}>
          <Logo size={28} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight leading-tight truncate">CrimeGPT-X</div>
              <div className="text-[9px] text-text-muted tracking-widest uppercase truncate">Police Intelligence Platform</div>
            </div>
          )}
        </div>

        <nav className="flex flex-col flex-1 px-2 py-3 gap-0.5 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-1">
              {group.label && !collapsed && (
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                  {group.label}
                </div>
              )}
              {group.items.map(renderLink)}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex items-center justify-center gap-2 mx-2 mb-2 py-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-all text-xs font-medium"
        >
          {collapsed ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /> Collapse</>}
        </button>

        {/* Settings + user + logout at bottom */}
        <div className={cn('p-3 border-t border-white/[0.06]', collapsed && 'px-2')}>
          {renderLink({ href: '/settings', icon: Settings, label: 'Settings' })}

          <div className={cn('flex items-center gap-2.5 mt-2 mb-2', collapsed && 'justify-center')}>
            <Avatar name={user?.name} size="sm" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary truncate">{user?.name}</div>
                <div className="text-[10px] text-text-muted capitalize">{user?.role}</div>
              </div>
            )}
          </div>
          {collapsed ? (
            <Tooltip content="Sign Out" side="right">
              <button onClick={logout} aria-label="Sign Out" className="nav-link w-full justify-center px-0 text-text-muted hover:text-accent-red">
                <LogOut size={14} />
              </button>
            </Tooltip>
          ) : (
            <button onClick={logout} className="nav-link w-full text-xs text-text-muted hover:text-accent-red">
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
