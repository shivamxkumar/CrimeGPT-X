'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  LayoutDashboard, FolderOpen, FilePlus, FileText,
  Shield, Search, Monitor, Archive, BookOpen, Calendar,
  BarChart2, Users, LogOut, Bell, Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  badge?: string
  roles?: string[]
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
      { href: '/cases',   icon: FolderOpen, label: 'All Cases',  badge: '7' },
      { href: '/cases/new', icon: FilePlus, label: 'New Case' },
      { href: '/fir',     icon: FileText,   label: 'FIR Upload' },
    ],
  },
  {
    label: 'AI Intelligence',
    items: [
      { href: '/legal',     icon: Shield,  label: 'Legal AI Engine' },
      { href: '/judgments', icon: Search,  label: 'Judgment Search' },
      { href: '/cyber',     icon: Monitor, label: 'Cyber Detection' },
    ],
  },
  {
    label: 'Evidence & Docs',
    items: [
      { href: '/evidence',  icon: Archive,   label: 'Evidence Vault' },
      { href: '/documents', icon: BookOpen,  label: 'Documents' },
      { href: '/diary',     icon: Calendar,  label: 'Case Diary' },
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

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-56 flex flex-col bg-bg-surface border-r border-white/[0.07] h-full flex-shrink-0">
      <nav className="flex flex-col flex-1 px-2 py-3 gap-0.5 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.label && (
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              if (item.roles && !item.roles.includes(user?.role || '')) return null
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('nav-link', isActive && 'active')}
                >
                  <Icon size={16} className={isActive ? 'text-accent-blue' : 'text-text-muted'} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-accent-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + logout at bottom */}
      <div className="p-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {user?.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-text-primary truncate">{user?.name}</div>
            <div className="text-[10px] text-text-muted capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-link w-full text-xs text-text-muted hover:text-accent-red"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
