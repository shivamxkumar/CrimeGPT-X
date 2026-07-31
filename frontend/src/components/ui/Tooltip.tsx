'use client'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            'glass rounded-lg px-2.5 py-1.5 text-xs text-text-primary shadow-soft z-50',
            'data-[state=delayed-open]:animate-fade-in'
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-bg-card" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
