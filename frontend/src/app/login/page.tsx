'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [badge, setBadge] = useState('AHM-24-IO-047')
  const [password, setPassword] = useState('demo1234')
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(badge, password)
      toast.success('Login successful')
      router.push('/dashboard')
    } catch {
      toast.error('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(26,108,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(26,108,246,1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-sm">
        <div className="card border-white/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent-blue flex items-center justify-center text-2xl shadow-lg shadow-accent-blue/30">🔍</div>
              <div className="text-left">
                <div className="text-2xl font-extrabold tracking-tight">CrimeGPT</div>
                <div className="text-[10px] text-text-muted tracking-widest uppercase">Police Intelligence Platform</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-xs text-accent-blue">
              🔒 Secured · Gujarat Police Cyber Crime Branch
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Officer Badge Number</label>
              <input
                className="input"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="AHM-2024-IO-047"
                required
              />
            </div>
            <div>
              <label className="label block mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {isLoading ? <Spinner size="sm" /> : '🔐'} Login to CrimeGPT
            </button>
          </form>

          <div className="mt-6 text-center text-[11px] text-text-muted leading-relaxed">
            Gujarat Police Department · Ahmedabad Cyber Crime Branch<br />
            Confidential — Unauthorized access is a cognizable offence
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-lg bg-bg-card2 border border-white/[0.05]">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Demo Credentials</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
              <div><span className="text-text-muted">IO:</span> AHM-24-IO-047</div>
              <div><span className="text-text-muted">SHO:</span> AHM-23-SHO-012</div>
              <div><span className="text-text-muted">Legal:</span> LEG-24-001</div>
              <div><span className="text-text-muted">Admin:</span> ADM-24-001</div>
            </div>
            <div className="text-[10px] text-text-muted mt-1">Password: demo1234</div>
          </div>
        </div>
      </div>
    </div>
  )
}
