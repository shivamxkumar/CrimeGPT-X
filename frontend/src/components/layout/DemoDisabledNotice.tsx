'use client'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Lock, ArrowRight } from 'lucide-react'

export default function DemoDisabledNotice({ feature }: { feature: string }) {
  return (
    <div className="card flex flex-col items-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
        <Lock size={24} className="text-accent-blue" />
      </div>
      <div className="font-semibold text-lg mb-1.5">{feature} is disabled in the demo</div>
      <div className="text-sm text-text-secondary max-w-md mb-6">
        This demo is read-only — creating or uploading new data isn&apos;t available. Explore the 20 pre-loaded
        sample cases instead, complete with FIR/OCR, AI legal analysis, evidence, and generated documents.
      </div>
      <Link href="/cases">
        <Button size="sm">Browse Sample Cases <ArrowRight size={13} /></Button>
      </Link>
    </div>
  )
}
