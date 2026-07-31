'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const DEFAULT_STEPS = [
  'Reading the FIR narrative...',
  'Extracting entities and timeline...',
  'Mapping applicable BNS / BNSS / BSA sections...',
  'Cross-referencing similar judgments...',
  'Assessing risk and confidence...',
]

export function AIThinking({ steps = DEFAULT_STEPS, label = 'Gemini is analyzing' }: { steps?: string[]; label?: string }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % steps.length), 1400)
    return () => clearInterval(id)
  }, [steps.length])

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <Loader2 size={16} className="text-white animate-spin" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-text-primary">{label}</div>
          <div className="h-4 relative overflow-hidden mt-0.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-text-secondary absolute inset-0"
              >
                {steps[i]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="h-1 rounded-full bg-bg-hover overflow-hidden mt-4">
        <motion.div
          className="h-full bg-gradient-brand rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          style={{ width: '50%' }}
        />
      </div>
    </div>
  )
}
