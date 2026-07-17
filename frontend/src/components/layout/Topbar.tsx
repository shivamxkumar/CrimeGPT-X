'use client'
import { Bell, Search, Menu } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'U'

  return (
    <header className="h-13 flex-shrink-0 flex items-center px-3 md:px-5 gap-2 md:gap-4 bg-bg-surface border-b border-white/[0.07] cyber-edge z-30">
      {/* Mobile menu toggle */}
      <button
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-secondary flex-shrink-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5 glitch-hover min-w-0">
        <Logo size={30} />
        <div className="hidden sm:block min-w-0">
          <div className="text-sm font-bold tracking-tight leading-tight neon-text truncate">CrimeGPT-X</div>
          <div className="text-[9px] text-text-muted tracking-widest uppercase truncate">Police Intelligence Platform</div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Live badge */}
      <span className="hidden sm:flex badge-green text-[10px] gap-1 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        LIVE
      </span>

      {/* Search */}
      <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-white/[0.07] text-text-muted text-xs hover:text-text-primary transition-all">
        <Search size={13} />
        <span>Search cases...</span>
        <span className="ml-2 font-mono text-[10px] opacity-50">⌘K</span>
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-secondary transition-all relative"
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full border-2 border-bg-surface" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-10 w-[min(20rem,calc(100vw-1.5rem))] bg-bg-surface border border-white/[0.07] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-white/[0.07] font-semibold text-sm">Notifications</div>
            {[
              { icon: '⏰', title: 'Remand deadline — CC/2024/0839', body: 'Court submission due in 48 hours', time: '2h ago', color: 'text-amber-400' },
              { icon: '✅', title: 'Chargesheet ready — CC/2024/0847', body: 'AI generated, pending review', time: '3h ago', color: 'text-green-400' },
              { icon: '📁', title: 'New case assigned — CC/2024/0848', body: 'Social media sextortion case', time: 'Yesterday', color: 'text-blue-400' },
            ].map((n, i) => (
              <div key={i} className="flex gap-3 p-3 hover:bg-bg-hover cursor-pointer transition-colors border-b border-white/[0.04] last:border-0">
                <div className={`text-lg ${n.color}`}>{n.icon}</div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-text-primary truncate">{n.title}</div>
                  <div className="text-[11px] text-text-secondary">{n.body}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</div>
          <div className="text-[10px] text-text-muted capitalize">{user?.role?.toUpperCase()}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {initials}
        </div>
      </div>
    </header>
  )
}
