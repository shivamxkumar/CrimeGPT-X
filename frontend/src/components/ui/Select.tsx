'use client'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'input flex items-center justify-between gap-2 cursor-pointer data-[placeholder]:text-text-muted',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown size={14} className="text-text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        className={cn('glass rounded-xl shadow-soft p-1.5 z-50 min-w-[10rem] data-[state=open]:animate-scale-in', className)}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ children, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-text-secondary outline-none cursor-pointer',
        'data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-text-primary transition-colors',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator><Check size={14} className="text-accent-blue" /></SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
