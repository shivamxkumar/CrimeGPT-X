'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(32rem,calc(100vw-2rem))]',
            'glass rounded-xl2 shadow-soft p-6 data-[state=open]:animate-scale-in focus:outline-none',
            className
          )}
        >
          {(title || description) && (
            <div className="mb-4">
              {title && <Dialog.Title className="text-base font-bold text-text-primary">{title}</Dialog.Title>}
              {description && <Dialog.Description className="text-sm text-text-secondary mt-1">{description}</Dialog.Description>}
            </div>
          )}
          {children}
          <Dialog.Close asChild>
            <button
              aria-label="Close"
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
