'use client'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex items-center gap-1 p-1 rounded-xl bg-bg-card2 border border-white/[0.06]', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'px-3.5 py-1.5 text-sm font-medium rounded-lg text-text-secondary transition-all',
        'data-[state=active]:bg-gradient-brand data-[state=active]:text-white data-[state=active]:shadow-soft',
        'hover:text-text-primary data-[state=active]:hover:text-white',
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-4 animate-fade-in focus:outline-none', className)} {...props} />
}
