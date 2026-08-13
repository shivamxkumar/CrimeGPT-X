'use client'
import { Bell, Search, Menu, ChevronDown, LogOut, Settings, User as UserIcon, Languages, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Avatar } from '@/components/ui/Avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/Menu'
import { useT, useLanguageStore, LANGUAGES } from '@/lib/i18n'
import SearchPalette from './SearchPalette'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const t = useT()
  const { language, setLanguage } = useLanguageStore()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="h-16 flex-shrink-0 flex items-center px-3 md:px-5 gap-3 md:gap-4 glass border-b border-white/[0.06] z-30">
      {/* Mobile menu toggle */}
      <button
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-text-secondary flex-shrink-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <Breadcrumb />

      <div className="flex-1" />

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-card border border-white/[0.06] text-text-muted text-xs hover:border-white/[0.14] transition-all"
      >
        <Search size={13} />
        <span>{t('common.searchPlaceholder')}</span>
        <span className="ml-2 font-mono text-[10px] opacity-50">⌘K</span>
      </button>
      <button
        onClick={() => setSearchOpen(true)}
        aria-label={t('common.searchPlaceholder')}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-text-secondary flex-shrink-0"
      >
        <Search size={17} />
      </button>
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Language */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] text-text-secondary transition-all"
            aria-label={t('common.language')}
          >
            <Languages size={17} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LANGUAGES.map(l => (
            <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)}>
              <span className="flex-1">{l.label}</span>
              {language === l.code && <Check size={14} className="text-accent-blue" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <div className="relative">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] text-text-secondary transition-all relative"
          onClick={() => setNotifOpen(!notifOpen)}
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-red rounded-full border-2 border-bg-surface" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-11 w-[min(20rem,calc(100vw-1.5rem))] glass rounded-xl2 shadow-soft z-50 overflow-hidden animate-scale-in">
            <div className="p-3 border-b border-white/[0.06] font-semibold text-sm">{t('common.notifications')}</div>
            {[
              { icon: '⏰', title: 'Remand deadline — CC/2024/0839', body: 'Court submission due in 48 hours', time: '2h ago', color: 'text-amber-400' },
              { icon: '✅', title: 'Chargesheet ready — CC/2024/0847', body: 'AI generated, pending review', time: '3h ago', color: 'text-green-400' },
              { icon: '📁', title: 'New case assigned — CC/2024/0848', body: 'Social media sextortion case', time: 'Yesterday', color: 'text-blue-400' },
            ].map((n, i) => (
              <div key={i} className="flex gap-3 p-3 hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.04] last:border-0">
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

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 flex-shrink-0 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.06] transition-all">
            <Avatar name={user?.name} size="sm" />
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</div>
              <div className="text-[10px] text-text-muted capitalize">{user?.role?.toUpperCase()}</div>
            </div>
            <ChevronDown size={13} className="hidden sm:block text-text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('common.signedInAs', { name: user?.name || '' })}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings"><UserIcon size={14} /> {t('common.profile')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings"><Settings size={14} /> {t('nav.settings')}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-400 data-[highlighted]:text-red-300">
            <LogOut size={14} /> {t('nav.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
