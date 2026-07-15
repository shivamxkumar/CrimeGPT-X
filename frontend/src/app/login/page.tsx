'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Spinner } from '@/components/ui'
import { Logo } from '@/components/ui/Logo'
import toast from 'react-hot-toast'
import { Fingerprint, ShieldCheck, Scale, UserCog } from 'lucide-react'

const ROLES = [
  { key: 'io',    label: 'Investigation Officer', short: 'IO',    badge: 'AHM-24-IO-047',  icon: Fingerprint },
  { key: 'sho',   label: 'Station House Officer', short: 'SHO',   badge: 'AHM-23-SHO-012', icon: ShieldCheck },
  { key: 'legal', label: 'Legal Advisor',         short: 'Legal', badge: 'LEG-24-001',     icon: Scale },
  { key: 'admin', label: 'Administrator',         short: 'Admin', badge: 'ADM-24-001',     icon: UserCog },
] as const

export default function LoginPage() {
  const [role, setRole] = useState<typeof ROLES[number]['key']>('io')
  const [badge, setBadge] = useState('AHM-24-IO-047')
  const [password, setPassword] = useState('demo1234')
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  function selectRole(r: typeof ROLES[number]) {
    setRole(r.key)
    setBadge(r.badge)
  }

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
    <div className="min-h-screen cyber-bg flex items-center justify-center p-4">
      {/* Ambient glow blobs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 rounded-full bg-accent-cyan/10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent-blue/10 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="card border-accent-cyan/10 shadow-2xl" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08), 0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="glitch-hover">
                <Logo size={48} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-extrabold tracking-tight neon-text">CrimeGPT-X</div>
                <div className="text-[10px] text-text-muted tracking-widest uppercase">Police Intelligence Platform</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-xs text-accent-cyan font-mono">
              🔒 Secured · Gujarat Police Cyber Crime Branch
            </div>
            <div className="mt-2 font-mono text-[10px] text-text-muted tracking-wide">
              AUTH_MODULE: <span className="text-accent-green">ONLINE</span> · ENCRYPTION: <span className="text-accent-cyan">AES-256</span> · NODE: AHM-CCB-01
            </div>
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <label className="label block mb-2">Select Officer Role</label>
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map(r => {
                const Icon = r.icon
                const active = role === r.key
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => selectRole(r)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-accent-cyan/10 border-accent-cyan/50 text-accent-cyan shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                        : 'bg-bg-card2 border-white/[0.07] text-text-muted hover:text-text-primary hover:border-white/15'
                    }`}
                  >
                    <Icon size={18} />
                    {r.short}
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Officer Badge Number</label>
              <input
                className="input font-mono"
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
              {isLoading ? <Spinner size="sm" /> : '🔐'} Login to CrimeGPT-X
            </button>
          </form>

          <div className="mt-6 text-center text-[11px] text-text-muted leading-relaxed">
            Gujarat Police Department · Ahmedabad Cyber Crime Branch<br />
            Confidential — Unauthorized access is a cognizable offence
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-lg bg-bg-card2 border border-white/[0.05]">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Demo Credentials — pick a role above, or use directly</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary font-mono">
              {ROLES.map(r => (
                <div key={r.key}><span className="text-text-muted">{r.short}:</span> {r.badge}</div>
              ))}
            </div>
            <div className="text-[10px] text-text-muted mt-1">Password: demo1234</div>
          </div>
        </div>
      </div>
    </div>
  )
}
