'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui'
import { Logo } from '@/components/ui/Logo'
import { motion } from 'framer-motion'
import { ShieldCheck, FileSearch, Fingerprint, ScanEye, KeyRound, Eye, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: FileSearch, title: 'FIR Upload & OCR', desc: 'Digitize FIRs instantly with entity extraction' },
  { icon: ShieldCheck, title: 'AI Legal Analysis', desc: 'BNS, BNSS & BSA section mapping with confidence scores' },
  { icon: Fingerprint, title: 'Evidence Vault', desc: 'Tamper-proof chain of custody for every artifact' },
  { icon: ScanEye, title: 'Cyber Detection', desc: 'Real-time fraud & phishing risk assessment' },
]

// Slow, ambient drift — decorative blobs behind a near-black panel, not a
// flat color wash, so white text stays high-contrast everywhere on top of it.
const blobDrift = (dx: number, dy: number, duration: number) => ({
  animate: { x: [0, dx, 0], y: [0, dy, 0], scale: [1, 1.15, 1] },
  transition: { duration, repeat: Infinity, ease: 'easeInOut' as const },
})

export default function LoginPage() {
  const [badge, setBadge] = useState('')
  const [password, setPassword] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const { login, isLoading, enterDemoMode } = useAuthStore()
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

  // No backend call, no credentials — populates the auth store with a mock
  // officer profile and flips isDemoMode, which the API client reads to
  // serve mock data everywhere instead of hitting the real backend.
  function handleViewDemo() {
    setDemoLoading(true)
    enterDemoMode()
    toast.success('Viewing live demo — sample data, fully read-only')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-[#060611]">
      {/* Left — brand panel: near-black base + slow-drifting glow blobs, so text contrast never depends on gradient position */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#060611] p-12 flex-col justify-between">
        <motion.div {...blobDrift(60, 40, 14)} className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-blue-500/30 blur-[110px]" />
        <motion.div {...blobDrift(-50, 60, 18)} className="absolute top-1/3 -right-32 w-[24rem] h-[24rem] rounded-full bg-purple-500/25 blur-[110px]" />
        <motion.div {...blobDrift(40, -40, 20)} className="absolute -bottom-32 left-1/4 w-[22rem] h-[22rem] rounded-full bg-indigo-500/20 blur-[110px]" />

        {/* Faint animated scan grid for a "live system" feel */}
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:44px_44px]" />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative z-10 flex items-center gap-3">
          <motion.div animate={{ opacity: [1, 0.75, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Logo size={40} />
          </motion.div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">CrimeGPT-X</div>
            <div className="text-[10px] text-white/60 tracking-widest uppercase">Police Intelligence Platform</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            From FIR to Arrest.<br />One intelligent platform.
          </h1>
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="h-[3px] w-24 bg-gradient-brand rounded-full mb-4 origin-left"
          />
          <p className="text-white/85 text-sm max-w-md leading-relaxed">
            AI-assisted investigation for the Gujarat Police Cyber Crime Branch — legal analysis, evidence
            management, and case intelligence in a single workspace.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="relative z-10 grid grid-cols-2 gap-4"
        >
          {FEATURES.map(f => (
            <motion.div
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl2 bg-black/30 border border-white/15 p-4 backdrop-blur-sm"
            >
              <f.icon size={18} className="text-white mb-2" />
              <div className="text-sm font-semibold text-white">{f.title}</div>
              <div className="text-[11px] text-white/80 mt-0.5 leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden bg-bg-base">
        <motion.div {...blobDrift(-40, 30, 16)} className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500/10 blur-[110px]" />
        <motion.div {...blobDrift(30, -30, 20)} className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-500/10 blur-[110px]" />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="relative z-10 w-full max-w-sm">
          {/* Mobile-only brand header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Logo size={36} />
            <div>
              <div className="text-lg font-bold tracking-tight">CrimeGPT-X</div>
              <div className="text-[10px] text-text-muted tracking-widest uppercase">Police Intelligence Platform</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h2>
            <p className="text-sm text-text-secondary mt-1">Sign in with your officer credentials to continue.</p>
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
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="w-full justify-center py-3 mt-2"
            >
              {!isLoading && <KeyRound size={16} />} Sign In
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-[10px] text-text-muted uppercase tracking-widest">
            <div className="flex-1 h-px bg-white/[0.08]" />
            or
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleViewDemo}
            disabled={demoLoading || isLoading}
            loading={demoLoading}
            className="w-full justify-center py-3 mt-4"
          >
            {!demoLoading && <Eye size={15} />} Explore Live Demo
          </Button>
          <div className="mt-2 text-center text-[11px] text-text-muted">
            20 sample cases, full AI analysis, evidence & reports — no sign-in required, fully read-only
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <Lock size={11} />
            Confidential — Unauthorized access is a cognizable offence
          </div>
        </motion.div>
      </div>
    </div>
  )
}
