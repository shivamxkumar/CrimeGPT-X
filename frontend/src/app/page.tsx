'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function RootPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  useEffect(() => {
    router.replace(user ? '/dashboard' : '/login')
  }, [user, router])
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <div className="text-text-muted text-sm">Loading CrimeGPT-X...</div>
      </div>
    </div>
  )
}
