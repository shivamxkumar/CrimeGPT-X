'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuthStore } from '@/lib/store'
import { PageTransition } from '@/components/ui/motion'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const router = useRouter()
  // Zustand's persist middleware rehydrates `user` from localStorage
  // asynchronously after mount. Redirecting to /login before that finishes
  // would log out an already-authenticated user on every fresh page load
  // (e.g. a direct URL visit or a full navigation via window.location.href).
  // `.persist` touches localStorage, so it must never be read during the
  // initial render — that render also runs server-side at build time
  // (Next.js prerendering), where it doesn't exist at all.
  const [hydrated, setHydrated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (hydrated && !user) router.replace('/login')
  }, [hydrated, user, router])

  if (!hydrated) return null
  if (!user) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden app-bg p-4 md:p-6">
          <div className="relative z-10">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
