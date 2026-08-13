'use client'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Eye, LogOut } from 'lucide-react'

export default function DemoModeBanner() {
  const { logout } = useAuthStore()
  const router = useRouter()

  function exitDemo() {
    logout()
    router.push('/login')
  }

  return (
    <div className="flex-shrink-0 bg-gradient-to-r from-accent-blue/20 via-accent-purple/15 to-accent-blue/20 border-b border-accent-blue/30 px-4 py-2 flex items-center justify-center gap-2 text-xs">
      <Eye size={13} className="text-accent-blue flex-shrink-0" />
      <span className="text-text-secondary text-center">
        <strong className="text-text-primary">Live Demo</strong> — viewing sample data. All actions are read-only.
      </span>
      <button
        onClick={exitDemo}
        className="ml-2 flex items-center gap-1 text-accent-blue hover:text-white font-medium transition-colors flex-shrink-0"
      >
        <LogOut size={11} /> Exit Demo
      </button>
    </div>
  )
}
