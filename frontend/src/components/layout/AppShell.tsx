'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuthStore } from '@/lib/store'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user])

  if (!user) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg-base p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
