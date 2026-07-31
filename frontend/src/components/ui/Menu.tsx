'use client'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({ children, className, align = 'end' }: { children: ReactNode; className?: string; align?: 'start' | 'end' | 'center' }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={8}
        className={cn(
          'glass rounded-xl shadow-soft p-1.5 min-w-[12rem] z-50 data-[state=open]:animate-scale-in',
          className
        )}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({ children, className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-secondary outline-none cursor-pointer',
        'data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-text-primary transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="h-px bg-white/[0.06] my-1.5" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <DropdownMenuPrimitive.Label className="px-2.5 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wide">{children}</DropdownMenuPrimitive.Label>
}
