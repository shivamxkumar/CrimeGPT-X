import { cn } from '@/lib/utils'

const sizeMap = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-11 h-11 text-sm' } as const

export function Avatar({ name, size = 'md', className }: { name?: string; size?: keyof typeof sizeMap; className?: string }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-brand flex items-center justify-center font-bold text-white flex-shrink-0',
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
